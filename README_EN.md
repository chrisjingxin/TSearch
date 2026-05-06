# Tabbit CLI

**Tabbit CLI** is a command-line interface for the [Tabbit Browser](https://tabbitbrowser.com), bringing AI-powered chat and search directly to your terminal. It features both a traditional CLI and a rich TUI (Terminal UI) built with [OpenTUI](https://opentui.dev).

[中文](./README.md)

### Features

- **AI Chat** — Multi-turn conversations with various AI models
- **Search** — One-shot queries via `tabbit search`
- **Session Management** — Browse, switch, and continue historical sessions
- **Model Selection** — Choose from available AI models (or use "最佳" for auto-select)
- **Export** — Export conversation history to Markdown files
- **TUI** — Full-featured terminal UI with syntax-highlighted markdown, streaming responses, and thinking process display

### Installation

```bash
npm install -g tabbit-cli
```

For TUI mode, you also need [Bun](https://bun.sh):

```bash
curl -fsSL https://bun.sh/install | bash
```

### Quick Start

```bash
# Login via Tabbit Browser
tabbit login

# Ask a question
tabbit search "What is Tabbit?"

# Start a multi-turn chat
tabbit chat

# Launch the terminal UI
tabbit tui
```

### Commands

| Command | Description |
|---------|-------------|
| `tabbit login` | Login via Tabbit Browser |
| `tabbit logout` | Clear saved credentials |
| `tabbit search <query>` | One-shot AI search |
| `tabbit chat` | Multi-turn conversation mode |
| `tabbit sessions` | Browse and select historical sessions |
| `tabbit models` | List available AI models |
| `tabbit config [key] [value]` | View or set configuration |
| `tabbit export [sessionId]` | Export conversation to Markdown |
| `tabbit tui` | Launch terminal UI (requires Bun) |

### Options

```bash
# Search with a specific model
tabbit search -m Claude-Opus-4.7 "Explain quantum computing"

# Set default model
tabbit config model Claude-Opus-4.7

# Export a specific session
tabbit export <session-id>
```

### TUI Keybindings

| Key | Action |
|-----|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `Ctrl+N` | New session |
| `Ctrl+L` | Session list |
| `Ctrl+M` | Model selector |
| `Esc` | Back / Close |
| `/` | Command menu |

### Configuration

Configuration is stored in `~/.tabbit/config.json`:

```json
{
  "model": "最佳"
}
```

### Data Storage

All data is stored locally in `~/.tabbit/`:

| File | Description |
|------|-------------|
| `credentials` | Login session cookies |
| `config.json` | User preferences |
| `sessions.json` | Local session records |
| `state.json` | Application state |

### License

MIT
