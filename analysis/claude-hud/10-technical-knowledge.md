# claude-hud - Technical Knowledge Base

> Everything needed to understand or rebuild claude-hud's core capabilities.

---

## 1. Claude Code Statusline Protocol

**Invocation**: Claude Code calls the plugin command every ~300ms, piping JSON via stdin.

**Registration** (in `~/.claude/settings.json`):
```json
{
  "statusLine": {
    "command": "node ~/.claude/plugins/claude-hud/dist/index.js"
  }
}
```

**stdin JSON format**:
```typescript
interface StdinData {
  model?: {
    id?: string           // e.g., "claude-opus-4-20250514"
    display_name?: string // e.g., "Claude Opus 4"
  }
  context_window?: {
    context_window_size?: number  // e.g., 200000
    current_usage?: {
      input_tokens?: number
      output_tokens?: number
      cache_creation_input_tokens?: number
      cache_read_input_tokens?: number
    }
    used_percentage?: number       // v2.1.6+ (native, accurate)
    remaining_percentage?: number  // v2.1.6+
  }
  transcript_path?: string  // Path to session JSONL file
  cwd?: string              // Current working directory
}
```

**Output**: ANSI-colored text to stdout. Claude Code captures and displays it.

---

## 2. Context Window Percentage Calculation

**v2.1.6+ (preferred)**: Use native `used_percentage` field directly.

**Older versions (fallback)**:
```typescript
function getContextPercent(stdin: StdinData): number {
  const total = stdin.context_window?.context_window_size ?? 0
  const used = stdin.context_window?.current_usage?.input_tokens ?? 0
  return total > 0 ? (used / total) * 100 : 0
}
```

**Autocompact buffer** (22.5%):
```typescript
function getBufferedPercent(rawPercent: number): number {
  // Claude Code reserves ~22.5% of context for autocompact
  // Effective capacity is 77.5% of the window
  const effectiveMax = 100 - 22.5  // 77.5
  return Math.min((rawPercent / effectiveMax) * 100, 100)
}
```

**Color thresholds**:
- Green (`\x1b[32m`): < 70%
- Yellow (`\x1b[33m`): 70-84%
- Red (`\x1b[31m`): >= 85%

---

## 3. Transcript JSONL Parsing

**File**: Session transcript at `transcript_path` from stdin.

**Line-by-line parsing** (readline interface):

```typescript
function parseTranscript(path: string): {
  tools: ToolInfo[]    // Latest 20
  agents: AgentInfo[]  // Latest 10
  todos: TodoInfo[]    // Current list
  sessionStart: string // Timestamp of first entry
}
```

### Tool Extraction
```typescript
// From tool_use blocks:
{
  id: string           // tool_use block ID
  name: string         // "Read", "Write", "Edit", "Bash", "Glob", "Grep"
  target: string       // Extracted file path, pattern, or command
  status: "running"    // Initially
  startTime: string    // Timestamp
}

// From tool_result blocks:
// Match by tool_use_id → set status = "completed" or "error"
// Calculate duration: endTime - startTime

// Target extraction by tool name:
// Read/Write/Edit → input.file_path
// Glob → input.pattern
// Grep → input.pattern
// Bash → first 30 chars of input.command
```

### Agent Extraction
```typescript
// From Task tool_use blocks:
{
  type: string         // input.subagent_type ("explore", "plan", etc.)
  model: string        // input.model ("haiku", "sonnet", etc.)
  description: string  // input.description
  status: "running"    // Initially
  startTime: string
}
```

### Todo Extraction
```typescript
// From TodoWrite blocks → older format
// From TaskCreate blocks → newer format
// From TaskUpdate blocks → status changes
{
  content: string      // Task subject/description
  status: "pending" | "in_progress" | "completed"
}
```

---

## 4. OAuth Usage API

**Endpoint**: `GET https://api.anthropic.com/api/oauth/usage`

**Authentication**: Bearer token from OAuth credentials.

### Credential Resolution
```typescript
// Priority order:
// 1. macOS Keychain (Claude Code 2.x)
//    security find-generic-password -s "Claude Code-credentials" -w
//    Returns JSON: { accessToken, refreshToken }
//
// 2. File-based (legacy)
//    ~/.claude/.credentials.json
//    Contains: { claudeAiOauth: { accessToken, refreshToken } }
```

### API Response
```typescript
interface UsageResponse {
  fiveHourUtilization: number   // 0-100 percentage
  sevenDayUtilization: number   // 0-100 percentage
  fiveHourResetAt: string       // ISO timestamp
  sevenDayResetAt: string       // ISO timestamp
  subscriptionType: string      // "pro", "max_5", "max_20", "team"
}
```

### Plan Detection
```typescript
function getPlanLabel(subscriptionType: string): string {
  if (subscriptionType.startsWith("max")) return "Max"
  if (subscriptionType === "pro") return "Pro"
  if (subscriptionType === "team") return "Team"
  return subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1)
}

// API users (no subscriptionType) → return null (no usage display)
```

### Caching
```typescript
// File: ~/.claude/plugins/claude-hud/.usage-cache.json
// TTL: 60 seconds (success), 15 seconds (failure)
// On cache miss: fetch from API
// On API failure: return cached data if available

// Keychain backoff:
// File: ~/.claude/plugins/claude-hud/.keychain-backoff
// Duration: 60 seconds after Keychain failure
// Prevents repeated macOS Keychain prompts
```

**Usage color thresholds**:
- Bright Blue (`\x1b[94m`): < 75%
- Bright Magenta (`\x1b[95m`): 75-89%
- Red (`\x1b[31m`): >= 90%

---

## 5. Git Status Integration

**Commands executed** (all with 1000ms timeout):

