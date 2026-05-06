# Tabbit CLI

**Tabbit CLI** 是 [Tabbit 浏览器](https://tabbitbrowser.com) 的命令行工具，将 AI 对话和搜索能力带到终端中。支持传统 CLI 命令和基于 [OpenTUI](https://opentui.dev) 构建的 TUI 图形界面。

[English](./README_EN.md)

### 功能特性

- **AI 对话** — 支持多轮对话，可选多种 AI 模型
- **搜索** — 通过 `tabbit search` 进行一次性提问
- **会话管理** — 浏览、切换、继续历史会话
- **模型选择** — 从可用模型中选择（或使用"最佳"自动选择）
- **导出** — 将对话历史导出为 Markdown 文件
- **TUI 界面** — 完整的终端图形界面，支持语法高亮的 Markdown 渲染、流式响应、思考过程展示

### 安装

```bash
npm install -g tabbit-cli
```

使用 TUI 模式需要额外安装 [Bun](https://bun.sh)：

```bash
curl -fsSL https://bun.sh/install | bash
```

### 快速开始

```bash
# 通过 Tabbit 浏览器登录
tabbit login

# 提问
tabbit search "什么是 Tabbit？"

# 进入多轮对话
tabbit chat

# 启动终端图形界面
tabbit tui
```

### 命令列表

| 命令 | 说明 |
|------|------|
| `tabbit login` | 通过 Tabbit 浏览器登录 |
| `tabbit logout` | 清除已保存的登录凭证 |
| `tabbit search <query>` | 一次性 AI 搜索 |
| `tabbit chat` | 多轮对话模式 |
| `tabbit sessions` | 浏览并选择历史会话 |
| `tabbit models` | 列出可用的 AI 模型 |
| `tabbit config [key] [value]` | 查看或设置配置 |
| `tabbit export [sessionId]` | 将对话导出为 Markdown |
| `tabbit tui` | 启动终端图形界面（需要 Bun） |

### 使用示例

```bash
# 指定模型搜索
tabbit search -m Claude-Opus-4.7 "解释一下量子计算"

# 设置默认模型
tabbit config model Claude-Opus-4.7

# 导出指定会话
tabbit export <session-id>
```

### TUI 快捷键

| 按键 | 功能 |
|------|------|
| `Enter` | 发送消息 |
| `Shift+Enter` | 换行 |
| `Ctrl+N` | 新建会话 |
| `Ctrl+L` | 会话列表 |
| `Ctrl+M` | 模型选择 |
| `Esc` | 返回 / 关闭 |
| `/` | 命令菜单 |

### 配置文件

配置存储在 `~/.tabbit/config.json`：

```json
{
  "model": "最佳"
}
```

### 数据存储

所有数据本地存储在 `~/.tabbit/` 目录下：

| 文件 | 说明 |
|------|------|
| `credentials` | 登录会话 Cookie |
| `config.json` | 用户偏好配置 |
| `sessions.json` | 本地会话记录 |
| `state.json` | 应用状态 |

### 开源协议

MIT
