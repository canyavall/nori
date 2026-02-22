# ccusage - Technical Knowledge Base

> Everything needed to understand or rebuild ccusage's core capabilities.

---

## 1. JSONL File Discovery

**Claude Code data locations** (checked in order):
1. `$CLAUDE_CONFIG_DIR` (env var, supports comma-separated multiple paths)
2. `~/.config/claude/projects/` (new default, Claude Code v1.0.30+)
3. `~/.claude/projects/` (legacy location)

**File structure**:
```
~/.config/claude/projects/
├── -Users-me-project-name/           # Path-encoded project directory
│   ├── <session-id-1>.jsonl
│   ├── <session-id-2>.jsonl
│   └── ...
└── -Users-me-other-project/
    └── <session-id-3>.jsonl
```

**Project name extraction**: Strip the base path and decode the path-encoded directory name.

---

## 2. JSONL Entry Format

Each line in a JSONL file represents one API call's usage:

```json
{
  "timestamp": "2025-01-15T10:30:00.123Z",
  "sessionId": "abc123-def456-789xyz",
  "version": "1.0.5",
  "message": {
    "id": "msg-12345",
    "model": "claude-opus-4-20250514",
    "usage": {
      "input_tokens": 1245,
      "output_tokens": 28756,
      "cache_creation_input_tokens": 512,
      "cache_read_input_tokens": 256
    }
  },
  "costUSD": 12.45,
  "requestId": "req-abcd",
  "isApiErrorMessage": false
}
```

**Key fields**: `timestamp` (ISO 8601), `message.model`, `message.usage.*`, `costUSD` (optional, added in newer versions).

---

## 3. Valibot Schema Validation

ccusage uses Valibot (lightweight alternative to Zod) for strict schema validation:

```typescript
const usageDataSchema = v.object({
  timestamp: v.string(),
  message: v.object({
    model: v.string(),
    usage: v.object({
      input_tokens: v.number(),
      output_tokens: v.number(),
      cache_creation_input_tokens: v.optional(v.number()),
      cache_read_input_tokens: v.optional(v.number()),
    }),
  }),
  costUSD: v.optional(v.number()),
  sessionId: v.string(),
  requestId: v.string(),
})
```

**Branded types**: Uses Valibot brands for type-safe IDs:
- `ModelName`, `SessionId`, `RequestId`, `MessageId`
- `DailyDate` (YYYY-MM-DD), `MonthlyDate` (YYYY-MM), `WeeklyDate`
- Created via factory functions: `createModelName()`, `createDailyDate()`, etc.

---

## 4. Entry Deduplication

Entries may appear in multiple JSONL files. Deduplicate by hash:

```typescript
function isDuplicateEntry(entry, processedHashes: Set<string>): boolean {
  const hash = md5(`${entry.sessionId}:${entry.requestId}:${entry.timestamp}`)
  if (processedHashes.has(hash)) return true
  processedHashes.add(hash)
  return false
}
```

---

## 5. Cost Calculation Modes

Three modes with different trade-offs:

| Mode | Uses `costUSD` | Calculates from tokens | Best for |
|------|---------------|----------------------|----------|
| `auto` (default) | Yes, if present | Fallback when missing | General use |
| `calculate` | No | Always | Consistent analysis |
| `display` | Yes | Never ($0 if missing) | Billing verification |

**Token-based calculation**:
```typescript
cost = (input_tokens * input_price / 1_000_000)
     + (output_tokens * output_price / 1_000_000)
     + (cache_creation_tokens * cache_creation_price / 1_000_000)
     + (cache_read_tokens * cache_read_price / 1_000_000)
```

---

## 6. LiteLLM Pricing Integration

**Source**: Public LiteLLM pricing database with 100+ models.

**Flow**:
1. Fetch pricing from LiteLLM API (HTTP)
2. Cache in memory for session duration
3. Offline mode: use embedded snapshot of Claude model prices
4. Match model name to pricing entry
5. Extract per-token costs for each token type

**Offline fallback**: Built-in pricing snapshot covers all Claude models. Activated with `--offline` flag or `CCUSAGE_OFFLINE=1`.

---

