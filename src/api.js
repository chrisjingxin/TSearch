const crypto = require('crypto');
const { marked } = require('marked');
const TerminalRenderer = require('marked-terminal').default;
const ora = require('ora').default;
const { loadCookies, getCookieValue, getConfig } = require('./store');

class CustomRenderer extends TerminalRenderer {
  heading(text, level) {
    if (typeof text === 'object') {
      level = text.depth;
      text = this.parser.parseInline(text.tokens);
    }
    text = this.transform(text);
    const colors = {
      1: '\x1b[91m', // bright red
      2: '\x1b[92m', // bright green
      3: '\x1b[93m', // bright yellow
      4: '\x1b[94m', // bright blue
      5: '\x1b[95m', // bright magenta
      6: '\x1b[96m', // bright cyan
    };
    const color = colors[level] || '\x1b[96m';
    return `\n\x1b[1m${color}▶ ${text}\x1b[0m\n`;
  }
  strong(token) {
    const text = typeof token === 'object' ? this.parser.parseInline(token.tokens) : token;
    // Use reverse video (swaps fg/bg) for guaranteed visual bold
    return `\x1b[7m ${text} \x1b[0m`;
  }
  em(token) {
    const text = typeof token === 'object' ? this.parser.parseInline(token.tokens) : token;
    return `\x1b[4m${text}\x1b[0m`;
  }
  codespan(token) {
    const text = typeof token === 'object' ? token.text : token;
    return `\x1b[36m\x1b[4m${text}\x1b[0m`;
  }
}

marked.setOptions({ renderer: new CustomRenderer({ showSectionPrefix: false }) });

const BASE_URL = 'https://web.tabbitbrowser.com';
const CLIENT_ID = 'e7fa44387b1238ef1f6f';

async function fetchModels(cookieHeader) {
  const res = await fetch(`${BASE_URL}/proxy/v1/model_config/models?a=0`, {
    headers: buildHeaders('/newtab', cookieHeader),
  });
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);
  const data = await res.json();
  return data.models || [];
}

function getChromeVersion() {
  try {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const vFile = path.join(os.homedir(), 'Library', 'Application Support', 'Tabbit', 'RunningChromeVersion');
    return fs.readFileSync(vFile, 'utf-8').trim().split('.')[0];
  } catch {
    return '147';
  }
}

const CHROME_VERSION = getChromeVersion();

function extractUserId(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload + '==', 'base64url').toString());
    return decoded.id || decoded.sub || '';
  } catch {
    return '';
  }
}

function loadCredentials() {
  const stored = loadCookies();
  if (!stored || !stored.cookies || stored.cookies.length === 0) {
    throw new Error('Not logged in. Run `tabbit login` first.');
  }
  const cookies = stored.cookies;
  const token = getCookieValue(cookies, 'token');
  const nextAuth = getCookieValue(cookies, 'next-auth.session-token');
  const userId = getCookieValue(cookies, 'user_id');

  if (!token) {
    throw new Error('Token cookie not found. Run `tabbit login` again.');
  }

  const cookieHeader = [
    `token=${token}`,
    `user_id=${userId || ''}`,
    'managed=tab_browser',
    'NEXT_LOCALE=zh',
    nextAuth ? `next-auth.session-token=${nextAuth}` : null,
  ].filter(Boolean).join('; ');

  return { cookieHeader, token, userId };
}

function buildHeaders(refererPath, cookieHeader, extra = {}) {
  return {
    'User-Agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_VERSION}.0.0.0 Safari/537.36`,
    'sec-ch-ua': `"Tabbit";v="${CHROME_VERSION}", "Not.A/Brand";v="8", "Chromium";v="${CHROME_VERSION}"`,
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'Cookie': cookieHeader,
    'Referer': `${BASE_URL}${refererPath}`,
    ...extra,
  };
}

