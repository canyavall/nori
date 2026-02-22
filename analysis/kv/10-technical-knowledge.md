# KV - Technical Knowledge Base

> Everything needed to understand or rebuild KV's core capabilities.

---

## 1. Claude Code Hook Protocol

**Hook types used by KV**:

| Hook | Event | stdin Format | Output |
|------|-------|-------------|--------|
| `SessionStart` | New session begins | `{ session_id, transcript_path, source }` | Context text to stdout |
| `UserPromptSubmit` | User sends a prompt | `{ prompt, session_id, ... }` | Transformed prompt JSON to stdout |
| `PostToolUse` | Tool completes | `{ tool_name, tool_input, tool_result }` | `hookSpecificOutput.additionalContext` |

**Registration** (in `settings.json`):
```json
{
  "hooks": {
    "SessionStart": [{ "type": "command", "command": "node kv-onStart.mjs" }],
    "UserPromptSubmit": [{ "type": "command", "command": "node kv-onPrompt.mjs" }],
    "PostToolUse": [{ "type": "command", "command": "node kv-onTool.mjs" }]
  }
}
```

**Critical rule**: Hooks must always exit 0. Errors are logged but never block Claude Code.

---

## 2. Knowledge Vault Structure

**Directory layout**:
```
vault/
├── frontend/
│   ├── react-patterns.md
│   └── css-conventions.md
├── backend/
│   ├── api-design.md
│   └── database-patterns.md
├── business/
│   └── domain-model.md
└── tooling/
    └── ci-cd.md
```

**Frontmatter format** (YAML):
```yaml
---
tags:
  - react
  - components
  - hooks
description: React component patterns and conventions
required_knowledge:
  - typescript-basics
auto_load:
  - "src/components/**/*.tsx"
  - "src/hooks/**/*.ts"
  - "!**/*.test.tsx"
---
# React Patterns
...content...
```

**Fields**:
- `tags`: Searchable keywords for matching
- `description`: Human-readable summary
- `required_knowledge`: Dependency packages (loaded together)
- `auto_load`: Minimatch glob patterns for file-triggered loading

---

## 3. Knowledge Index Build

**Input**: All `.md` files in `vault/` and `vault-local/`
**Output**: `knowledge.json`

```typescript
interface KnowledgeIndex {
  packages: PackageMetadata[]
  tags: { [tag: string]: string[] }  // tag → package names
}

interface PackageMetadata {
  name: string           // filename without .md
  path: string           // relative path in vault
  description?: string   // from frontmatter
  tags: string[]         // from frontmatter
  auto_load?: string[]   // glob patterns
  dependencies?: string[] // required_knowledge
}
```

**Fast path**: Compare vault directory mtime against knowledge.json mtime. Skip rebuild if unchanged (~10ms vs ~120ms).

**Category derivation**: From directory path. `vault/frontend/react-patterns.md` → category: `frontend`.

---

## 4. Pattern Matching & Auto-Load

**Trigger**: PostToolUse hook fires for Read, Edit, or Write tool.

**Pattern matching** (minimatch):
```typescript
function matchPatterns(filePath: string, index: KnowledgeIndex): Match[] {
  for (const pkg of index.packages) {
    if (!pkg.auto_load) continue
    for (const pattern of pkg.auto_load) {
      if (pattern.startsWith('!')) continue  // skip negation in positive pass
      if (minimatch(filePath, pattern)) {
        // Check negation patterns
        const negated = pkg.auto_load
          .filter(p => p.startsWith('!'))
          .some(p => minimatch(filePath, p.slice(1)))
        if (!negated) matches.push({ package: pkg, pattern, priority })
      }
    }
  }
  return matches
}
```

**Priority scoring**:
```typescript
function calculatePatternPriority(pattern: string): number {
  let priority = 0
  priority -= 10 * (pattern.match(/\*/g)?.length ?? 0)  // wildcards penalized
  priority += 5 * pattern.split('/').length               // depth rewarded
  priority += pattern.includes('.') ? 10 : 0              // extension rewarded
  return priority
}
```

**Limits**: Maximum 15 packages per auto-load event, sorted by priority descending.

---

## 5. Smart Agent (Semantic Matching)

**Purpose**: Match user prompts against knowledge vault using Claude's understanding.

**Invocation**:
```typescript
// Spawns: node smart-agent.mjs
// Which calls: claude --print --model sonnet
// Input: user prompt + category tree
// Output: JSON list of matched packages
```

**Category tree format** (sent to Claude):
```
frontend/
  react-patterns (tags: react, components, hooks)
  css-conventions (tags: css, styling, tailwind)
backend/
  api-design (tags: rest, graphql, endpoints)
  database-patterns (tags: sql, migrations, orm)
```

**Configuration**:
```typescript
const SMART_AGENT_CONFIG = {
  maxPackages: 10,    // max packages to return
  timeout: 15000,     // 15s timeout for claude call
  model: 'sonnet'     // model for matching
}
```

**Invocation timeout**: 2x config timeout (30s) to account for Claude API latency.

---

## 6. Trivial Prompt Detection

**Purpose**: Skip the expensive smart agent call for confirmations and trivial responses.

```typescript
function isTrivialPrompt(prompt: string): boolean {
  if (!prompt.trim()) return true           // empty
  if (prompt.length > 20) return false      // long = meaningful (fast path)
  const words = prompt.split(/\s+/).filter(w => w.length > 1)
  if (words.length < 2) return true         // single word
  // Known trivial patterns:
  const patterns = [
    /^(yes|no|ok|sure|thanks|go|do it|sounds good|looks good|go ahead|please|yep|nah)$/i,
    // ... more patterns
  ]
  return patterns.some(p => p.test(prompt.trim()))
}
```

---

