# Flow: Real-Time Session Monitoring

> How the HUD displays and updates context window and usage information.

---

## Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Claude Code  │────►│  Parse stdin │────►│  Calculate   │────►│  Render Bars │
│ pipes data   │     │  JSON        │     │  Percentages │     │  & Colors    │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
       │                                                              │
       └──────────────── every ~300ms ────────────────────────────────┘
```

---

## Step 1: Claude Code Invokes Plugin

**Every ~300ms**, Claude Code:
1. Collects current session state
2. Serializes to JSON
3. Pipes via stdin to plugin command
4. Captures stdout for statusline display

**stdin JSON includes**:
```json
{
  "model": { "id": "claude-opus-4-20250514", "display_name": "Claude Opus 4" },
  "context_window": {
    "context_window_size": 200000,
    "current_usage": {
      "input_tokens": 89500,
      "output_tokens": 12300,
      "cache_creation_input_tokens": 5200,
      "cache_read_input_tokens": 8100
    },
    "used_percentage": 45.2
  },
  "transcript_path": "/Users/me/.claude/projects/.../session.jsonl",
  "cwd": "/Users/me/project"
}
```

---

## Step 2: Context Percentage Calculation

### Native Percentage (v2.1.6+)
```
If stdin.context_window.used_percentage exists:
  rawPercent = 45.2% (directly from Claude Code)
```

### Fallback Calculation (Older Versions)
```
totalTokens = input + cache_creation + cache_read = 89500 + 5200 + 8100 = 102800
rawPercent = (102800 / 200000) * 100 = 51.4%
```

### Autocompact Buffer Adjustment
Claude Code reserves ~22.5% of context for autocompact:
```
effectiveMax = 100 - 22.5 = 77.5%
bufferedPercent = (rawPercent / 77.5) * 100

Example: 45.2% raw → (45.2 / 77.5) * 100 = 58.3% effective
```

This shows the user their true position relative to when compaction will trigger.

---

## Step 3: Context Bar Rendering

### Color Selection
```
< 70%:  Green  (\x1b[32m)  — Healthy
70-84%: Yellow (\x1b[33m)  — Caution
≥ 85%:  Red    (\x1b[31m)  — Warning
```

### Bar Construction
```
width = 10 characters
filled = round((percent / 100) * width)
empty = width - filled

Example at 45%:
  filled = 5, empty = 5
  "█████░░░░░" (green)

Example at 82%:
  filled = 8, empty = 2
  "████████░░" (yellow)

Example at 95%:
  filled = 10, empty = 0
  "██████████" (red)
```

### Display Formats

**Percentage mode** (default):
```
Context █████░░░░░ 45%
```

**Token mode** (`contextValue: 'tokens'`):
```
Context █████░░░░░ 103k / 200k
```

### Token Breakdown (at 85%+)

When context exceeds 85%, show breakdown:
```
Context ████████░░ 87% (in: 89k, cache: 13k)
```

Helps user understand what's consuming context.

---

## Step 4: Usage Display (Pro/Max/Team)

### Fetch Usage Data
See [Flow: Usage Limits & OAuth](./15-flow-usage-limits.md) for full details.

### 5-Hour Usage Bar
```
Usage ██░░░░░░░░ 25% (1h 30m / 5h)
```

**Colors**:
```
< 75%:  Bright Blue    (\x1b[94m)
75-89%: Bright Magenta (\x1b[95m)
≥ 90%:  Red            (\x1b[31m)
```

### 7-Day Usage (when ≥ threshold)
Only shown when 7-day usage exceeds `sevenDayThreshold` (default: 80%):
```
Usage ██░░░░░░░░ 25% (1h 30m / 5h) | ████████░░ 85% (2d / 7d)
```

### Limit Reached
```
Usage ⚠ Limit reached (resets 1h 15m)
```

### API Users
No usage display for API users (pay-per-token, no rate limits).

---

## Step 5: Model & Plan Display

### Model Bracket
```
[Opus | Max]     ← Opus model, Max plan
[Sonnet | Pro]   ← Sonnet model, Pro plan
[Haiku | Team]   ← Haiku model, Team plan
[Claude | API]   ← API user (no plan)
[Opus | Bedrock] ← AWS Bedrock model
```

**Model name extraction**: Uses `display_name` (cleaned) or falls back to `id`.

**Plan detection**: From `subscriptionType` in usage API response.

---

## Step 6: Session Duration & Speed (Optional)

### Duration (`showDuration: true`)
```
⏱️ 1h 23m
```
Calculated from first transcript entry timestamp to now.

### Output Speed (`showSpeed: true`)
```
out: 42.1 tok/s
```
Calculated from delta output_tokens / delta time between invocations.
Only shown if within 2000ms window and positive delta.

---

## Step 7: Expanded vs Compact Layout

### Expanded (default)
```
[Opus | Max] │ my-project git:(main*)
Context █████░░░░░ 45% │ Usage ██░░░░░░░░ 25% (1h 30m / 5h)
```

Two lines. First line: identity. Second line: metrics.

### Compact
```
[Opus] █████░░░░░ 45% | my-project git:(main*) | 2 CLAUDE.md | Usage ██░░░░░░░░ 25% | ⏱️ 5m
```

Everything on one line, separated by `|`.

---

## Update Cycle

```
Time 0ms:    Claude Code pipes stdin → plugin renders → display updates
Time 300ms:  Claude Code pipes stdin → plugin renders → display updates
Time 600ms:  Claude Code pipes stdin → plugin renders → display updates
...

Each cycle:
  - stdin parsed (fast, no I/O)
  - Usage API checked (cached, usually no I/O)
  - Git status checked (1 exec, 1s timeout)
  - Transcript parsed (file read, ~20 tools)
  - Render and output (string concatenation)

Total time per cycle: < 100ms typically
```
