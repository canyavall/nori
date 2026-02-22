# Flow: Session & Block Analysis

> Drill down into individual sessions and 5-hour billing windows.

---

## Flow Diagram

```
┌──────────┐     ┌───────────────┐     ┌──────────────┐     ┌──────────────┐
│  Session  │────►│  Load JSONL   │────►│  Identify    │────►│  Render with │
│  or Block │     │  Entries      │     │  Windows     │     │  Projections │
│  Command  │     │               │     │              │     │              │
└──────────┘     └───────────────┘     └──────────────┘     └──────────────┘
```

---

## Journey 1: Session Report

**User action**: `ccusage session`

### Step 1: Load All Sessions

**What happens**:
1. Discover Claude data directories
2. Glob for all JSONL files
3. Each file = one session (filename is session ID)
4. Parse entries per file, aggregate totals

### Step 2: Aggregate Per Session

For each session file:
- Sum all token types
- Calculate total cost
- Record models used
- Record last activity timestamp
- Display shortened session ID (last 2 parts)

### Step 3: Render

**User sees**:
```
┌──────────────┬─────────────┬────────┬─────────┬────────────┬────────────────────┐
│ Session ID   │ Project     │ Input  │ Output  │ Cost (USD) │ Last Activity      │
├──────────────┼─────────────┼────────┼─────────┼────────────┼────────────────────┤
│ ...f456-789x │ myproject   │ 10,234 │ 245,678 │    $125.67 │ 2025-01-15 14:30   │
│ ...a123-456b │ other       │  5,678 │ 123,456 │     $45.23 │ 2025-01-14 09:15   │
└──────────────┴─────────────┴────────┴─────────┴────────────┴────────────────────┘
```

---

## Journey 2: Session Lookup

**User action**: `ccusage session --id abc123-def456-789xyz`

### Step 1: Find Session

1. Search JSONL files for matching session ID
2. Read all entries from that specific file

### Step 2: Detailed Output

Shows single session with full details:
- Complete session ID
- Project name
- Total tokens by type
- Total cost
- Models used
- First and last activity timestamps
- Number of API calls (entries)

---

## Journey 3: 5-Hour Billing Blocks

**User action**: `ccusage blocks`

### Step 1: Load & Sort

1. Load all JSONL entries across all sessions
2. Sort by timestamp globally

### Step 2: Identify Billing Windows

```
Timeline of entries:

  09:00  09:15  09:45  10:30  11:00  12:15  13:30  ← entries
  |------|------|------|------|------|------|------|
  [========= Block 1 (09:00-14:00) ==============]
                                                    [=== Block 2 (15:30-20:30) ===]
                                                      15:30  16:00  17:45  ← entries
```

**Algorithm**:
1. Floor first entry's timestamp to hour boundary → block start
2. Block window = start + 5 hours
3. Group consecutive entries within window
4. If gap > 5 hours since last entry → start new block
5. Track whether block is active (started < 5 hours ago)

### Step 3: Calculate Block Metrics

For each block:
- **Status**: Active (⏰) or Completed (✅)
- **Duration**: Time from first to last entry within block
- **Burn rate** (active only): `totalTokens / minutesElapsed` → tokens/min
- **Projection** (active only): `currentTokens + (burnRate * minutesRemaining)`
- **Projected cost**: Calculate cost for projected token count

### Step 4: Render

**User sees**:
```
┌─────────────────────┬──────────────────┬────────┬─────────┬────────────┐
│ Block Start Time    │ Models           │ Input  │ Output  │ Cost (USD) │
├─────────────────────┼──────────────────┼────────┼─────────┼────────────┤
│ 2025-01-15 09:00:00 │ • opus-4         │  4,512 │ 285,846 │    $156.40 │
│ ⏰ Active (2h 15m)  │ • sonnet-4       │        │         │            │
│ 🔥 Rate: 2.1k/min   │                  │        │         │            │
│ 📊 Projected: 450k  │                  │        │         │            │
├─────────────────────┼──────────────────┼────────┼─────────┼────────────┤
│ 2025-01-15 04:00:00 │ • sonnet-4       │  2,775 │ 186,645 │     $98.45 │
│ ✅ Completed (3h 42m)│                  │        │         │            │
├─────────────────────┼──────────────────┼────────┼─────────┼────────────┤
│ Total               │                  │  7,287 │ 472,491 │    $254.85 │
└─────────────────────┴──────────────────┴────────┴─────────┴────────────┘
```

---

## Journey 4: Active Block Only

**User action**: `ccusage blocks --active`

### What happens:
1. Same block identification as Journey 3
2. Filter to only the currently active block (started < 5 hours ago)
3. Show detailed projections:
   - Time elapsed / time remaining
   - Current token burn rate (tokens/minute)
   - Projected final token count
   - Projected final cost
   - Time until block resets

**User sees**: Single block with full projection details.

---

## Journey 5: Recent Blocks

**User action**: `ccusage blocks --recent`

### What happens:
1. `filterRecentBlocks()` returns blocks from last 3 days
2. Includes active block if present
3. More focused view than full history

---

## Journey 6: Token Limit Monitoring

**User action**: `ccusage blocks --token-limit 500000`

### What happens:
1. Normal block identification
2. For active block: compare projected tokens against limit
3. If projected > limit: highlight with warning
4. Show percentage of limit consumed

**Use case**: Track whether you're approaching Claude's rate limits within a billing window.

---

## Journey 7: Live Monitoring

**User action**: `ccusage blocks --live --refresh-interval 30`

### What happens:
1. Initial block display rendered
2. Every 30 seconds:
   - Re-read JSONL files (check for new entries)
   - Re-calculate block metrics
   - Re-render display
3. Burn rate and projections update in real-time
4. Ctrl+C to exit

**Use case**: Keep a terminal open showing live usage during an intensive coding session.
