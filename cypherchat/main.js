import * as crypto from './crypto/CryptoEngine.js';
import * as db from './db/MessageStore.js';

// ── State ──
let pinHash = null;
let currentConversationId = null;
let currentContact = null;

// ── DOM refs ──
const $ = (sel) => document.querySelector(sel);

const pinScreen = $('#pin-screen');
const pinDots = document.querySelectorAll('.pin-dot');
const pinSubtitle = $('#pin-subtitle');
const pinError = $('#pin-error');
const keypad = $('#pin-keypad');

const listScreen = $('#list-screen');
const listEmpty = $('#list-empty');
const listContent = $('#list-content');
const btnNewChat = $('#btn-new-chat');

const chatScreen = $('#chat-screen');
const btnBack = $('#btn-back');
const chatContactName = $('#chat-contact-name');
const messagesEl = $('#messages');
const messageInput = $('#message-input');
const btnSend = $('#btn-send');

const settingsScreen = $('#settings-screen');
const btnSettingsBack = $('#btn-settings-back');
const btnExport = $('#btn-export');
const btnClear = $('#btn-clear');

// ── Navigation ──
function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// ── PIN ──
let pinBuffer = '';

async function initPin() {
  const stored = await crypto.loadKey('pin_hash');
  if (stored.ok && stored.value) {
    pinHash = new TextDecoder().decode(stored.value);
    pinSubtitle.textContent = 'Enter your PIN';
  } else {
    pinSubtitle.textContent = 'Set a 4-digit PIN';
  }
}

keypad.addEventListener('click', async (e) => {
  const target = e.target.closest('.pin-key');
  if (!target) return;
  const key = target.getAttribute('data-key');
  if (!key || key === '⌫') {
    if (key === '⌫' && pinBuffer.length > 0) {
      pinBuffer = pinBuffer.slice(0, -1);
      updateDots();
    }
    return;
  }
  if (pinBuffer.length >= 4) return;
  pinBuffer += key;
  updateDots();
  if (pinBuffer.length === 4) await handlePinSubmit(pinBuffer);
});

function updateDots() {
  pinDots.forEach((dot, i) => {
    dot.classList.toggle('filled', i < pinBuffer.length);
    dot.classList.remove('error');
  });
}

async function handlePinSubmit(pin) {
  const pinBytes = new TextEncoder().encode(pin);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', pinBytes));

  if (!pinHash) {
    pinHash = new TextDecoder().decode(hash);
    await crypto.storeKey('pin_hash', hash);
    pinSubtitle.textContent = 'PIN set! Enter to confirm';
    pinBuffer = '';
    updateDots();
    return;
  }

  const storedBytes = new TextEncoder().encode(pinHash);
  const match = storedBytes.length === hash.length && storedBytes.every((b, i) => b === hash[i]);

  if (match) {
    pinBuffer = '';
    updateDots();
    await loadConversationList();
    showScreen(listScreen);
  } else {
    pinError.textContent = 'Incorrect PIN';
    pinDots.forEach(d => d.classList.add('error'));
    setTimeout(() => { pinBuffer = ''; updateDots(); pinError.textContent = ''; }, 800);
  }
}

// ── Conversation List ──
async function loadConversationList() {
  const contacts = await db.getAllContacts();
  if (contacts.length === 0) {
    listEmpty.style.display = 'flex';
    listContent.innerHTML = '';
    return;
  }
  listEmpty.style.display = 'none';
  listContent.innerHTML = '';

  for (const contact of contacts) {
    const lastMsg = await db.getLastMessage(contact.conversationId);
    const row = document.createElement('div');
    row.className = 'chat-row';
    row.innerHTML = `
      <div class="chat-avatar">${contact.displayName[0].toUpperCase()}</div>
      <div class="chat-info">
        <div class="chat-info-top">
          <span class="chat-name">${escapeHtml(contact.displayName)}
            ${contact.verified ? '<span class="verified-dot"></span>' : ''}</span>
          <span class="chat-time">${lastMsg ? formatTime(lastMsg.timestamp) : ''}</span>
        </div>
        <div class="chat-preview">${lastMsg ? '🔒 Encrypted message' : 'Start a conversation'}</div>
      </div>`;
    row.addEventListener('click', () => openConversation(contact));
    listContent.appendChild(row);
  }
}

