# ccusage - Project Overview

## What Is It

**ccusage** is a CLI tool that reads Claude Code's local JSONL session files and produces usage reports — showing token consumption, costs, and model usage across daily, weekly, monthly, session, and 5-hour billing block aggregations.

**Repository**: https://github.com/ryoppippi/ccusage
**License**: MIT
**Runtime**: Bun (primary), Node.js 18+ compatible
**Package**: `ccusage` on npm

## What It Does

ccusage reads the JSONL files that Claude Code writes to `~/.config/claude/projects/` (or the legacy `~/.claude/projects/`), parses every usage entry, and produces formatted reports.

### 1. Daily Usage Reports (Default Command)
- Token usage and costs aggregated by calendar date
- Shows models used per day, input/output/cache tokens, total cost
- Responsive table layout (compact for narrow terminals)
- Optional per-model cost breakdown
- Optional project grouping (filter by project name)

### 2. Monthly Reports
- Same data aggregated by month (YYYY-MM)
- Same options as daily (breakdown, JSON, etc.)

### 3. Weekly Reports
- Aggregated by week, configurable start-of-week (Monday/Sunday)

### 4. Session Reports
- Usage per Claude Code session ID
- Look up a specific session by ID
- Shows last activity date per session

### 5. 5-Hour Billing Block Reports
- Groups usage into Claude's 5-hour billing windows
- Shows active vs completed blocks
- Burn rate calculation (tokens/minute for active blocks)
- Projected token usage and cost if current rate continues
- Live monitoring mode with auto-refresh

### 6. Statusline Integration (Beta)
- Compact one-line output for Claude Code's status bar
- Shows current session cost, context usage, burn rate
- Hybrid caching (time-based + file modification detection)
- Color-coded context indicators

## How It Works (High Level)

```
~/.config/claude/projects/**/*.jsonl
          │
          ▼
    ccusage CLI
          │
          ├── Parse JSONL (Valibot validation)
          ├── Aggregate by period (day/week/month/session/block)
          ├── Calculate costs (LiteLLM pricing or pre-calculated)
          │
          ▼
    Output: Terminal table or JSON
```

1. Discovers Claude data directories (`CLAUDE_CONFIG_DIR` env or defaults)
2. Globs for `**/*.jsonl` files in projects subdirectories
3. Parses each JSONL line, validates with Valibot schemas
4. Deduplicates entries by hash (sessionId + requestId + timestamp)
5. Aggregates by the selected time period
6. Calculates costs using one of three modes (auto/calculate/display)
7. Renders responsive terminal tables or serializes to JSON