async function createChatSession(cookieHeader) {
  const url = new URL(`${BASE_URL}/chat/new`);
  url.searchParams.set('_rsc', 'auto');

  const res = await fetch(url.toString(), {
    headers: {
      ...buildHeaders('/chat/new', cookieHeader),
      'rsc': '1',
    },
  });

  if (res.status === 401) {
    throw new Error('Session expired. Run `tabbit login` again.');
  }

  const text = await res.text();
  const match = text.match(/\/chat\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
  if (!match) {
    throw new Error('Failed to create chat session. Response: ' + text.slice(0, 200));
  }
  return match[1];
}

async function sendMessage(sessionId, content, cookieHeader, model = '最佳') {
  const payload = {
    chat_session_id: sessionId,
    message_id: null,
    content,
    selected_model: model,
    parallel_group_id: null,
    task_name: 'chat',
    agent_mode: false,
    metadatas: { html_content: `<p>${content}</p>` },
    references: [],
    entity: {
      key: 'd41d8cd98f00b204e9800998ecf8427e',
      extras: { type: 'tab', url: '' },
    },
  };

  const timestamp = Date.now();

  const res = await fetch(`${BASE_URL}/api/v1/chat/completion`, {
    method: 'POST',
    headers: {
      ...buildHeaders(`/chat/${sessionId}`, cookieHeader),
      'Accept': 'text/event-stream',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'x-req-ctx': Buffer.from('0.30.32(10030032)').toString('base64'),
      'x-nonce': crypto.randomBytes(32).toString('hex').slice(0, 64),
      'trace-id': crypto.randomUUID(),
      'x-timestamp': String(timestamp),
      'unique-uuid': crypto.randomUUID(),
      'x-signature': crypto.randomUUID(),
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    throw new Error('Session expired. Run `tabbit login` again.');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tabbit API error ${res.status}: ${text}`);
  }

  return res;
}

function parseSSEStream(response) {
  return new Promise((resolve, reject) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = '';
    const texts = [];

    function processChunk({ done, value }) {
      if (done) {
        resolve(texts.join(''));
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith('data:') && currentEvent) {
          const dataStr = line.slice(5).trim();
          try {
            const data = JSON.parse(dataStr);
            const chunk = data.text ?? data.content ?? data.delta?.content ?? data.message?.content ?? '';
            if (chunk) texts.push(chunk);
          } catch {
            // non-JSON data line, skip
          }
          currentEvent = '';
        }
      }

      reader.read().then(processChunk).catch(reject);
    }

    reader.read().then(processChunk).catch(reject);
  });
}

async function search(query, opts = {}) {
  const { cookieHeader } = loadCredentials();

  // Resolve model: -m flag > config > default "最佳"
  const modelInput = opts.model || getConfig('model') || '最佳';
  const spinner = ora('正在解析模型...').start();

  try {
    const models = await fetchModels(cookieHeader);
    const matched = models.find(m =>
      m.display_name === modelInput ||
      m.display_name.toLowerCase() === modelInput.toLowerCase()
    );
    const model = matched ? matched.display_name : modelInput;
    spinner.text = `正在创建会话 (${model})...`;

    // Step 1: Create chat session
    const sessionId = await createChatSession(cookieHeader);
    spinner.text = '正在等待回复...';

    // Step 2: Send message via /api/v1/chat/completion
    const response = await sendMessage(sessionId, query, cookieHeader, model);

    // Step 3: Parse SSE stream
    const raw = await parseSSEStream(response);
    spinner.stop();

    // Step 4: Render markdown
    if (raw.trim()) {
      console.log(marked(raw));
    } else {
      console.log('(无回复内容)');
    }
  } catch (err) {
    spinner.fail(err.message);
    process.exit(1);
  }
}

async function fetchSessions(page = 1, size = 50) {
  const { cookieHeader } = loadCredentials();

  // Use a POST to the chat endpoint with next-action header
  const res = await fetch(`${BASE_URL}/chat/new`, {
    method: 'POST',
    headers: {
      ...buildHeaders('/chat/new', cookieHeader),
      'Content-Type': 'text/plain;charset=UTF-8',
      'next-action': '602fa44bc5a62d65f9a29810acd8fb8cfbc19d10ae',
    },
    body: JSON.stringify(['$undefined', { page, size }]),
  });

  if (res.status === 401) {
    throw new Error('Session expired. Run `tabbit login` again.');
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch sessions: ${res.status}`);
  }

  const text = await res.text();

  // Parse RSC response - extract JSON data
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('1:')) {
      try {
        const jsonStr = line.slice(2);
        const result = JSON.parse(jsonStr);
        if (result.success && result.data) {
          return result.data;
        }
      } catch {
        // continue
      }
    }
  }

  return [];
}

