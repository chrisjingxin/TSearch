const fs = require('fs');
const path = require('path');
const os = require('os');

const STORE_DIR = path.join(os.homedir(), '.tabbit');
const STORE_FILE = path.join(STORE_DIR, 'credentials');
const CONFIG_FILE = path.join(STORE_DIR, 'config.json');
const SESSIONS_FILE = path.join(STORE_DIR, 'sessions.json');
const STATE_FILE = path.join(STORE_DIR, 'state.json');

function ensureDir() {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

function saveCookies(cookies) {
  ensureDir();
  const data = {
    cookies,
    savedAt: new Date().toISOString(),
  };
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function loadCookies() {
  if (!fs.existsSync(STORE_FILE)) return null;
  const raw = fs.readFileSync(STORE_FILE, 'utf-8');
  return JSON.parse(raw);
}

function clearCookies() {
  if (fs.existsSync(STORE_FILE)) {
    fs.unlinkSync(STORE_FILE);
  }
}

function buildCookieHeader(cookies) {
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

function getCookieValue(cookies, name) {
  const cookie = cookies.find(c => c.name === name);
  return cookie ? cookie.value : null;
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

function saveConfig(config) {
  ensureDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

function setConfig(key, value) {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
}

function getConfig(key) {
  return loadConfig()[key];
}

// Sessions management
function loadSessions() {
  if (!fs.existsSync(SESSIONS_FILE)) return [];
  return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
}

function saveSessions(sessions) {
  ensureDir();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
}

function addSession(session) {
  const sessions = loadSessions();
  const existing = sessions.findIndex(s => s.id === session.id);
  if (existing >= 0) {
    sessions[existing] = { ...sessions[existing], ...session };
  } else {
    sessions.unshift(session);
  }
  saveSessions(sessions);
}

// State management (current active session)
function loadState() {
  if (!fs.existsSync(STATE_FILE)) return {};
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
}

function saveState(state) {
  ensureDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function getCurrentSessionId() {
  return loadState().currentSessionId || null;
}

function setCurrentSessionId(sessionId) {
  const state = loadState();
  state.currentSessionId = sessionId;
  saveState(state);
}

function clearCurrentSessionId() {
  const state = loadState();
  delete state.currentSessionId;
  saveState(state);
}

module.exports = {
  saveCookies, loadCookies, clearCookies,
  buildCookieHeader, getCookieValue,
  loadConfig, saveConfig, setConfig, getConfig,
  loadSessions, saveSessions, addSession,
  loadState, saveState, getCurrentSessionId, setCurrentSessionId, clearCurrentSessionId,
};
