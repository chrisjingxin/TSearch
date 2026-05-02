const fs = require('fs');
const path = require('path');
const os = require('os');

const CANDIDATE_PATHS = [
  path.join(os.homedir(), 'Library', 'Application Support', 'Tabbit', 'DevToolsActivePort'),
  path.join(os.homedir(), 'Library', 'Application Support', 'Tabbit Browser', 'DevToolsActivePort'),
];

function findActivePortFile() {
  for (const p of CANDIDATE_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function parseActivePortFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parts = raw.split('\n').map(l => l.trim()).filter(Boolean);
  if (parts.length < 2) {
    throw new Error(`Invalid DevToolsActivePort file: ${filePath}`);
  }
  const port = parseInt(parts[0], 10);
  const browserPath = parts[1];
  return {
    activePortFile: filePath,
    port,
    browserPath,
    browserUrl: `http://127.0.0.1:${port}`,
    wsEndpoint: `ws://127.0.0.1:${port}${browserPath}`,
  };
}

function waitForActivePortFile(waitSeconds = 0, pollIntervalMs = 250) {
  const deadline = Date.now() + Math.max(waitSeconds, 0) * 1000;
  while (true) {
    const filePath = findActivePortFile();
    if (filePath) return parseActivePortFile(filePath);
    if (Date.now() >= deadline) {
      const searched = CANDIDATE_PATHS.join(', ');
      throw new Error(
        `DevToolsActivePort not found. Searched: ${searched}\n` +
        'Make sure Tabbit is open and remote debugging is enabled at tabbit://inspect/#remote-debugging'
      );
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, pollIntervalMs);
  }
}

module.exports = { findActivePortFile, parseActivePortFile, waitForActivePortFile };
