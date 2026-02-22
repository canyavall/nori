# Flow: Usage Analytics Dashboard

> The complete journey of viewing, filtering, and analyzing Claude API usage and costs.

---

## Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Open Usage  │────►│  Overview    │────►│  Drill Down      │
│  Dashboard   │     │  (Summary)   │     │  (By Model/Date/ │
│              │     │              │     │   Project)        │
└──────────────┘     └──────┬───────┘     └──────────────────┘
                            │
                            ├───► Filter by Date Range
                            └───► Export Data
```

---

## Step 1: Open Dashboard

**User action**: Clicks "Usage" in titlebar

**What happens**:
```
1. TabContext creates new tab with type 'usage'
2. UsageDashboard component mounts
3. Check cache: is there cached data < 10 minutes old?
   - If yes: use cached data (no API call)
   - If no: fetch fresh data
4. api.getUsageStats()
   │
   ▼
5. Backend:
   a. Walk ~/.claude/projects/ recursively
   b. Find all .jsonl session files
   c. For each file:
      - Parse every JSONL line
      - Extract usage from message.usage or top-level usage
      - Calculate cost per entry (tokens × model pricing)
      - Deduplicate by content hash + request_id
      - Skip zero-token entries
   d. Aggregate:
      - Total: cost, tokens (input + output + cache)
      - By model: name, cost, tokens, session count
      - By date: date, cost, tokens, models used
      - By project: path, name, cost, tokens, session count, last_used
   e. Return UsageStats object
   │
   ▼
6. Frontend caches result with timestamp
7. Renders overview cards + tabs
```

---

## Step 2: View Overview

**User sees**: Summary cards at top

| Card | Content | Example |
|------|---------|---------|
| Total Cost | Cumulative USD | "$42.17" |
| Total Tokens | Input + Output sum | "1,234,567" |
| Sessions | Total session count | "89" |
| Models Used | Count of distinct models | "2" |

Below cards: Tabbed sections for drill-down views.

---

## Step 3: By Model Breakdown

**Tab**: "By Model"

**User sees**: Table/cards for each model

| Model | Cost | Tokens | Sessions | % of Total |
|-------|------|--------|----------|------------|
| Sonnet 4 | $12.30 | 890,000 | 67 | 29% |
| Opus 4 | $29.87 | 344,567 | 22 | 71% |

**Visual**: Bar chart or donut chart (Recharts) showing cost distribution.

---

## Step 4: By Date Breakdown

**Tab**: "By Date"

**User sees**: Line/bar chart showing daily cost over time

**Data points**: One per day with activity
- X axis: Date
- Y axis: Cost (USD)
- Color-coded by model

**Date range filter**:
- "All Time" → No filter
- "Last 7 Days" → Filter entries from last week
- "Last 30 Days" → Filter entries from last month
- Custom range → Date picker (start + end)

**Backend call**: `api.getUsageByDateRange(startDate, endDate)`

---

## Step 5: By Project Breakdown

**Tab**: "By Project"

**User sees**: Paginated table of projects sorted by cost (highest first)

| Project | Cost | Tokens | Sessions | Last Active |
|---------|------|--------|----------|-------------|
| nori-app | $15.40 | 500,000 | 23 | 2 hours ago |
| api-server | $12.00 | 380,000 | 18 | Yesterday |
| ... | ... | ... | ... | ... |

**Pagination**: 10 projects per page

---

## Step 6: Session-Level Details

**Tab**: "Sessions" (or drill-down from project)

**Backend call**: `api.getSessionStats(since, until, sortOrder)`

**User sees**: Table of individual sessions

| Session | Project | Model | Tokens | Cost | Date |
|---------|---------|-------|--------|------|------|
| First message... | nori-app | Sonnet | 12,345 | $0.04 | Today |
| Another session... | api-server | Opus | 45,678 | $3.42 | Yesterday |

**Sort options**: By date (newest/oldest), by cost (highest/lowest)

---

## Step 7: Export

**User action**: Clicks "Export" button

**Available formats**: CSV or JSON

**What happens**:
1. Serialize current usage data to chosen format
2. Save dialog opens
3. File saved to user-chosen location

---

## Cost Calculation Reference

### Pricing Table
```
Model         Input/1M   Output/1M   CacheWrite/1M   CacheRead/1M
Opus 4        $15.00     $75.00      $18.75           $1.50
Sonnet 4      $3.00      $15.00      $3.75            $0.30
```

### Per-Entry Formula
```
entry_cost = (input_tokens    × input_price    / 1,000,000)
           + (output_tokens   × output_price   / 1,000,000)
           + (cache_write_tok × cache_w_price  / 1,000,000)
           + (cache_read_tok  × cache_r_price  / 1,000,000)
```

### Caching Strategy
Frontend caches the full `UsageStats` response for 10 minutes:
```typescript
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const cachedAt = usageCacheTimestamp;
if (Date.now() - cachedAt < CACHE_DURATION) {
  return cachedData; // Skip API call
}
```
This prevents expensive full-filesystem walks on repeated tab switches.
