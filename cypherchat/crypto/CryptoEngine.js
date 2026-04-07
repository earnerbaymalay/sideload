/**
 * 🛡️ Cypherchat Crypto Engine — WebCrypto API
 * Maps 1:1 to the Android Kotlin crypto stack.
 * All operations run in-browser. Zero data leaves the device.
 */

const ALGO_AES_GCM = { name: 'AES-GCM', length: 256 };
const ALGO_HKDF = 'HKDF';
const ALGO_ECDH = { name: 'ECDH', namedCurve: 'P-256' };
const IV_SIZE = 12;
const VERSION = 0x01;

// ── Helpers ──

const Ok = (value) => ({ ok: true, value });
const Err = (error) => ({ ok: false, error });

// ── AES-256-GCM ──
// Envelope: [VERSION(1)] [IV(12)] [CIPHERTEXT+TAG]

export async function aesEncrypt(plaintext, key, aad = new Uint8Array()) {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: aad }, key, plaintext
    );
    plaintext.fill(0);
    const ct = new Uint8Array(ciphertext);
    const envelope = new Uint8Array(1 + IV_SIZE + ct.length);
    envelope[0] = VERSION;
    envelope.set(iv, 1);
    envelope.set(ct, 1 + IV_SIZE);
    return Ok(envelope);
  } catch (e) {
    return Err('AES-GCM encrypt failed: ' + e.message);
  }
}

export async function aesDecrypt(envelope, key, aad = new Uint8Array()) {
  try {
    if (envelope.length < 1 + IV_SIZE + 16) return Err('Envelope too short');
    if (envelope[0] !== VERSION) return Err('Unknown envelope version ' + envelope[0]);
    const iv = envelope.slice(1, 1 + IV_SIZE);
    const ct = envelope.slice(1 + IV_SIZE);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: aad }, key, ct
    );
    return Ok(new Uint8Array(plaintext));
  } catch (e) {
    return Err('AES-GCM decrypt failed: ' + e.message);
  }
}

// ── HKDF ──

export async function hkdfDerive(ikm, salt, info, outputLength) {
  try {
    const importKey = await crypto.subtle.importKey('raw', ikm, ALGO_HKDF, false, ['deriveBits']);
    const derivedBits = await crypto.subtle.deriveBits(
      { name: ALGO_HKDF, salt, info, hash: 'SHA-256' }, importKey, outputLength * 8
    );
    return Ok(new Uint8Array(derivedBits));
  } catch (e) {
    return Err('HKDF derive failed: ' + e.message);
  }
}

// ── ECDH P-256 ──

export async function ecdhGenerateKeyPair() {
  return crypto.subtle.generateKey(ALGO_ECDH, true, ['deriveBits', 'deriveKey']);
}

export async function ecdhSharedSecret(privateKey, publicKey) {
  try {
    const bits = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: publicKey }, privateKey, 256
    );
    return Ok(new Uint8Array(bits));
  } catch (e) {
    return Err('ECDH shared secret failed: ' + e.message);
  }
}

export async function ecdhExportPublicKey(key) {
  try {
    return Ok(new Uint8Array(await crypto.subtle.exportKey('raw', key)));
  } catch (e) {
    return Err('ECDH export public key failed: ' + e.message);
  }
}

export async function ecdhImportPublicKey(raw) {
  try {
    return Ok(await crypto.subtle.importKey('raw', raw, ALGO_ECDH, true, []));
  } catch (e) {
    return Err('ECDH import public key failed: ' + e.message);
  }
}

// ── Key Generation ──

export async function generateAesKey() {
  try {
    return Ok(await crypto.subtle.generateKey(ALGO_AES_GCM, true, ['encrypt', 'decrypt']));
  } catch (e) {
    return Err('AES key generation failed: ' + e.message);
  }
}

// ── Key Persistence (IndexedDB) ──

const DB_NAME = 'cypherchat_keys';
const DB_VERSION = 1;
const KEY_STORE = 'keys';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(KEY_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function storeKey(id, raw) {
  try {
    const db = await openDB();
    const tx = db.transaction(KEY_STORE, 'readwrite');
    tx.objectStore(KEY_STORE).put(raw, id);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    return Ok(undefined);
  } catch (e) {
    return Err('Store key failed: ' + e.message);
  }
}

export async function loadKey(id) {
  try {
    const db = await openDB();
    const tx = db.transaction(KEY_STORE, 'readonly');
    const req = tx.objectStore(KEY_STORE).get(id);
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result ? Ok(new Uint8Array(req.result)) : Ok(null));
      req.onerror = () => resolve(Err('Load key failed'));
    });
  } catch (e) {
    return Err('Load key failed: ' + e.message);
  }
}

// ── Double Ratchet ──

export async function kdfRootKey(rootKey, dhOutput) {
  try {
    const rootRaw = await crypto.subtle.exportKey('raw', rootKey);
    const material = await hkdfDerive(dhOutput, rootRaw, new TextEncoder().encode('WhisperRatchet'), 64);
    if (!material.ok) return Err(material.error);
    const [newRootKey, newChainKey] = await Promise.all([
      crypto.subtle.importKey('raw', material.value.slice(0, 32), ALGO_AES_GCM, false, ['encrypt', 'decrypt']),
      crypto.subtle.importKey('raw', material.value.slice(32, 64), ALGO_AES_GCM, false, ['deriveBits'])
    ]);
    return Ok({ newRootKey, newChainKey });
  } catch (e) {
    return Err('KDF root key failed: ' + e.message);
  }
}

export async function kdfChainKey(chainKey) {
  try {
    const raw = await crypto.subtle.exportKey('raw', chainKey);
    const [nkRaw, mkRaw] = await Promise.all([
      hkdfDerive(raw, new Uint8Array(), new TextEncoder().encode('ChainKey'), 32),
      hkdfDerive(raw, new Uint8Array(), new TextEncoder().encode('MessageKey'), 32),
    ]);
    if (!nkRaw.ok || !mkRaw.ok) return Err('KDF chain key failed');
    const [newChainKey, msgKey] = await Promise.all([
      crypto.subtle.importKey('raw', nkRaw.value, ALGO_AES_GCM, false, ['encrypt', 'decrypt']),
      crypto.subtle.importKey('raw', mkRaw.value, ALGO_AES_GCM, false, ['encrypt', 'decrypt']),
    ]);
    return Ok({ newChainKey, msgKey });
  } catch (e) {
    return Err('KDF chain key failed: ' + e.message);
  }
}

// ── SHA-256 Fingerprint ──

export async function fingerprint(raw) {
  const hash = await crypto.subtle.digest('SHA-256', raw);
  return Array.from(new Uint8Array(hash).slice(0, 6))
    .map(b => b.toString(16).padStart(2, '0')).join(' ');
}