btnNewChat.addEventListener('click', async () => {
  const name = prompt('Contact name:');
  if (!name) return;
  const keyPair = await crypto.ecdhGenerateKeyPair();
  const pubRaw = await crypto.ecdhExportPublicKey(keyPair.publicKey);
  if (!pubRaw.ok) return;
  const fp = await crypto.fingerprint(pubRaw.value);
  const conversationId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
  const contact = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + 'c',
    displayName: name,
    publicKeyFingerprint: fp,
    publicKeyBytes: pubRaw.value,
    conversationId, createdAt: Date.now(), lastSeen: 0, verified: false, simplexAddress: null
  };
  await db.insertContact(contact);
  await loadConversationList();
});

// ── Conversation ──
async function openConversation(contact) {
  currentContact = contact;
  currentConversationId = contact.conversationId;
  chatContactName.textContent = contact.displayName;
  await renderMessages();
  showScreen(chatScreen);
  messageInput.focus();
}

async function renderMessages() {
  if (!currentConversationId) return;
  const stored = await db.getMessages(currentConversationId);
  messagesEl.innerHTML = '';
  for (const msg of stored) {
    const div = document.createElement('div');
    div.className = 'message ' + (msg.isOutgoing ? 'outgoing' : 'incoming');
    div.innerHTML = `
      <div class="bubble">🔒 ${msg.isOutgoing ? 'Sent' : 'Received'} encrypted message</div>
      <div class="message-meta">
        <span>${formatTime(msg.timestamp)}</span>
        ${msg.isOutgoing && msg.delivered ? '<span class="delivered">✓✓</span>' : ''}
      </div>`;
    messagesEl.appendChild(div);
  }
  scrollToBottom();
}

btnBack.addEventListener('click', () => {
  currentConversationId = null;
  currentContact = null;
  loadConversationList();
  showScreen(listScreen);
});

btnSend.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
  btnSend.disabled = !messageInput.value.trim();
});

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentConversationId) return;
  messageInput.value = '';
  messageInput.style.height = 'auto';
  btnSend.disabled = true;

  const msg = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    conversationId: currentConversationId,
    senderKeyFingerprint: currentContact?.publicKeyFingerprint || 'local',
    encryptedContent: new TextEncoder().encode(text),
    timestamp: Date.now(), isOutgoing: true, delivered: false, read: false,
    sendMsgNum: 0, ratchetKey: null
  };
  await db.insertMessage(msg);
  await renderMessages();
}

function scrollToBottom() {
  requestAnimationFrame(() => { messagesEl.scrollTop = messagesEl.scrollHeight; });
}

// ── Settings ──
btnSettingsBack.addEventListener('click', () => showScreen(listScreen));

btnExport.addEventListener('click', async () => {
  const contacts = await db.getAllContacts();
  const data = { exported: new Date().toISOString(), conversations: [] };
  for (const c of contacts) {
    const msgs = await db.getMessages(c.conversationId);
    data.conversations.push({
      contact: { name: c.displayName, fingerprint: c.publicKeyFingerprint },
      messages: msgs.map(m => ({ timestamp: m.timestamp, isOutgoing: m.isOutgoing, delivered: m.delivered }))
    });
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'cypherchat-export-' + Date.now() + '.json';
  a.click(); URL.revokeObjectURL(url);
});

btnClear.addEventListener('click', async () => {
  if (confirm('Delete ALL data? This cannot be undone.')) {
    indexedDB.deleteDatabase('cypherchat_messages');
    indexedDB.deleteDatabase('cypherchat_keys');
    location.reload();
  }
});

// ── Helpers ──
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Service Worker ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/cypherchat/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));
  });
}

// ── Init ──
await initPin();
showScreen(pinScreen);
