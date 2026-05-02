const WebSocket = require('ws');

let _msgId = 0;

function connectCDP(wsEndpoint) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsEndpoint);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++_msgId;
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        ws.off('message', handler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function getTargets(ws) {
  const result = await sendCommand(ws, 'Target.getTargets');
  return result.targetInfos;
}

async function attachToTarget(ws, targetId) {
  const result = await sendCommand(ws, 'Target.attachToTarget', { targetId, flatten: true });
  return result.sessionId;
}

async function sendCommandToSession(ws, sessionId, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++_msgId;
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        ws.off('message', handler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

async function getCookies(ws, urls, sessionId) {
  const params = { urls };
  const result = sessionId
    ? await sendCommandToSession(ws, sessionId, 'Network.getCookies', params)
    : await sendCommand(ws, 'Network.getCookies', params);
  return result.cookies;
}

async function navigate(ws, url) {
  return sendCommand(ws, 'Page.navigate', { url });
}

async function createTarget(ws, url) {
  const result = await sendCommand(ws, 'Target.createTarget', { url });
  return result.targetId;
}

function close(ws) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
}

module.exports = {
  connectCDP, sendCommand, sendCommandToSession,
  getTargets, attachToTarget, getCookies,
  navigate, createTarget, close,
};
