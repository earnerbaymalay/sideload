/**
 * IndexedDB message store — replaces Room + SQLCipher on the web.
 */
const DB_NAME = 'cypherchat_messages';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('messages')) {
        const s = db.createObjectStore('messages', { keyPath: 'id' });
        s.createIndex('conversation_id', 'conversationId');
        s.createIndex('timestamp', 'timestamp');
      }
      if (!db.objectStoreNames.contains('contacts')) {
        const s = db.createObjectStore('contacts', { keyPath: 'id' });
        s.createIndex('conversation_id', 'conversationId');
        s.createIndex('public_key_fingerprint', 'publicKeyFingerprint', { unique: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// ── Messages ──

export async function insertMessage(msg) {
  const db = await openDB();
  const tx = db.transaction('messages', 'readwrite');
  tx.objectStore('messages').add(msg);
  await txDone(tx);
}

export async function updateMessage(msg) {
  const db = await openDB();
  const tx = db.transaction('messages', 'readwrite');
  tx.objectStore('messages').put(msg);
  await txDone(tx);
}

export async function getMessages(conversationId) {
  const db = await openDB();
  const tx = db.transaction('messages', 'readonly');
  const index = tx.objectStore('messages').index('conversation_id');
  const req = index.getAll(IDBKeyRange.only(conversationId));
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result.sort((a, b) => a.timestamp - b.timestamp));
    req.onerror = () => reject(req.error);
  });
}

export async function getLastMessage(conversationId) {
  const msgs = await getMessages(conversationId);
  return msgs.length > 0 ? msgs[msgs.length - 1] : null;
}

export async function deleteMessage(id) {
  const db = await openDB();
  const tx = db.transaction('messages', 'readwrite');
  tx.objectStore('messages').delete(id);
  await txDone(tx);
}

// ── Contacts ──

export async function insertContact(contact) {
  const db = await openDB();
  const tx = db.transaction('contacts', 'readwrite');
  tx.objectStore('contacts').add(contact);
  await txDone(tx);
}

export async function updateContact(contact) {
  const db = await openDB();
  const tx = db.transaction('contacts', 'readwrite');
  tx.objectStore('contacts').put(contact);
  await txDone(tx);
}

export async function getAllContacts() {
  const db = await openDB();
  const tx = db.transaction('contacts', 'readonly');
  const req = tx.objectStore('contacts').getAll();
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getContactById(id) {
  const db = await openDB();
  const tx = db.transaction('contacts', 'readonly');
  const req = tx.objectStore('contacts').get(id);
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getContactByConversation(conversationId) {
  const db = await openDB();
  const tx = db.transaction('contacts', 'readonly');
  const index = tx.objectStore('contacts').index('conversation_id');
  const req = index.get(IDBKeyRange.only(conversationId));
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
