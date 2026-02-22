# Flow: Usage Limits & OAuth

> How the HUD fetches and displays API usage limits for Pro/Max/Team users.

---

## Flow Diagram

```
┌───────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Read         │────►│  Fetch API   │────►│  Cache       │────►│  Render      │
│  Credentials  │     │  (if needed) │     │  Response    │     │  Usage Bar   │
└───────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Step 1: Check Cache

**Cache file**: `~/.claude/plugins/claude-hud/.usage-cache.json`

```json
{
  "timestamp": 1705312200000,
  "data": {
    "fiveHourUtilization": 25,
    "sevenDayUtilization": 45,
    "fiveHourResetAt": "2025-01-15T19:00:00Z",
    "sevenDayResetAt": "2025-01-18T14:00:00Z",
    "subscriptionType": "max_5"
  },
  "error": null
}
```

**TTL**:
- Success: 60 seconds
- Failure: 15 seconds (retry sooner)

**If cache valid** → return cached data, skip API call.

---

## Step 2: Read Credentials

### Priority 1: macOS Keychain (Claude Code 2.x)

**Check backoff file first**: `~/.claude/plugins/claude-hud/.keychain-backoff`
- If file exists and < 60 seconds old → skip Keychain, try file-based
- Prevents repeated macOS Keychain prompts if user denied access

**Command**:
```bash
security find-generic-password -s "Claude Code-credentials" -w
```

**Returns**: JSON string containing `accessToken` and `refreshToken`.

### Priority 2: File-Based (Legacy)

**File**: `~/.claude/.credentials.json`

```json
{
  "claudeAiOauth": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### No Credentials Found
→ Return `null` (no usage display). API users don't have OAuth credentials.

---

## Step 3: Fetch Usage API

**Request**:
```
GET https://api.anthropic.com/api/oauth/usage
Authorization: Bearer <accessToken>
```

**Timeout**: 5000ms

**Success Response**:
```json
{
  "fiveHourUtilization": 25.3,
  "sevenDayUtilization": 45.0,
  "fiveHourResetAt": "2025-01-15T19:00:00.000Z",
  "sevenDayResetAt": "2025-01-18T14:00:00.000Z",
  "subscriptionType": "max_5"
}
```

**Error Handling**:
- 401: Invalid/expired token → cache error, show `⚠ (http-401)`
- 403: Access denied → cache error
- Network timeout → use stale cache if available
- Any error → cache with 15s TTL (retry soon)

---

## Step 4: Cache Response

Write to cache file with current timestamp:
```json
{
  "timestamp": 1705312200000,
  "data": { ... },
  "error": null
}
```

Or on error:
```json
{
  "timestamp": 1705312200000,
  "data": null,
  "error": "http-401"
}
```

---

## Step 5: Plan Detection

**From `subscriptionType`**:
```
"pro"              → "Pro"
"max_5"            → "Max"
"max_20"           → "Max"
"team"             → "Team"
null / undefined   → "API" (no OAuth, pay-per-token)
other              → Capitalized (e.g., "Enterprise")
```

**Bedrock detection** (from model ID, not usage API):
```
Model ID starts with "anthropic." or contains ":" → "Bedrock"
```

---

## Step 6: Render 5-Hour Usage

### Usage Bar
```
Usage ██░░░░░░░░ 25% (1h 30m / 5h)
```

**Components**:
1. "Usage" label (dim)
2. Progress bar (10 chars, quota colors)
3. Percentage (colored)
4. Reset time in parentheses

**Color thresholds**:
```
< 75%:  Bright Blue    (\x1b[94m) — Comfortable
75-89%: Bright Magenta (\x1b[95m) — Approaching limit
≥ 90%:  Red            (\x1b[31m) — Near/at limit
```

### Reset Time Formatting
```
resetMs = resetTime - now
> 24h:  "2d 3h"
> 1h:   "1h 30m"
> 0:    "45m"
≤ 0:    "now"
```

### Limit Reached (100%)
```
Usage ⚠ Limit reached (resets 1h 15m)
```

---

## Step 7: Render 7-Day Usage (Conditional)

**Only shown when**:
- 7-day utilization >= `sevenDayThreshold` (default: 80%)
- Both 5h and 7d data available

**Display**:
```
Usage ██░░░░░░░░ 25% (1h 30m / 5h) | ████████░░ 85% (2d / 7d)
```

Second bar appended with `|` separator.

---

## Step 8: Error Display

**API error**:
```
Usage ⚠ (http-401)
```

**No credentials**:
Usage section hidden entirely (API users).

---

## Complete Flow Example

### User with Max Plan

```
Invocation 1 (T=0):
  Cache: empty
  → Read Keychain: success (accessToken found)
  → Fetch API: 200 OK
  → Cache: { fiveHourUtilization: 25, ... }
  → Display: Usage ██░░░░░░░░ 25% (3h 30m / 5h)

Invocation 2 (T=300ms):
  Cache: valid (< 60s)
  → Return cached data (no API call)
  → Display: Usage ██░░░░░░░░ 25% (3h 30m / 5h)

... (200 more invocations, cache still valid) ...

Invocation 203 (T=61s):
  Cache: expired (> 60s)
  → Fetch API: 200 OK
  → Cache: { fiveHourUtilization: 28, ... }
  → Display: Usage ███░░░░░░░ 28% (3h 29m / 5h)
```

### User with API Key (No OAuth)

```
Invocation 1:
  → Read Keychain: no entry
  → Read credentials file: no file
  → Return null
  → Usage section: hidden
  → Display: [Opus | API] │ my-project git:(main*)
             Context █████░░░░░ 45%
```

### Keychain Denied

```
Invocation 1:
  → Read Keychain: user clicks "Deny"
  → Write backoff file (60s)
  → Read credentials file: found! (legacy)
  → Fetch API: 200 OK
  → Display: Usage ██░░░░░░░░ 25%

Invocation 2 (within 60s):
  → Check backoff: active
  → Skip Keychain (no prompt)
  → Read credentials file: found
  → Use cached data
```
