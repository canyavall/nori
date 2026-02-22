# OpenCode (opencode-ai/opencode) Analysis

Analysis of the [OpenCode](https://github.com/opencode-ai/opencode) project - a terminal-based AI coding agent built in Go with Bubble Tea TUI.

**Analysis date**: 2026-02-18
**Version analyzed**: v0.0.55 (last release before archival)
**Status**: Archived (continued as [Crush](https://github.com/charmbracelet/crush) by Charmbracelet)

## Documents

### Analysis & Assessment

| # | Document | Description |
|---|----------|-------------|
| 01 | [Overview](./01-overview.md) | What OpenCode is, what it does, and how it works |
| 02 | [Technology Stack](./02-technology-stack.md) | Complete list of technologies, frameworks, and tools |
| 03 | [Use Cases](./03-use-cases.md) | Primary and secondary use cases, limitations |
| 04 | [Architecture](./04-architecture.md) | System architecture, component diagrams, data flow |
| 05 | [Code Quality](./05-code-quality.md) | Strengths, weaknesses, technical debt, and metrics |
| 06 | [Maintenance Decision](./06-maintenance-decision.md) | Should we adopt/fork/maintain this project? |
| 07 | [Security Assessment](./07-security-assessment.md) | Security model, vulnerabilities, and recommendations |

### Technical Knowledge (Reusable for Building)

| # | Document | Description |
|---|----------|-------------|
| 10 | [Technical Knowledge Base](./10-technical-knowledge.md) | Everything needed to rebuild: Go patterns, Bubble Tea TUI, tool system, provider abstraction, session management, DB layer, config, LSP integration, auto-compact, pubsub, MCP |

### User Journeys & Flows

| # | Document | Description |
|---|----------|-------------|
| 11 | [Session Lifecycle](./11-flow-session-lifecycle.md) | New session -> prompt -> streaming -> tool execution -> multi-turn -> cancel -> summarize |
| 12 | [Tool Execution](./12-flow-tool-execution.md) | Tool registration, permission model, execution flow, result handling |
| 13 | [Multi-Provider](./13-flow-multi-provider.md) | Provider abstraction, model selection, auto-detection, hot-switching |
| 14 | [TUI Architecture](./14-flow-tui.md) | Bubble Tea TUI architecture, pages, dialogs, keybindings, rendering |
| 15 | [Configuration](./15-flow-configuration.md) | Config file format, env vars, precedence, validation |

## Quick Summary

**OpenCode** is a Go-based terminal AI coding agent (TUI + non-interactive CLI) that directly integrates with multiple LLM providers (Anthropic, OpenAI, Google Gemini, AWS Bedrock, Groq, Azure, OpenRouter, GitHub Copilot, xAI, self-hosted) to provide agentic coding assistance. It features a Bubble Tea TUI, SQLite session/message storage, tool execution with permission system, LSP integration for diagnostics, MCP server support, custom commands, auto-compact (context summarization), and a file change tracking system. It was archived in September 2025 and continued as "Crush" by Charmbracelet.

### Key Takeaways

- **License**: MIT (permissive, compatible with proprietary software)
- **Maturity**: Pre-1.0 (v0.0.55), but functional and widely used (11k stars)
- **Quality**: Well-structured Go codebase with clean separation of concerns
- **Maintenance cost**: Moderate (single language Go, single binary)
- **Most reusable assets**: Provider abstraction, tool system, Bubble Tea TUI patterns, permission model, pubsub event system, session/message architecture
- **Biggest concerns**: Archived/unmaintained, pre-1.0 stability, no official API contract
- **Successor**: Crush (charmbracelet/crush, 20k stars, active development, same author)
