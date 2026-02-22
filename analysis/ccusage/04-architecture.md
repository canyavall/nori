# ccusage - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│  CLI Entry (Gunshi)                                      │
│  index.ts → commands/index.ts                            │
│  Routes: daily | monthly | weekly | session | blocks     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Command Handler (e.g., commands/daily.ts)                │
│  1. Load config + merge CLI args                         │
│  2. Call data loader                                      │
│  3. Render table or serialize JSON                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Data Loader (data-loader.ts) — THE CORE ENGINE          │
│                                                           │
│  1. getClaudePaths() → discover data directories         │
│  2. glob(**/*.jsonl) → find all session files             │
│  3. For each JSONL file:                                  │
│     a. createReadStream → readline                        │
│     b. JSON.parse each line                               │
│     c. Valibot schema validation                          │
│     d. Extract: timestamp, tokens, cost, model            │
│  4. Deduplicate by hash (sessionId + requestId + ts)     │
│  5. Filter by date range / project                        │
│  6. Group by period (day/week/month/session/block)        │
│  7. Aggregate tokens per group                            │
│  8. Calculate costs (auto/calculate/display mode)         │
│                                                           │
│  Exports:                                                 │
│  - loadDailyUsageData()                                   │
│  - loadMonthlyUsageData()                                 │
│  - loadSessionData()                                      │
│  - loadSessionBlockData()                                 │
│  - loadSessionUsageById()                                 │
└────────┬──────────────┬──────────────────────────────────┘
         │              │
         ▼              ▼
┌─────────────┐  ┌──────────────────────┐
│ Cost Calc   │  │ Session Blocks       │
│             │  │ (_session-blocks.ts)  │
│ Modes:      │  │                       │
│ - auto      │  │ - 5-hour window ID    │
│ - calculate │  │ - Burn rate calc      │
│ - display   │  │ - Projections         │
│             │  │ - Active detection    │
│ LiteLLM     │  │ - Gap detection       │
│ pricing     │  │                       │
└─────────────┘  └──────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Output Layer                                             │
│                                                           │
│  Table mode:                                              │
│  └── @ccusage/terminal → cli-table3                      │
│      - createUsageReportTable()                           │
│      - formatUsageDataRow()                               │
│      - Responsive: wide (all cols) / compact (<100 chars) │
│      - Color formatting for costs                         │
│                                                           │
│  JSON mode:                                               │
│  └── JSON.stringify → optional jq filter                  │
└─────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
ccusage/
├── apps/
│   └── ccusage/                    # Main CLI application
│       └── src/
│           ├── index.ts            # Entry point (shebang, delegates)
│           ├── commands/
│           │   ├── index.ts        # Gunshi CLI setup, command routing
│           │   ├── daily.ts        # Daily report command
│           │   ├── monthly.ts      # Monthly report command
│           │   ├── weekly.ts       # Weekly report command
│           │   ├── session.ts      # Session report command
│           │   ├── blocks.ts       # Billing blocks command
│           │   └── statusline.ts   # Statusline integration
│           ├── data-loader.ts      # Core engine (139KB, biggest file)
│           ├── calculate-cost.ts   # Cost aggregation utilities
│           ├── _session-blocks.ts  # 5-hour billing block logic
│           ├── _config-loader-tokens.ts  # Configuration management
│           ├── _types.ts           # Branded types (Valibot)
│           ├── _shared-args.ts     # CLI argument definitions
│           ├── _date-utils.ts      # Date formatting, filtering, sorting
│           ├── _consts.ts          # Constants, locale defaults
│           └── _utils.ts           # General utilities
├── packages/
│   ├── internal/                   # Shared internal utilities
│   │   └── src/
│   │       ├── pricing.ts          # LiteLLM pricing integration
│   │       ├── pricing-fetch-utils.ts
│   │       ├── logger.ts           # Consola-based logging
│   │       ├── format.ts           # Number formatting
│   │       └── constants.ts        # Shared constants
│   └── terminal/                   # Terminal rendering
│       └── src/
│           └── table.ts            # Table creation, row formatting, responsive layout
└── docs/                           # VitePress documentation site
    └── guide/
        ├── daily-reports.md
        ├── blocks-reports.md
        ├── environment-variables.md
        └── ...
```

## Key Module Relationships

```
commands/*.ts ──uses──► data-loader.ts ──uses──► _session-blocks.ts
      │                      │                          │
      │                      ├── _types.ts (schemas)    │
      │                      ├── _date-utils.ts         │
      │                      └── _config-loader-tokens.ts
      │
      ├──uses──► @ccusage/terminal/table (rendering)
      └──uses──► @ccusage/internal/pricing (cost calc)
```

## Data Flow: JSONL → Report

```
~/.config/claude/projects/
├── -Users-me-myproject/
│   ├── session1.jsonl          ─┐
│   └── session2.jsonl           │
├── -Users-me-otherproject/      │── glob("**/*.jsonl")
│   └── session3.jsonl           │
└── ...                         ─┘
                                 │
                                 ▼
                    ┌──── Parse + Validate ────┐
                    │ Each line:               │
                    │ {                        │
                    │   timestamp: ISO,        │
                    │   message: {             │
                    │     model: "opus-4",     │
                    │     usage: {             │
                    │       input_tokens,      │
                    │       output_tokens,     │
                    │       cache_creation,    │
                    │       cache_read         │
                    │     }                    │
                    │   },                     │
                    │   costUSD: 12.45         │
                    │ }                        │
                    └────────┬────────────────┘
                             │
                    ┌────────▼────────────────┐
                    │ Deduplicate              │
                    │ hash(session+request+ts) │
                    └────────┬────────────────┘
                             │
                    ┌────────▼────────────────┐
                    │ Filter                   │
                    │ --since / --until        │
                    │ --project filter         │
                    └────────┬────────────────┘
                             │
                    ┌────────▼────────────────┐
                    │ Group by period           │
                    │ formatDate(ts, timezone)  │
                    │ → YYYY-MM-DD (daily)     │
                    │ → YYYY-MM (monthly)      │
                    │ → week number (weekly)    │
                    │ → session ID             │
                    │ → 5-hour block           │
                    └────────┬────────────────┘
                             │
                    ┌────────▼────────────────┐
                    │ Aggregate per group       │
                    │ sum(input_tokens)         │
                    │ sum(output_tokens)        │
                    │ sum(cache_tokens)         │
                    │ unique(models)            │
                    │ calculateCost(mode)       │
                    └────────┬────────────────┘
                             │
                    ┌────────▼────────────────┐
                    │ Sort                     │
                    │ --order asc/desc         │
                    └────────┬────────────────┘
                             │
                    ┌────────▼────────────────┐
                    │ Output                   │
                    │ Table: responsive layout  │
                    │ JSON: structured data     │
                    │   + optional jq filter    │
                    └──────────────────────────┘
```
