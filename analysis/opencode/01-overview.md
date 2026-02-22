# OpenCode - Project Overview

## What Is It

**OpenCode** is an open-source, provider-agnostic AI coding agent that runs locally on developer machines. It provides a TUI (Terminal UI), a web interface, and a native desktop app — all backed by a single Hono-based server with SSE event streaming.

**Repository**: https://github.com/anomalyco/opencode
**Version**: 1.2.6 (716 releases)
**License**: MIT
**Authors**: Anomaly Co (creators of terminal.shop, SST)
**Stats**: 106k+ stars, 752 contributors, 9,346 commits
**Community**: Active Discord, 747k+ downloads

## What It Does

### Core: AI Coding Agent
- Full-featured coding agent comparable to Claude Code
- Supports 19+ AI providers (Anthropic, OpenAI, Google, Azure, AWS Bedrock, etc.)
- Built-in tool system: Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch, LSP, and more
- Permission system: ask/allow/deny rules per tool, per project
- Session management with conversation history, compaction, and sharing
- MCP (Model Context Protocol) server support
- Plugin system for custom tools and authentication
- Skill system (markdown-based automation)

### Built-in Agents
- **build** — Default full-access agent for development work
- **plan** — Read-only agent for code exploration and planning
- **general** — Subagent for complex research and multi-step tasks
- **explore** — Subagent for codebase exploration (read-only)
- Plus hidden agents: compaction, title, summary

### Three UI Surfaces
1. **TUI** (Terminal) — SolidJS rendered to ANSI terminal via OpenTUI at 60fps
2. **Web App** — SolidJS in browser, communicates via SDK + SSE
3. **Desktop App** — Tauri 2 wrapping the web UI with native OS integration

### Client/Server Architecture
```
Clients (TUI / Web / Desktop / VS Code / Slack / Mobile)
    │
    ▼ (HTTP REST + SSE events)
OpenCode Server (Hono on Bun)
    │
    ├── AI Providers (Anthropic, OpenAI, Google, etc.)
    ├── Tools (Bash, File ops, Search, LSP, MCP)
    ├── SQLite Database (Drizzle ORM)
    ├── File Watcher (Chokidar)
    ├── LSP Clients (TypeScript, Python, Go, Rust)
    └── MCP Servers (stdio, SSE, HTTP)
```

### Enterprise (SaaS)
- Cloud team collaboration at opencode.ai
- Billing via Stripe ($20/$100/$200 tiers)
- PlanetScale MySQL for cloud data
- Cloudflare Workers deployment
- Admin console with user/team management

## How It Compares to Opcode

| Aspect | OpenCode | Opcode |
|--------|----------|--------|
| License | MIT | AGPL-3.0 |
| Maturity | Production (v1.2.6, 106k stars) | Pre-release (v0.2.1) |
| Architecture | Client/Server (headless server) | Monolithic (Tauri desktop) |
| AI Providers | 19+ (provider-agnostic) | Claude only (wraps CLI) |
| UI Surfaces | TUI + Web + Desktop | Desktop only (+experimental web) |
| Tools | Built-in (no external CLI) | Wraps `claude` CLI binary |
| Language | TypeScript (Bun) | Rust + TypeScript |
| Database | SQLite (Drizzle ORM) | SQLite (rusqlite) |
| LSP Support | Native, out-of-box | None |
| Plugin System | Yes (@opencode-ai/plugin) | No |
| Enterprise | Yes (SaaS tier) | No |
| MCP Support | Full (stdio, SSE, HTTP) | Basic (via claude CLI) |
| VS Code Extension | Yes | No |
| Slack Integration | Yes | No |
| Test Coverage | Playwright + unit tests | Minimal |
