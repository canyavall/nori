# ccusage Analysis

Analysis of the [ccusage](https://github.com/ryoppippi/ccusage) project - CLI tool for tracking Claude Code token usage and costs.

**Analysis date**: 2026-02-17
**Version analyzed**: latest (monorepo with @ccusage/terminal, @ccusage/internal packages)

## Documents

### Analysis & Assessment

| # | Document | Description |
|---|----------|-------------|
| 01 | [Overview](./01-overview.md) | What ccusage is, what it does, and how it works |
| 02 | [Technology Stack](./02-technology-stack.md) | Complete list of technologies, frameworks, and tools |
| 03 | [Use Cases](./03-use-cases.md) | Primary and secondary use cases, limitations |
| 04 | [Architecture](./04-architecture.md) | System architecture, data flow, module relationships |

### Technical Knowledge (Reusable for Building)

| # | Document | Description |
|---|----------|-------------|
| 10 | [Technical Knowledge Base](./10-technical-knowledge.md) | JSONL parsing, cost calculation, LiteLLM pricing, session blocks, config system, responsive tables, branded types |

### User Journeys & Flows

| # | Document | Description |
|---|----------|-------------|
| 11 | [Daily/Monthly/Weekly Reports](./11-flow-usage-reports.md) | Install → run → discover data → parse JSONL → aggregate → render table/JSON |
| 12 | [Session & Block Analysis](./12-flow-session-blocks.md) | Session lookup → 5-hour billing blocks → burn rate → projections → live monitoring |
| 13 | [Configuration & Customization](./13-flow-configuration.md) | Config files → env vars → CLI flags → precedence → cost modes → timezone/locale |
| 14 | [Statusline Integration](./14-flow-statusline.md) | Claude Code hook → stdin JSON → hybrid caching → context/cost display → burn rate |

## Quick Summary

**ccusage** is a TypeScript CLI tool (Bun runtime) that reads Claude Code's JSONL session files and produces usage reports — daily, weekly, monthly, per-session, and per-5-hour-billing-block. It calculates costs using LiteLLM pricing data, supports responsive terminal tables and JSON output, and integrates as a Claude Code statusline plugin.

### Key Takeaways

- **License**: MIT
- **Maturity**: Active development, well-documented, monorepo architecture
- **Architecture**: CLI tool with shared packages (@ccusage/terminal, @ccusage/internal)
- **Data source**: Reads `~/.config/claude/projects/**/*.jsonl` files directly
- **Cost calculation**: Three modes (auto/calculate/display) using LiteLLM pricing
- **Most valuable patterns**: JSONL parsing pipeline, 5-hour billing block detection, responsive table rendering, LiteLLM pricing integration
- **Unique feature**: 5-hour billing block analysis with burn rate projections