async function fetchMessages(sessionId) {
  const { cookieHeader } = loadCredentials();

  const res = await fetch(`${BASE_URL}/chat/${sessionId}?_rsc=12345`, {
    headers: {
      ...buildHeaders(`/chat/${sessionId}`, cookieHeader),
      'rsc': '1',
    },
  });

  if (res.status === 401) {
    throw new Error('Session expired. Run `tabbit login` again.');
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch messages: ${res.status}`);
  }

  const text = await res.text();

  // Parse RSC response
  // T blocks can be at start of line or embedded in line after other content
  const tBlocks = {};
  const tBlockPattern = /([0-9a-f]+):T[0-9a-f]+,([^]*?)(?=\n|$|(?=[0-9a-f]+:T[0-9a-f]+,))/g;
  let match;
  while ((match = tBlockPattern.exec(text)) !== null) {
    tBlocks[match[1]] = match[2];
  }

  // Also try line-by-line extraction for blocks at start of lines
  const lines = text.split('\n');
  for (const line of lines) {
    const lineMatch = line.match(/^([0-9a-f]+):T[0-9a-f]+,(.*)/);
    if (lineMatch) {
      tBlocks[lineMatch[1]] = lineMatch[2];
    }
    // Also check for T blocks embedded after other content
    const embeddedMatch = line.match(/([0-9a-f]+):T[0-9a-f]+,(.*)/);
    if (embeddedMatch && !tBlocks[embeddedMatch[1]]) {
      tBlocks[embeddedMatch[1]] = embeddedMatch[2];
    }
  }

  // Extract messages array
  const messagesStart = text.indexOf('"messages":[{');
  if (messagesStart === -1) return [];

  // Find the end of the array by looking for ],"sessionTitle"
  const sessionTitleIndex = text.indexOf('],"sessionTitle"', messagesStart);
  if (sessionTitleIndex === -1) return [];

  // Extract the array content
  const arrayStart = messagesStart + 11; // Length of '"messages":['
  const messagesStr = text.slice(arrayStart, sessionTitleIndex + 1);

  try {
    const messagesJson = JSON.parse(messagesStr);
    const result = [];

    for (const msg of messagesJson) {
      if (msg.type === 'user') {
        result.push({ role: 'user', content: msg.content });
      } else if (msg.type === 'assistant') {
        // AI reply content is a reference like "$1a"
        const ref = msg.messages?.[0]?.content;
        if (ref && ref.startsWith('$')) {
          const key = ref.slice(1);
          const content = tBlocks[key] || '(内容解析失败)';
          result.push({ role: 'assistant', content });
        }
      }
    }

    return result;
  } catch {
    // Fallback: return T blocks as assistant messages
    return Object.values(tBlocks).map(content => ({ role: 'assistant', content }));
  }
}

async function listModels() {
  const { cookieHeader } = loadCredentials();
  const spinner = ora('正在获取模型列表...').start();
  const models = await fetchModels(cookieHeader);
  spinner.stop();
  console.log('可用模型:\n');
  for (const m of models) {
    const flags = [];
    if (m.supports_images) flags.push('图片');
    if (m.supports_tools) flags.push('工具');
    if (m.support_thinking) flags.push('思考');
    const info = flags.length ? ` [${flags.join(', ')}]` : '';
    console.log(`  ${m.display_name.padEnd(20)} ${m.description}${info}`);
  }
  console.log('\n使用方式: tabbit search -m <模型名> "搜索内容"');
}

module.exports = { search, listModels, fetchModels, fetchSessions, fetchMessages, sendMessage, createChatSession, parseSSEStream, loadCredentials };
