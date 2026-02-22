# Flow: Statusline Integration

> Embedding ccusage as a live status display in Claude Code.

---

## Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Claude Code  │────►│  ccusage     │────►│  Load Data   │────►│  Render      │
│ pipes stdin  │     │  statusline  │     │  (cached)    │     │  One Line    │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Step 1: Configure Statusline

**User action**: Add to `~/.claude/settings.json`:
```json
{
  "statusLine": {
    "command": "npx ccusage statusline"
  }
}
```

Or configure via ccusage config:
```json
{
  "commands": {
    "statusline": {
      "offline": true,
      "cache": true,
      "visual-burn-rate": "emoji",
      "cost-source": "both"
    }
  }
}
```

---

## Step 2: Claude Code Invokes

**What happens every ~300ms**:
1. Claude Code pipes session JSON to stdin
2. JSON includes: model, tokens, context window, transcript path, cwd
3. ccusage statusline command reads this input

---

## Step 3: Hybrid Cache Check

**What happens**:
1. Check file-based cache (time-based TTL)
2. If cache expired, also check if JSONL files have been modified
3. If neither condition met → return cached output (fast path)
4. If cache miss or files changed → reload data
5. Semaphore prevents concurrent invocations from conflicting

**Cache strategy**:
- **Time-based**: Configurable refresh interval (default: seconds)
- **File modification**: Check JSONL file mtime vs last read
- **Semaphore**: File-based lock prevents parallel reloads

---

## Step 4: Calculate Current Session

**What happens on cache miss**:
1. Parse stdin JSON for current context/tokens
2. Load JSONL data for current session
3. Calculate current session cost
4. Identify active billing block
5. Calculate burn rate if active

---

## Step 5: Render Status Line

**Output format** (single line):
```
$12.45 | ████░░░░░░ 42% | 🔥 2.1k/min
```

**Components**:
1. **Cost**: Current session cost (configurable source)
   - `auto`: Use Claude Code's cost if available, otherwise ccusage calculated
   - `ccusage`: Always use ccusage calculated cost
   - `cc`: Always use Claude Code's reported cost
   - `both`: Show both values
2. **Context bar**: Color-coded progress bar
   - Green: < threshold (default 50%)
   - Yellow: 50-80%
   - Red: > 80%
   - Thresholds configurable via `--context-low-threshold` and `--context-medium-threshold`
3. **Burn rate** (optional, configurable display):
   - `off`: Hidden
   - `emoji`: 🔥 with rate
   - `text`: "2.1k/min"
   - `emoji-text`: Both

---

## Step 6: Claude Code Displays

1. Claude Code captures stdout from the statusline command
2. Renders it in the status bar area
3. Refreshes on next invocation (~300ms later)

**User sees**: Live-updating cost, context usage, and burn rate below the input area.
