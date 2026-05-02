const fs = require('fs');
const path = require('path');
const os = require('os');
const inquirer = require('inquirer').default;
const ora = require('ora').default;
const { fetchSessions, fetchMessages } = require('../api');

const EXPORT_DIR = path.join(os.homedir(), '.tabbit', 'exports');

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

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_').slice(0, 50);
}

function generateMarkdown(title, messages) {
  const now = new Date().toLocaleString('zh-CN');
  let md = `# ${title}\n\n`;
  md += `> 导出时间: ${now}\n\n`;
  md += `---\n\n`;

  for (const msg of messages) {
    const role = msg.role === 'user' ? '👤 用户' : '✨ Tabbit';
    md += `## ${role}\n\n${msg.content}\n\n`;
  }

  return md;
}

async function exportSession(sessionId, title) {
  const spinner = ora('正在获取对话内容...').start();

  try {
    const messages = await fetchMessages(sessionId);
    spinner.stop();

    if (messages.length === 0) {
      console.log('该会话没有对话内容');
      return;
    }

    const md = generateMarkdown(title, messages);

    // Ensure export directory exists
    if (!fs.existsSync(EXPORT_DIR)) {
      fs.mkdirSync(EXPORT_DIR, { recursive: true });
    }

    const filename = sanitizeFilename(title) + '.md';
    const filepath = path.join(EXPORT_DIR, filename);

    fs.writeFileSync(filepath, md, 'utf-8');
    console.log(`✓ 已导出到: ${filepath}`);
    console.log(`  共 ${messages.length} 条消息`);
  } catch (err) {
    spinner.fail(err.message);
  }
}

async function exportCmd(sessionId) {
  // If sessionId provided, export directly
  if (sessionId) {
    const spinner = ora('正在获取会话列表...').start();
    try {
      const sessions = await fetchSessions(1, 100);
      spinner.stop();
      const session = sessions.find(s => s.chat_session_id === sessionId);
      const title = session ? session.chat_session_title || '未命名会话' : sessionId;
      await exportSession(sessionId, title);
    } catch (err) {
      spinner.fail(err.message);
    }
    return;
  }

  // Interactive mode
  const spinner = ora('正在获取会话列表...').start();
  let sessions;
  try {
    sessions = await fetchSessions(1, 50);
  } catch (err) {
    spinner.fail(err.message);
    return;
  }
  spinner.stop();

  // Filter out empty sessions
  sessions = sessions.filter(s => s.chat_session_title);

  if (sessions.length === 0) {
    console.log('没有可导出的会话');
    return;
  }

  const choices = sessions.map(s => ({
    name: `🌐 ${s.chat_session_title.slice(0, 35).padEnd(35)} ${formatTime(s.chat_session_update_time)}`,
    value: s.chat_session_id,
  }));

  choices.push(new inquirer.Separator());
  choices.push({ name: '← 返回', value: '__back__' });

  let selected;
  try {
    const answer = await inquirer.prompt([{
      type: 'select',
      name: 'selected',
      message: '选择要导出的会话:',
      choices,
      pageSize: 15,
    }]);
    selected = answer.selected;
  } catch (err) {
    if (err.message?.includes('User force closed')) {
      console.log('\n👋 拜拜，下次见！');
      return;
    }
    throw err;
  }

  if (selected === '__back__') return;

  const session = sessions.find(s => s.chat_session_id === selected);
  const title = session ? session.chat_session_title : '未命名会话';

  await exportSession(selected, title);
}

module.exports = { export: exportCmd };
