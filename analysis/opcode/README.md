# Opcode Analysis

Analysis of the [Opcode](https://github.com/winfunc/opcode) project - a GUI application and toolkit for Claude Code.

**Analysis date**: 2026-02-17
**Version analyzed**: 0.2.1

## Documents

### Analysis & Assessment

| # | Document | Description |
|---|----------|-------------|
| 01 | [Overview](./01-overview.md) | What Opcode is, what it does, and how it works |
| 02 | [Technology Stack](./02-technology-stack.md) | Complete list of technologies, frameworks, and tools |
| 03 | [Use Cases](./03-use-cases.md) | Primary and secondary use cases, limitations |
| 04 | [Architecture](./04-architecture.md) | System, frontend, and backend architecture with diagrams |
| 05 | [Code Quality](./05-code-quality.md) | Strengths, weaknesses, technical debt, and metrics |
| 06 | [Maintenance Decision](./06-maintenance-decision.md) | Should we adopt/fork/maintain this project? |
| 07 | [Security Assessment](./07-security-assessment.md) | Security vulnerabilities and recommendations |

### Technical Knowledge (Reusable for Building)

| # | Document | Description |
|---|----------|-------------|
| 10 | [Technical Knowledge Base](./10-technical-knowledge.md) | Everything needed to rebuild: binary discovery, CLI args, JSONL format, process management, content-addressable storage, agent execution, MCP config, usage tracking, WebSocket streaming, IPC patterns, hooks, analytics, tab persistence |

### User Journeys & Flows

| # | Document | Description |
|---|----------|-------------|
| 11 | [Session Lifecycle](./11-flow-session-lifecycle.md) | New session → prompt → streaming → multi-turn → resume → cancel → close |
| 12 | [Agent Lifecycle](./12-flow-agent-lifecycle.md) | Browse → create → configure → execute → monitor → review → import/export |
| 13 | [Checkpoint & Timeline](./13-flow-checkpoint-timeline.md) | Enable → configure auto-checkpoint → create → restore → fork → diff → cleanup |
| 14 | [Project Management](./14-flow-project-management.md) | Browse projects → view sessions → resume → CLAUDE.md → project settings |
| 15 | [MCP Management](./15-flow-mcp-management.md) | List servers → add (form/JSON) → import from Claude Desktop → test → remove |
| 16 | [Usage Analytics](./16-flow-usage-analytics.md) | Dashboard → overview → by model/date/project → session details → export |
| 17 | [Settings & Configuration](./17-flow-settings-configuration.md) | Theme → Claude binary → hooks → proxy → slash commands → storage → analytics |
| 18 | [Web Server Mode](./18-flow-web-server-mode.md) | Start server → browser access → WebSocket streaming → known limitations |

## Quick Summary

**Opcode** is a Tauri 2 desktop app (React + Rust) that wraps the Claude Code CLI with a visual interface for session management, custom AI agents, checkpoints/timelines, usage analytics, and MCP server management. It also has an experimental web server mode for mobile access.

### Key Takeaways

- **License**: AGPL-3.0 (incompatible with proprietary software)
- **Maturity**: Pre-release (v0.2.1, no published binaries)
- **Quality**: Good foundations, but incomplete features and security concerns
- **Maintenance cost**: High (Rust + Tauri + React, multi-platform, Claude CLI dependency)
- **Most reusable assets**: Agent system prompts and architectural patterns
- **Biggest concerns**: `--dangerously-skip-permissions` on all executions, no web auth, AGPL license
