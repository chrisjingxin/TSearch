const inquirer = require('inquirer').default;
const ora = require('ora').default;
const { marked } = require('marked');
const { fetchSessions, sendMessage, createChatSession, parseSSEStream, loadCredentials, fetchModels } = require('../api');
const { getCurrentSessionId, setCurrentSessionId, addSession, getConfig } = require('../store');

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 30) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}

async function selectSession() {
  const spinner = ora('正在获取会话列表...').start();
  let remoteSessions = [];
  try {
    remoteSessions = await fetchSessions(1, 50);
  } catch {
    // ignore
  }
  spinner.stop();

  const choices = remoteSessions
    .filter(s => s.chat_session_title) // filter out empty sessions
    .map(s => ({
      name: `🌐 ${s.chat_session_title.slice(0, 35).padEnd(35)} ${formatTime(s.chat_session_update_time)}`,
      value: s.chat_session_id,
    }));

  choices.push(new inquirer.Separator());
  choices.push({ name: '← 返回', value: '__back__' });

  try {
    const { selected } = await inquirer.prompt([{
      type: 'select',
      name: 'selected',
      message: '选择会话:',
      choices,
      pageSize: 15,
    }]);
    return selected === '__back__' ? null : selected;
  } catch (err) {
    if (err.message?.includes('User force closed')) {
      console.log('\n👋 拜拜，下次见！');
      return null;
    }
    throw err;
  }
}

async function chatLoop(sessionId, sessionTitle, cookieHeader, model) {
  console.log(`\n进入会话: ${sessionTitle}`);
  console.log('输入 /new 新建, /switch 切换, /exit 退出\n');

  while (true) {
    let input;
    try {
      const answer = await inquirer.prompt([{
        type: 'input',
        name: 'input',
        message: '你:',
      }]);
      input = answer.input;
    } catch (err) {
      if (err.message?.includes('User force closed')) {
        console.log('\n👋 拜拜，下次见！');
        return;
      }
      throw err;
    }

    const trimmed = input.trim();
    if (!trimmed) continue;

    if (trimmed === '/exit') {
      console.log('👋 拜拜，下次见！');
      break;
    }

    if (trimmed === '/new') {
      const spinner = ora('正在创建新会话...').start();
      try {
        sessionId = await createChatSession(cookieHeader);
        sessionTitle = '新会话';
        setCurrentSessionId(sessionId);
        addSession({ id: sessionId, title: sessionTitle, updatedAt: new Date().toISOString() });
        spinner.succeed('已创建新会话');
      } catch (err) {
        spinner.fail(err.message);
      }
      continue;
    }

    if (trimmed === '/switch') {
      const newSessionId = await selectSession();
      if (newSessionId) {
        sessionId = newSessionId;
        setCurrentSessionId(sessionId);
        const remoteSessions = await fetchSessions(1, 100).catch(() => []);
        const found = remoteSessions.find(s => s.chat_session_id === sessionId);
        sessionTitle = found ? found.chat_session_title : '未知会话';
        console.log(`已切换到: ${sessionTitle}`);
      }
      continue;
    }

    // Send message
    const spinner = ora('正在等待回复...').start();
    try {
      const response = await sendMessage(sessionId, trimmed, cookieHeader, model);
      const raw = await parseSSEStream(response);
      spinner.stop();

      if (raw.trim()) {
        console.log(`\nTabbit: ${marked(raw)}`);
      } else {
        console.log('\nTabbit: (无回复内容)');
      }
    } catch (err) {
      spinner.fail(err.message);
    }
  }
}

async function chat() {
  const { cookieHeader } = loadCredentials();

  // Resolve model
  const modelInput = getConfig('model') || '最佳';
  let model = modelInput;
  try {
    const models = await fetchModels(cookieHeader);
    const matched = models.find(m =>
      m.display_name === modelInput ||
      m.display_name.toLowerCase() === modelInput.toLowerCase()
    );
    if (matched) model = matched.display_name;
  } catch {
    // use default
  }

  const currentSessionId = getCurrentSessionId();

  const choices = [];
  if (currentSessionId) {
    choices.push({ name: '继续当前会话', value: '__continue__' });
  }
  choices.push({ name: '选择历史会话', value: '__select__' });
  choices.push({ name: '新建会话', value: '__new__' });

  let mode;
  try {
    const answer = await inquirer.prompt([{
      type: 'select',
      name: 'mode',
      message: '选择模式:',
      choices,
    }]);
    mode = answer.mode;
  } catch (err) {
    if (err.message?.includes('User force closed')) {
      console.log('\n👋 拜拜，下次见！');
      return;
    }
    throw err;
  }

  let sessionId;
  let sessionTitle;

  if (mode === '__continue__') {
    sessionId = currentSessionId;
    // Try to get title from remote
    try {
      const remoteSessions = await fetchSessions(1, 100);
      const found = remoteSessions.find(s => s.chat_session_id === sessionId);
      sessionTitle = found ? found.chat_session_title : '当前会话';
    } catch {
      sessionTitle = '当前会话';
    }
  } else if (mode === '__select__') {
    sessionId = await selectSession();
    if (!sessionId) return;
    setCurrentSessionId(sessionId);
    try {
      const remoteSessions = await fetchSessions(1, 100);
      const found = remoteSessions.find(s => s.chat_session_id === sessionId);
      sessionTitle = found ? found.chat_session_title : '历史会话';
    } catch {
      sessionTitle = '历史会话';
    }
  } else {
    // New session
    const spinner = ora('正在创建新会话...').start();
    try {
      sessionId = await createChatSession(cookieHeader);
      sessionTitle = '新会话';
      setCurrentSessionId(sessionId);
      addSession({ id: sessionId, title: sessionTitle, updatedAt: new Date().toISOString() });
      spinner.succeed('已创建新会话');
    } catch (err) {
      spinner.fail(err.message);
      return;
    }
  }

  await chatLoop(sessionId, sessionTitle, cookieHeader, model);
}

module.exports = { chat };