```bash
# Branch name
git rev-parse --abbrev-ref HEAD

# Dirty check (uncommitted changes)
git --no-optional-locks status --porcelain

# Ahead/behind upstream
git rev-list --left-right --count @{upstream}...HEAD
```

**File stats parsing** (from porcelain output):
```typescript
// Each line: XY filename
// X = index status, Y = worktree status
// M/R/C = modified (count as modified)
// A = added
// D = deleted
// ?? = untracked

// Display format (Starship-compatible):
// !3 = 3 modified files
// +1 = 1 added file
// ✘2 = 2 deleted files
// ?1 = 1 untracked file
```

**Safety**: Uses `execFile` (no shell), prevents command injection. Failures handled gracefully (return null).

---

## 6. Configuration File Counting

**Scopes**:

```typescript
// User scope:
const userPaths = [
  "~/.claude/CLAUDE.md",
  "~/.claude/rules/",           // Recursive .md count
  "~/.claude/settings.json",    // MCPs + hooks
  "~/.claude.json",             // MCPs
]

// Project scope:
const projectPaths = [
  "{cwd}/CLAUDE.md",
  "{cwd}/CLAUDE.local.md",
  "{cwd}/.claude/CLAUDE.md",
  "{cwd}/.claude/CLAUDE.local.md",
  "{cwd}/.claude/rules/",       // Recursive .md count
  "{cwd}/.mcp.json",            // MCPs
  "{cwd}/.claude/settings.json",      // MCPs + hooks
  "{cwd}/.claude/settings.local.json",
]
```

**MCP counting**:
1. Collect all `mcpServers` keys from settings files
2. Subtract disabled MCPs (`disabledMcpServers`, `disabledMcpjsonServers`)
3. Deduplicate within scope (not across scopes)

---

## 7. Output Speed Calculation

```typescript
function getOutputSpeed(stdin: StdinData): number | null {
  const currentTokens = stdin.context_window?.current_usage?.output_tokens ?? 0
  const currentTime = Date.now()

  // Read previous from cache
  const prev = readCache("~/.claude/plugins/claude-hud/.speed-cache.json")

  // Always update cache with current values
  writeCache({ tokens: currentTokens, time: currentTime })

  if (!prev) return null

  const deltaTokens = currentTokens - prev.tokens
  const deltaMs = currentTime - prev.time

  // Only calculate if within 2000ms window and positive delta
  if (deltaMs > 2000 || deltaMs <= 0 || deltaTokens <= 0) return null

  return deltaTokens / (deltaMs / 1000)  // tokens/second
}
```

---

## 8. ANSI Rendering

### Progress Bar
```typescript
function coloredBar(percent: number, width: number = 10): string {
  const filled = Math.round((percent / 100) * width)
  const empty = width - filled
  const color = getContextColor(percent)
  return color + "█".repeat(filled) + "░".repeat(empty) + RESET
}
```

### Color Functions
```typescript
const RESET = "\x1b[0m"
const green = (t: string) => `\x1b[32m${t}${RESET}`
const yellow = (t: string) => `\x1b[33m${t}${RESET}`
const red = (t: string) => `\x1b[31m${t}${RESET}`
const cyan = (t: string) => `\x1b[36m${t}${RESET}`
const magenta = (t: string) => `\x1b[35m${t}${RESET}`
const dim = (t: string) => `\x1b[2m${t}${RESET}`
const brightBlue = (t: string) => `\x1b[94m${t}${RESET}`
const brightMagenta = (t: string) => `\x1b[95m${t}${RESET}`
```

### Layout Construction
```typescript
// Expanded: multiple lines joined by \n
// Compact: single line with | separators

// Each line renderer returns string or null (hidden if no data)
// Null lines are filtered out before joining
```

---

## 9. Session Duration

```typescript
function formatSessionDuration(sessionStart: string, now: Date): string {
  const ms = now.getTime() - new Date(sessionStart).getTime()
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}
```

---

## 10. Token Formatting

```typescript
function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}k`
  return count.toString()
}

// Token breakdown (shown at 85%+ context):
// "(in: 45k, cache: 12k)"
```

---

## 11. Dependency Injection Pattern

```typescript
// Main entry exports main(overrides) for testability
export async function main(overrides?: {
  readStdin?: () => Promise<StdinData>
  getGitStatus?: (cwd: string) => Promise<GitStatus | null>
  getUsage?: () => Promise<UsageData | null>
  loadConfig?: () => HudConfig
  // ... more overridable functions
}) {
  const _readStdin = overrides?.readStdin ?? readStdin
  const _getGitStatus = overrides?.getGitStatus ?? getGitStatus
  // ... use injected or real implementations
}
```

This allows unit testing each component independently without I/O.

---

## 12. Bedrock Model Detection

```typescript
function isBedrockModelId(id: string): boolean {
  // Bedrock models have format: "anthropic.claude-*" or contain ":"
  return id.startsWith("anthropic.") || id.includes(":")
}

function getProviderLabel(stdin: StdinData): string {
  const modelId = stdin.model?.id ?? ""
  if (isBedrockModelId(modelId)) return "Bedrock"
  return ""  // Anthropic models don't show provider label
}
```

---

## 13. Reset Time Formatting

```typescript
function formatResetTime(isoString: string): string {
  const resetMs = new Date(isoString).getTime() - Date.now()
  if (resetMs <= 0) return "now"

  const hours = Math.floor(resetMs / 3600000)
  const minutes = Math.floor((resetMs % 3600000) / 60000)

  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// Display format:
// "Usage ██░░░░░░░░ 25% (1h 30m / 5h)"
// "Usage ⚠ Limit reached (resets 1h)"
```
