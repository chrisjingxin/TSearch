const inquirer = require('inquirer').default;
const ora = require('ora').default;
const { fetchSessions } = require('../api');
const { loadSessions, saveSessions, getCurrentSessionId, setCurrentSessionId, clearCurrentSessionId } = require('../store');

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

async function sessions() {
  const spinner = ora('正在获取会话列表...').start();

  let remoteSessions = [];
  try {
    remoteSessions = await fetchSessions(1, 50);
  } catch (err) {
    spinner.fail(`获取远程会话失败: ${err.message}`);
    return;
  }
  spinner.stop();

  const localSessions = loadSessions();
  const currentSessionId = getCurrentSessionId();

  // Merge: remote sessions first, then local-only sessions
  const sessionMap = new Map();

  // Add remote sessions (filter out empty sessions with no title)
  for (const s of remoteSessions) {
    if (!s.chat_session_title) continue; // skip "new tab" sessions with no content
    sessionMap.set(s.chat_session_id, {
      id: s.chat_session_id,
      title: s.chat_session_title,
      updatedAt: s.chat_session_update_time,
      source: 'remote',
    });
  }

  // Add local sessions that aren't in remote
  for (const s of localSessions) {
    if (!sessionMap.has(s.id)) {
      sessionMap.set(s.id, {
        ...s,
        source: 'local',
      });
    }
  }

  const allSessions = Array.from(sessionMap.values())
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  if (allSessions.length === 0) {
    console.log('暂无历史会话。使用 `tabbit chat` 创建新会话。');
    return;
  }

  // Build choices
  const choices = [];
  for (const s of allSessions) {
    const icon = s.source === 'remote' ? '🌐' : '💻';
    const current = s.id === currentSessionId ? ' (当前)' : '';
    const title = s.title.length > 30 ? s.title.slice(0, 30) + '...' : s.title;
    choices.push({
      name: `${icon} ${title}${current.padEnd(8)} ${formatTime(s.updatedAt)}`,
      value: s.id,
    });
  }

  choices.push(new inquirer.Separator());
  choices.push({ name: '× 清除当前会话', value: '__clear__' });

  let selected;
  try {
    const answer = await inquirer.prompt([
      {
        type: 'select',
        name: 'selected',
        message: '选择会话:',
        choices,
        pageSize: 15,
      },
    ]);
    selected = answer.selected;
  } catch (err) {
    if (err.message?.includes('User force closed')) {
      console.log('\n👋 拜拜，下次见！');
      return;
    }
    throw err;
  }

  if (selected === '__clear__') {
    clearCurrentSessionId();
    console.log('✓ 已清除当前会话');
  } else {
    setCurrentSessionId(selected);
    const session = allSessions.find(s => s.id === selected);
    if (session) {
      console.log(`✓ 已切换到会话: ${session.title}`);
    } else {
      console.log(`✓ 已切换到会话: ${selected}`);
    }
    console.log('  使用 `tabbit chat` 开始对话');
  }
}

module.exports = { sessions };
