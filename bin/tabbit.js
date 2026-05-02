#!/usr/bin/env node

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n👋 拜拜，下次见！');
  process.exit(0);
});

const { Command } = require('commander');
const { login } = require('../src/commands/login');
const { search } = require('../src/commands/search');
const { models } = require('../src/commands/models');
const { config } = require('../src/commands/config');
const { logout } = require('../src/commands/logout');
const { sessions } = require('../src/commands/sessions');
const { chat } = require('../src/commands/chat');

const program = new Command();

program
  .name('tabbit')
  .description('Tabbit 浏览器 CLI 工具')
  .version('0.1.0');

program
  .command('login')
  .description('通过 Tabbit 浏览器登录')
  .action(login);

program
  .command('search <query>')
  .description('使用 Tabbit 搜索')
  .option('-m, --model <model>', '指定模型 (默认: 最佳)')
  .action(search);

program
  .command('models')
  .description('列出可用模型')
  .action(models);

program
  .command('config [key] [value]')
  .description('查看或设置配置 (如: tabbit config model Claude-Opus-4.7)')
  .action(config);

program
  .command('logout')
  .description('清除已保存的登录凭证')
  .action(logout);

program
  .command('sessions')
  .description('查看并选择历史会话')
  .action(sessions);

program
  .command('chat')
  .description('进入多轮对话模式')
  .action(chat);

program.parse();
