# Flow: Daily/Monthly/Weekly Usage Reports

> From installation to seeing your first cost report.

---

## Flow Diagram

```
┌──────────┐     ┌───────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐
│  Install  │────►│  Run CLI  │────►│  Discover │────►│  Parse   │────►│  Render  │
│  ccusage  │     │  Command  │     │  Data     │     │  & Calc  │     │  Output  │
└──────────┘     └───────────┘     └───────────┘     └──────────┘     └──────────┘
```

---

## Step 1: Install

**User action**: `npm install -g ccusage` or `npx ccusage`

**No configuration needed** — works immediately by reading Claude Code's default data location.

---

## Step 2: Run Daily Report (Default)

**User action**: `ccusage` (or `ccusage daily`)

**What happens**:
1. Gunshi CLI parses arguments (none in this case)
2. Config loader searches for config files (none found = all defaults)
3. `loadDailyUsageData()` called with default options

**User sees**: Loading begins immediately, no prompts.

---

## Step 3: Data Discovery

**What happens**:
1. `getClaudePaths()` checks:
   - `$CLAUDE_CONFIG_DIR` environment variable (supports comma-separated)
   - `~/.config/claude/` (new default since Claude Code v1.0.30)
   - `~/.claude/` (legacy location)
2. For each valid path, glob for `projects/**/*.jsonl`
3. All matching files collected into a list

**Example discovery**:
```
Found: ~/.config/claude/projects/
├── -Users-me-projectA/session1.jsonl (45KB)
├── -Users-me-projectA/session2.jsonl (12KB)
├── -Users-me-projectB/session3.jsonl (120KB)
└── -Users-me-projectB/session4.jsonl (8KB)
```

---

## Step 4: Parse JSONL

**What happens for each file**:
1. Open readable stream
2. Create readline interface
3. For each line:
   - `JSON.parse(line)`
   - Validate with Valibot `usageDataSchema`
   - Extract: `timestamp`, `message.model`, `message.usage.*`, `costUSD`
   - Extract project name from file path
   - Check for duplicate (hash of sessionId + requestId + timestamp)
   - If valid and unique, add to entries array

**Filtering applied**:
- `--since YYYYMMDD`: Exclude entries before this date
- `--until YYYYMMDD`: Exclude entries after this date
- `--project name`: Filter to only this project's sessions

---

## Step 5: Aggregate by Period

**Daily aggregation**:
1. For each entry, format timestamp to date: `formatDate(ts, timezone)` → `YYYY-MM-DD`
2. Group entries by formatted date
3. For each date group:
   - Sum `input_tokens` across all entries
   - Sum `output_tokens`
   - Sum `cache_creation_input_tokens`
   - Sum `cache_read_input_tokens`
   - Collect unique model names
   - Calculate cost based on mode (auto/calculate/display)

**Monthly**: Same but `formatDate` produces `YYYY-MM`.
**Weekly**: Same but uses week number calculation with configurable start-of-week.

---

## Step 6: Cost Calculation

**For each entry in a group**:
```
auto mode:     cost = entry.costUSD ?? calculateFromTokens(entry)
calculate mode: cost = calculateFromTokens(entry)
display mode:   cost = entry.costUSD ?? 0

calculateFromTokens(entry):
  pricing = getLiteLLMPricing(entry.model)
  return (input * pricing.input / 1M)
       + (output * pricing.output / 1M)
       + (cache_create * pricing.cache_create / 1M)
       + (cache_read * pricing.cache_read / 1M)
```

---

## Step 7: Sort

**Sorting applied**:
- `--order desc` (default for daily): Newest dates first
- `--order asc`: Oldest dates first

---

## Step 8: Render Output

### Table Mode (default)

**What the user sees**:
```
╭──────────────────────────────────────────╮
│  Claude Code Token Usage Report - Daily  │
╰──────────────────────────────────────────╯

┌────────────┬──────────────────┬────────┬─────────┬──────────────┬────────────┬──────────────┬────────────┐
│ Date       │ Models           │ Input  │ Output  │ Cache Create │ Cache Read │ Total Tokens │ Cost (USD) │
├────────────┼──────────────────┼────────┼─────────┼──────────────┼────────────┼──────────────┼────────────┤
│ 2025-01-15 │ • opus-4         │ 10,234 │ 245,678 │        1,024 │      2,048 │      259,184 │    $125.67 │
│            │ • sonnet-4       │        │         │              │            │              │            │
├────────────┼──────────────────┼────────┼─────────┼──────────────┼────────────┼──────────────┼────────────┤
│ 2025-01-14 │ • sonnet-4       │  5,678 │ 123,456 │          512 │      1,024 │      130,670 │     $45.23 │
├────────────┼──────────────────┼────────┼─────────┼──────────────┼────────────┼──────────────┼────────────┤
│ Total      │                  │ 15,912 │ 369,134 │        1,536 │      3,072 │      389,854 │    $170.90 │
└────────────┴──────────────────┴────────┴─────────┴──────────────┴────────────┴──────────────┴────────────┘
```

**Responsive behavior**:
- Terminal >= 100 chars wide: All columns shown
- Terminal < 100 chars: Compact mode (Date, Models, Input, Output, Cost only)

### With `--breakdown`

Each date row gets sub-rows showing per-model cost breakdown.

### With `--instances`

Rows grouped by project, with project header sections.

### JSON Mode (`--json`)

```json
{
  "daily": [
    {
      "date": "2025-01-15",
      "inputTokens": 10234,
      "outputTokens": 245678,
      "cacheCreationTokens": 1024,
      "cacheReadTokens": 2048,
      "totalCost": 125.67,
      "modelsUsed": ["claude-opus-4-20250514", "claude-sonnet-4-20250514"]
    }
  ],
  "totals": {
    "inputTokens": 15912,
    "outputTokens": 369134,
    "totalTokens": 389854,
    "totalCost": 170.90
  }
}
```

### With `--jq`

JSON output piped through `jq` for filtering:
```bash
ccusage daily --json --jq '.daily[] | select(.totalCost > 10)'
```

---

## Variant: Monthly Report

**User action**: `ccusage monthly`

**Difference from daily**: Groups by `YYYY-MM` instead of `YYYY-MM-DD`. Same options available.

---

## Variant: Weekly Report

**User action**: `ccusage weekly --start-of-week monday`

**Difference**: Groups by ISO week number. Start-of-week configurable (Monday or Sunday).
