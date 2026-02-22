# OpenCode Analysis

Analysis of the [OpenCode](https://github.com/anomalyco/opencode) project - the open source AI coding agent.

**Analysis date**: 2026-02-17
**Version analyzed**: 1.2.6 (dev branch)

## Documents

### Analysis & Assessment

| # | Document | Description |
|---|----------|-------------|
| 01 | [Overview](./01-overview.md) | What OpenCode is, what it does, comparison with Opcode |
| 02 | [Technology Stack](./02-technology-stack.md) | Complete tech stack: 19+ AI providers, SolidJS, Hono, Tauri, Bun |
| 03 | [Architecture](./03-architecture.md) | Client/server architecture, monorepo structure, DB schema, event bus |
| 04 | [Use Cases & Decision](./04-use-cases.md) | Use cases, maintenance decision, reusability assessment |

### Technical Knowledge (Reusable for Building)

| # | Document | Description |
|---|----------|-------------|
| 10 | [Technical Knowledge Base](./10-technical-knowledge.md) | Server patterns, tool system, agent system, permission model, LLM streaming, session management, DB layer, MCP integration, config format, skill system, plugin system, LSP, TUI architecture, SDK generation |

### User Journeys & Flows

| # | Document | Description |
|---|----------|-------------|
| 11 | [Session Lifecycle](./11-flow-session-lifecycle.md) | Start → select agent/model → prompt → LLM streaming → tool execution → multi-turn → compaction → end |
| 12 | [Tool Execution & Permission](./12-flow-tool-execution.md) | Tool registration → arg parsing → permission check (allow/deny/ask) → execution → doom loop detection |
| 13 | [Multi-Provider Integration](./13-flow-multi-provider.md) | 19 providers, auth priority, model selection, provider-specific behaviors, prompt caching |
| 14 | [TUI, Web & Desktop](./14-flow-tui-web-desktop.md) | Three UI surfaces from shared code, platform abstraction, state sync via SSE, VS Code extension |
| 15 | [MCP, Plugins & Skills](./15-flow-mcp-plugins-skills.md) | MCP lifecycle + OAuth, plugin system, skill markdown format, custom commands |
| 16 | [Configuration](./16-flow-configuration.md) | 7-layer config precedence, project discovery, opencode.json schema, env vars, file watching |

## Quick Summary

**OpenCode** is a production-ready (v1.2.6, 106k stars), MIT-licensed, provider-agnostic AI coding agent. It features a client/server architecture with three UI surfaces (TUI, Web, Desktop), 19+ AI provider integrations, a full tool/permission system, LSP support, MCP integration, plugins, and skills.

### Key Takeaways

- **License**: MIT (fully permissive, compatible with proprietary use)
- **Maturity**: Production (1.2.6, 716 releases, 106k stars, 752 contributors)
- **Architecture**: Client/server with SSE streaming (not monolithic)
- **Provider-agnostic**: 19+ AI providers via Vercel AI SDK
- **Three UIs**: TUI (SolidJS→terminal), Web (SolidJS), Desktop (Tauri)
- **Extensible**: Plugins, skills, custom agents, MCP servers
- **Enterprise**: Optional SaaS tier with billing and team features
- **Most valuable patterns**: Tool/permission system, multi-provider abstraction, SSE event streaming, SolidJS-everywhere architecture
