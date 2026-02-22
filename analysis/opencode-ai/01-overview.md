# OpenCode - Project Overview

## What Is It

**OpenCode** is a terminal-based AI coding agent written in Go. It provides both an interactive TUI (Terminal User Interface) built with Bubble Tea and a non-interactive CLI mode for scripting. Unlike tools that wrap external CLI binaries, OpenCode directly integrates with LLM provider APIs (Anthropic, OpenAI, Google Gemini, etc.) and executes tools (file editing, bash commands, code search) natively within the same Go process.

**Repository**: https://github.com/opencode-ai/opencode
**Version analyzed**: v0.0.55 (last release, June 27, 2025)
**License**: MIT
**Primary author**: kujtimiihoxha (128 commits), with contributions from adamdotdevin (UI/UX), thdxr, and others
**Status**: Archived (September 2025). Continued as [Crush](https://github.com/charmbracelet/crush) by Charmbracelet (20k stars)
**Stars**: ~11,000
**Forks**: ~1,040
**Language**: Go (100%)
**Created**: March 16, 2025

## What It Does

OpenCode provides AI-powered coding assistance directly in the terminal. Its core capabilities:

### 1. Interactive TUI Mode
- Full terminal UI built with Bubble Tea (Charmbracelet ecosystem)
- Chat page with message list, editor, and sidebar for file changes
- Dialog overlays for session switching, model selection, permissions, commands, help
- Multiple theme support (Catppuccin, Dracula, Gruvbox, Tokyo Night, etc.)
- Vim-like keybindings throughout

### 2. Multi-Provider AI Integration
- Native API integration with 10+ providers: Anthropic, OpenAI, Google Gemini, AWS Bedrock, Groq, Azure OpenAI, OpenRouter, GitHub Copilot, xAI (Grok), VertexAI, and self-hosted (OpenAI-compatible)
- Hot-switch between models mid-session
- Per-agent model configuration (coder, summarizer, task, title agents)
- Token usage tracking and cost calculation per model

### 3. Tool System (Agentic Coding)
- File tools: glob, grep, ls, view, write, edit, patch
- Shell: bash command execution with configurable shell
- Network: fetch URLs with format conversion
- Code search: Sourcegraph integration for public repos
- Sub-agent: delegate sub-tasks to a separate agent instance
- LSP diagnostics: language server diagnostics via configured LSP servers
- MCP tools: dynamically loaded from configured MCP servers

### 4. Permission System
- Interactive permission prompts for dangerous operations (file writes, bash commands)
- Per-action, per-session, and auto-approve modes
- Non-interactive mode auto-approves all permissions

### 5. Session Management
- SQLite-backed sessions with full message history
- Session switching dialog (Ctrl+A)
- Auto-generated session titles via dedicated title agent
- Session cost and token tracking
- Auto-compact: automatic context summarization when approaching context window limits

### 6. LSP Integration
- Configure language servers per language (gopls, typescript-language-server, etc.)
- File watcher notifies LSP of changes
- AI can query diagnostics (errors, warnings) from LSP servers

### 7. Custom Commands
- User-level commands in `~/.config/opencode/commands/`
- Project-level commands in `.opencode/commands/`
- Named argument placeholders (`$ISSUE_NUMBER`, `$AUTHOR_NAME`)
- Subdirectory organization for command namespacing

### 8. Non-Interactive Mode
- `opencode -p "prompt"` for scripting and automation
- JSON or plain text output format
- Quiet mode (no spinner) for piping
- Auto-approves all permissions

## How It Works (High Level)

```
User --> OpenCode TUI (Bubble Tea) --> Agent Service --> Provider (API)
              |                            |                  |
              |                            |                  +--> Anthropic API
              |                            |                  +--> OpenAI API
              |                            |                  +--> Gemini API
              |                            |                  +--> (etc.)
              |                            |
              |                            +--> Tool Execution
              |                            |     +--> Bash (shell)
              |                            |     +--> File R/W/Edit
              |                            |     +--> Grep/Glob/LS
              |                            |     +--> MCP Tools
              |                            |
              |                            +--> Permission Service
              |                            +--> Session/Message Service
              |
              +--> SQLite Database (.opencode/opencode.db)
              |     +--> sessions table
              |     +--> messages table
              |     +--> files table
              |
              +--> PubSub Event Broker
                    +--> TUI subscriptions (real-time UI updates)
```

1. The TUI renders using Bubble Tea's Elm architecture (Model, Update, View)
2. User input goes through the chat editor to the Agent service
3. Agent service streams responses from the configured LLM provider
4. When the LLM returns tool calls, Agent executes them (with permission checks)
5. Tool results are appended to the conversation and sent back to the LLM
6. This loop continues until the LLM returns a final response (no more tool calls)
7. All messages are persisted to SQLite in real-time via the Message service
8. PubSub events notify the TUI of updates for real-time rendering

## Key Differentiators vs. Other Tools

| Feature | OpenCode | Claude Code CLI | Opcode |
|---------|----------|----------------|--------|
| Architecture | Native Go, direct API | Standalone CLI binary | Tauri wrapper around Claude CLI |
| UI | Terminal TUI (Bubble Tea) | Terminal (basic) | Desktop GUI (React) |
| Provider lock-in | Multi-provider | Anthropic only | Anthropic only (via Claude CLI) |
| Language | Go | TypeScript/Node | Rust + TypeScript |
| Distribution | Single Go binary | npm package | Multi-platform desktop app |
| Tool execution | In-process | In-process | Subprocess delegation |
| Permission model | Interactive TUI prompts | Built-in | Bypasses with --dangerously-skip-permissions |