## 7. 5-Hour Billing Block Detection

Claude uses 5-hour rolling windows for billing. ccusage identifies these windows:

```typescript
function identifySessionBlocks(entries: Entry[], blockDuration: number = 5): Block[] {
  // Sort entries by timestamp
  // Floor first entry to hour boundary → block start
  // Group consecutive entries within 5-hour window
  // If gap > 5 hours since last entry → new block
  // Track: start time, end time, token totals, models used
}
```

**Block states**:
- **Active**: Started < 5 hours ago, still accepting entries
- **Completed**: 5 hours elapsed or no activity
- **Gap**: Period with no activity between blocks

**Burn rate**: `totalTokens / minutesElapsed` (tokens/minute)

**Projection**: `currentTokens + (burnRate * minutesRemaining)`

---

## 8. Date/Time Handling

**Timezone-aware grouping**:
```typescript
function formatDate(dateStr: string, timezone?: string, locale?: string): string {
  const date = new Date(dateStr)
  const formatter = new Intl.DateTimeFormat(locale ?? 'en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    timeZone: timezone,
  })
  return formatter.format(date)
}
```

**Default locale**: `en-CA` produces `YYYY-MM-DD` format naturally.

**Weekly grouping**: Supports configurable start-of-week (Monday or Sunday). Uses `WeeklyDate` branded type.

---

## 9. Responsive Table Rendering

**@ccusage/terminal** package handles table output:

```typescript
const terminalWidth = process.stdout.columns || 80

if (terminalWidth < 100) {
  // Compact mode: Date | Models | Input | Output | Cost
  // Omit: Cache Create, Cache Read, Total Tokens
} else {
  // Full mode: all columns shown
}
```

**Features**:
- Auto-detects terminal width
- Color-coded cost values
- Model names as bulleted lists within cells
- Totals row with separator
- Forced compact mode via `--compact` flag

---

## 10. Configuration System

**Layered precedence** (highest to lowest):
1. CLI arguments
2. Custom config file (`--config`)
3. Local project config (`.ccusage/ccusage.json`)
4. User config (`~/.config/claude/ccusage.json`)
5. Legacy config (`~/.claude/ccusage.json`)
6. Built-in defaults

**Config structure**:
```json
{
  "$schema": "https://ccusage.com/config-schema.json",
  "defaults": {
    "timezone": "UTC",
    "locale": "en-CA",
    "mode": "auto",
    "offline": false,
    "breakdown": false
  },
  "commands": {
    "daily": { "instances": true, "order": "desc" },
    "blocks": { "active": true, "tokenLimit": "500000" }
  }
}
```

**Merging**: `mergeConfigWithArgs(cliContext, loadedConfig)` applies CLI args on top of config, which is on top of defaults.

---

## 11. Statusline Integration

**Claude Code invocation**: Statusline is configured as a hook command that receives JSON via stdin.

**Hybrid caching**: Combines time-based expiry (configurable interval) with file modification detection (checks if JSONL files have been modified since last cache).

**Semaphore**: Uses a file-based semaphore to prevent concurrent statusline invocations from interfering.

**Output format**: Single line of text with optional color codes:
```
$12.45 | ████░░░░░░ 42% | 🔥 2.1k/min
```

---

## 12. Functional Error Handling

Uses `@praha/byethrow` for Result types:

```typescript
// Instead of try/catch:
const result = loadConfig(path)
if (result.isErr()) {
  // Handle error
  return defaultConfig
}
return result.value
```

This pattern avoids exception-based control flow and makes error paths explicit.

---

## 13. JSON + jq Integration

When `--json` flag is set:
1. Logger silenced (level 0) to avoid mixing output
2. Data serialized to JSON with consistent structure
3. If `--jq <filter>` provided: pipes JSON through external `jq` command
4. Output goes to stdout for piping to other tools

**JSON structure** (daily example):
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
      "modelsUsed": ["claude-opus-4-20250514"],
      "modelBreakdowns": [...]
    }
  ],
  "totals": {
    "inputTokens": 10234,
    "outputTokens": 245678,
    "totalTokens": 259184,
    "totalCost": 125.67
  }
}
```
