# claude-hud Analysis

Analysis of the [claude-hud](https://github.com/jarrodwatts/claude-hud) project - a real-time statusline plugin for Claude Code.

**Analysis date**: 2026-02-17
**Version analyzed**: latest (Claude Code plugin)

## Documents

### Analysis & Assessment

| # | Document | Description |
|---|----------|-------------|
| 01 | [Overview](./01-overview.md) | What it is, what it does, and how it works |
| 02 | [Technology Stack](./02-technology-stack.md) | Complete list of technologies, frameworks, and tools |
| 03 | [Use Cases](./03-use-cases.md) | Primary and secondary use cases, limitations |
| 04 | [Architecture](./04-architecture.md) | System architecture, data sources, rendering pipeline |

### Technical Knowledge (Reusable for Building)

| # | Document | Description |
|---|----------|-------------|
| 10 | [Technical Knowledge Base](./10-technical-knowledge.md) | Stdin protocol, transcript JSONL parsing, OAuth usage API, git status, config counting, ANSI rendering, bar charts, speed tracking, caching, Keychain integration |

### User Journeys & Flows

| # | Document | Description |
|---|----------|-------------|
| 11 | [Installation & Setup](./11-flow-installation-setup.md) | Plugin install → setup wizard → preset selection → config → statusline registration |
| 12 | [Real-Time Session Monitoring](./12-flow-session-monitoring.md) | Context bar → usage tracking → token breakdown → autocompact buffer → color coding |
| 13 | [Activity Tracking](./13-flow-activity-tracking.md) | Tool tracking → agent monitoring → todo progress → transcript parsing → live updates |
| 14 | [Git & Environment Display](./14-flow-git-environment.md) | Git status → branch/dirty/ahead-behind → file stats → config counts → project path |
| 15 | [Usage Limits & OAuth](./15-flow-usage-limits.md) | OAuth credentials → Keychain/file → API fetch → 5h/7d usage → cache → plan detection |

## Quick Summary

**claude-hud** is a zero-dependency Node.js statusline plugin for Claude Code that provides a real-time heads-up display. Invoked every ~300ms by Claude Code, it reads session data via stdin JSON, parses the transcript JSONL for tool/agent/todo activity, fetches OAuth usage limits from the Anthropic API, reads git status, and renders a configurable multi-line ANSI-colored display showing context usage, API quota, tool activity, agent progress, and project information.

### Key Takeaways

- **License**: MIT
- **Maturity**: Active development, well-structured, comprehensive feature set
- **Architecture**: Pure Node.js, zero dependencies, stdin→stdout pipeline invoked by Claude Code
- **Data sources**: stdin JSON (model/tokens), transcript JSONL (tools/agents/todos), Anthropic API (usage), git CLI, settings files
- **Display**: Two layouts (expanded/compact), configurable lines, ANSI color-coded bars and indicators
- **Most valuable patterns**: Claude Code stdin protocol parsing, transcript JSONL tool/agent extraction, OAuth usage API integration with caching, macOS Keychain credential reading, real-time output speed calculation
- **Unique feature**: Complete session intelligence dashboard — context, usage limits, active tools, agent status, todo progress, git state — all in the statusline