## 7. Role Injection System

**Role precedence**: `customRole` > `defaultRole` > `'staff_engineer'`

**Template loading**: From `features/role/inject/templates/{roleName}.txt`

**Injection schedule**:
```typescript
function formatRoleOutput(template: string, promptCount: number): string {
  if (promptCount === 0) return `<role>${template}</role>`
  if (promptCount % 5 === 0) return `<reminder>${extractBrief(template)}</reminder>`
  return ''  // silent (80% of prompts)
}
```

**Brief extraction**: First line or first sentence, max ~100 chars, truncated with "...".

---

## 8. Session State Management

**State structure**:
```typescript
interface SessionState {
  session_id: string
  kv_version_at_start: string
  started_at: string
  updated_at: string
  prompt_count: number
  loaded_packages: string[]    // sorted, unique
  categories_shown: boolean
  claude_session_id?: string
  transcript_path?: string
  session_source?: string
}
```

**Atomic writes**:
```typescript
// Write to temp file, then rename (atomic on POSIX)
const tempPath = `${statePath}.tmp.${Date.now()}`
fs.writeFileSync(tempPath, JSON.stringify(state, null, 2))
fs.renameSync(tempPath, statePath)
```

**Session ID scoping**: `KV_SESSION_ID` environment variable scopes state files. Allows concurrent sessions.

---

## 9. Prompt Transformation

**Injection assembly**:
```typescript
function buildTransformedPrompt(
  additionalContext: string,
  userPrompt: string
): string {
  const separator = '━'.repeat(60)
  return `${additionalContext}\n${separator}\n${userPrompt}`
}
```

**Context components** (in order):
1. Smart agent knowledge content
2. Auto-loaded knowledge content
3. Role reminder (if interval prompt)

Each knowledge block formatted as:
```markdown
## Knowledge: {packageName} ({category})
{content with frontmatter stripped}
```

---

## 10. 3-Way Merge Detection (Workspace Sync)

**Hashes**: SHA-256 of file content for local, workspace, and cached versions.

```typescript
function detect3WayChange(file: {
  localHash: string | null
  workspaceHash: string | null
  cacheHash: string | null
}): ChangeType {
  const { localHash: L, workspaceHash: W, cacheHash: C } = file

  if (L === W && W === C) return 'no-change'
  if (!L && !W) return 'deleted-both'
  if (!C && W && !L) return 'new-workspace'
  if (!C && L && !W) return 'new-local'
  if (L === C && W !== C) return 'workspace-change'
  if (W === C && L !== C) return 'local-change'
  if (L !== C && W !== C && L !== W) return 'conflict'
  return 'unknown'
}
```

**Vault-aware rules**: Locally-modified vault files (`local-change` or `conflict`) are never overwritten during sync.

---

## 11. Event Logging

**Format**: JSONL (one JSON object per line)

```typescript
interface EventEntry {
  timestamp: string        // ISO 8601
  session_id: string
  event_type: string       // "hook:onStart", "api:load", "flow:distribution", "error"
  action: string           // specific action name
  status: string           // "success", "partial", "error", "warning", "skipped"
  message: string          // human-readable description
  [key: string]: unknown   // additional metadata
}
```

**Specialized loggers**:
```typescript
logHookEvent(hook, action, status, message, data)
logApiEvent(api, action, status, message, data)
logError(source, action, error, data)
logFlowSuccess(feature, flow, message, data)
logFlowError(feature, flow, message, data)
logStepSuccess(feature, flow, step, message, data)
```

---

## 12. Child Flow Execution

**Pattern**: Features invoke each other via subprocess spawning.

```typescript
function executeFlow(scriptPath: string, options?: {
  timeout?: number      // default 30000ms
  parseJSON?: boolean
  silent?: boolean
  env?: Record<string, string>
}): Promise<{
  success: boolean
  output?: string
  data?: unknown
  error?: string
  stderr?: string
  exitCode?: number
  timedOut?: boolean
}>
```

**Buffer limit**: 10MB stdout/stderr.
**Timeout signal**: SIGTERM on timeout.

---

## 13. Path Resolution

**Root detection**: `CLAUDE_PROJECT_DIR` env var, or walk up from script until `.claude/` directory found.

**Key paths** (all absolute):
```typescript
const KV_PATHS = {
  PROJECT_DIR:     '/path/to/project',
  CLAUDE_DIR:      '/path/to/project/.claude',
  KV_DIR:          '/path/to/project/.claude/kv',
  KV_CONFIG:       '/path/to/project/.claude/kv.json',
  VAULT_DIR:       '/path/to/project/.claude/kv/vault',
  VAULT_LOCAL_DIR: '/path/to/project/.claude/kv/vault-local',
  KNOWLEDGE_INDEX: '/path/to/project/.claude/kv/knowledge.json',
  SESSIONS_DIR:    '/path/to/project/.claude/kv/sessions',
  ARCHIVE_DIR:     '/path/to/project/.claude/kv/sessions/archive',
  CACHE_DIR:       '/path/to/project/.claude/kv/.cache',
  // ... scripts, hooks, settings paths
}
```

---

## 14. Content Loading (Unified)

**Single loader** used by all injection paths:

```typescript
function loadKnowledgeContent(
  packages: PackageInput[],
  options: {
    vaultDir?: string
    skipStateCheck?: boolean
    skipStateWrite?: boolean
  }
): LoadContentResult {
  // 1. Check loaded_packages (skip duplicates)
  // 2. Read .md file content
  // 3. Strip YAML frontmatter
  // 4. Format: ## Knowledge: {name} ({category})\n{content}
  // 5. Update session loaded_packages
  return { content, loaded, skipped, guides }
}
```

**Frontmatter stripping**: Removes everything between `---` markers at file start.
