# Opcode - Project Overview

## What Is It

**Opcode** is a desktop GUI application (and optional web server) that serves as a visual command center for **Claude Code** (Anthropic's CLI coding assistant). It wraps the `claude` CLI binary in a rich graphical interface, providing session management, custom agent creation, usage analytics, and more.

**Repository**: https://github.com/winfunc/opcode (originally https://github.com/getAsterisk/opcode)
**Version**: 0.2.1
**License**: AGPL-3.0 (GNU Affero General Public License v3)
**Authors**: mufeedvh, 123vviekr (Asterisk team)
**Status**: Pre-release (no published binaries yet, build-from-source only)

## What It Does

Opcode provides a visual layer on top of the `claude` CLI tool. Its core capabilities:

### 1. Interactive Claude Code Sessions
- Launch and manage Claude Code sessions from a tabbed GUI
- Stream real-time output (JSONL parsing) from the Claude CLI
- Resume, fork, and browse session history
- Keyboard shortcuts (Cmd+T new tab, Cmd+W close, Cmd+1-9 switch)

### 2. Custom AI Agents
- Create specialized agents with custom system prompts, model selection, and permission scopes
- Execute agents against any project directory
- Track execution history with metrics (tokens, cost, duration)
- Import/export agents as `.opcode.json` files
- Browse and import agents from GitHub repositories

### 3. Session Checkpoints & Timeline
- Create snapshots of your coding session at any point
- Content-addressable file storage (SHA256 deduplication, zstd compression)
- Visual timeline with branching/forking support
- Instant restore to any checkpoint
- Diff viewer between checkpoints
- Auto-checkpoint strategies: Manual, PerPrompt, PerToolUse, Smart

### 4. Usage Analytics Dashboard
- Track Claude API costs by model, project, and date
- Token breakdown and visual charts (Recharts)
- Export usage data for accounting
- Date range filtering (7d, 30d, all time)

### 5. MCP Server Management
- Central UI for Model Context Protocol servers
- Add servers via UI, JSON import, or Claude Desktop import
- Connection testing and status monitoring

### 6. CLAUDE.md Management
- Built-in markdown editor for CLAUDE.md files
- Live preview with syntax highlighting
- Project scanner to find all CLAUDE.md files

### 7. Web Server Mode
- Alternative Axum-based web server (no Tauri required)
- WebSocket streaming for remote/mobile access
- REST API equivalents of all Tauri commands
- Accessible from phone browsers on local network

## How It Works (High Level)

```
User ──► Opcode GUI (React/Tauri) ──► Rust Backend ──► claude CLI binary
                                           │
                                           ├── SQLite (agents.db)
                                           ├── ~/.claude/projects/ (sessions)
                                           └── Checkpoint storage (file snapshots)
```

1. The React frontend communicates with the Rust backend via Tauri IPC (92 commands)
2. The Rust backend spawns `claude` CLI as subprocesses, streaming output back
3. Session data lives in `~/.claude/projects/` as JSONL files
4. Agent definitions and settings stored in SQLite (`agents.db`)
5. Checkpoints stored on disk with content-addressable deduplication
