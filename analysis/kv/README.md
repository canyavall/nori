# KV (Knowledge Vault) Analysis

Analysis of the KV system — a knowledge management and role injection system for Claude Code.

**Analysis date**: 2026-02-17
**Version analyzed**: latest (ext-projects/code/kv)

## Documents

### Analysis & Assessment

| # | Document | Description |
|---|----------|-------------|
| 01 | [Overview](./01-overview.md) | What it is, what it does, and how it works |
| 02 | [Technology Stack](./02-technology-stack.md) | Technologies, data sources, integration points, patterns |
| 03 | [Use Cases](./03-use-cases.md) | Primary and secondary use cases, limitations |
| 04 | [Architecture](./04-architecture.md) | System architecture, directory structure, data flows, caching |

### Technical Knowledge (Reusable for Building)

| # | Document | Description |
|---|----------|-------------|
| 10 | [Technical Knowledge Base](./10-technical-knowledge.md) | Hook protocol, vault structure, pattern matching, smart agent, trivial detection, role system, session state, prompt transformation, 3-way merge, event logging, child flow execution, path resolution, content loading |

### User Journeys & Flows

| # | Document | Description |
|---|----------|-------------|
| 11 | [Session Lifecycle](./11-flow-session-lifecycle.md) | SessionStart → validate → create session → sync check → build index → preload → role inject → output context |
| 12 | [Knowledge Injection on Prompts](./12-flow-knowledge-injection.md) | User prompt → increment counter → trivial check → smart agent → load knowledge → role reminder → transform prompt |
| 13 | [Auto-Load on File Operations](./13-flow-auto-load.md) | PostToolUse → check tool type → extract path → vault read detect → pattern match → filter/limit → load → inject |
| 14 | [Workspace Synchronization](./14-flow-workspace-sync.md) | Git config → pull workspace → build manifest → 3-way merge → apply changes (vault-aware) → update state → rebuild index |
| 15 | [Installation & Distribution](./15-flow-installation.md) | Clone workspace → copy files → register hooks → update CLAUDE.md → write config → build index → write metadata |
| 16 | [Role Injection](./16-flow-role-injection.md) | Read config → determine role → load template → format by prompt count (full/reminder/silent) |

## Quick Summary

**KV (Knowledge Vault)** is a sophisticated Claude Code integration that manages a vault of markdown knowledge packages, automatically injecting relevant context into Claude's prompts based on what the developer is working on. It hooks into three Claude Code lifecycle events (SessionStart, UserPromptSubmit, PostToolUse), using pattern matching and semantic analysis to load the right knowledge at the right time, while shaping Claude's behavior through configurable role templates.

### Key Takeaways

- **License**: Proprietary
- **Maturity**: Active development, modular feature-based architecture, comprehensive type system
- **Architecture**: Hook-driven (SessionStart/UserPromptSubmit/PostToolUse) → feature layer (session/knowledge/role/distribution) → shared utilities
- **Knowledge system**: Markdown vault with YAML frontmatter → index build → auto-load (file patterns), smart agent (semantic matching), preload (config), manual load (CLI)
- **Role system**: Template-based injection — full role at session start, brief reminders every 5th prompt, silent 80% of the time
- **Sync**: Pull-only workspace sync with 3-way merge detection; locally-modified vault files are never overwritten
- **Token optimization**: Session-scoped deduplication, 15-package auto-load limit, 10-package smart agent limit, trivial prompt bypass, mtime-based index fast paths
- **Unique feature**: Intelligent, contextual knowledge injection — Claude automatically receives domain expertise based on which files are touched and what the developer asks, without any manual intervention
