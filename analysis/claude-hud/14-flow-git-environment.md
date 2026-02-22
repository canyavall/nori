# Flow: Git & Environment Display

> How git status and configuration counts are displayed.

---

## Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Git CLI     │     │  Settings    │     │  Render in   │
│  Commands    │     │  File Scan   │     │  Project Line│
└──────┬───────┘     └──────┬───────┘     └──────────────┘
       │                     │
       └─────────────────────┘
```

---

## Journey 1: Git Branch & Status

### Step 1: Get Branch Name

**Command**: `git rev-parse --abbrev-ref HEAD`
**Timeout**: 1000ms
**Method**: `execFile` (no shell injection risk)

**Result**: `"main"` (or `"HEAD"` for detached HEAD)

### Step 2: Check Dirty Status

**Command**: `git --no-optional-locks status --porcelain`
**Timeout**: 1000ms

**Result**: If any output → repository is dirty.

### Step 3: Render Branch

```
git:(main)     ← clean repository
git:(main*)    ← dirty (uncommitted changes)
```

**Colors**:
- `git:(` and `)` → magenta
- Branch name → cyan
- `*` → cyan

---

## Journey 2: Ahead/Behind (Optional)

**Config**: `gitStatus.showAheadBehind: true`

### Step 1: Get Counts

**Command**: `git rev-list --left-right --count @{upstream}...HEAD`

**Result**: `"3\t1"` → 3 commits behind upstream, 1 commit ahead

### Step 2: Render

```
git:(main* ↑1 ↓3)
```

- `↑1` = 1 commit ahead of upstream
- `↓3` = 3 commits behind upstream

**Failure handling**: If no upstream tracking branch, silently omitted.

---

## Journey 3: File Stats (Optional)

**Config**: `gitStatus.showFileStats: true`

### Step 1: Parse Porcelain Output

Each line from `git status --porcelain`:
```
 M src/auth.ts        ← Modified (worktree)
M  src/config.ts      ← Modified (staged)
A  src/new-file.ts    ← Added (staged)
D  src/old-file.ts    ← Deleted
?? src/untracked.ts   ← Untracked
```

### Step 2: Count by Category

```typescript
// Starship-compatible format:
modified:  M, R, C (both index and worktree)
added:     A
deleted:   D
untracked: ??
```

### Step 3: Render

```
git:(main* !3 +1 ✘2 ?1)
```

- `!3` = 3 modified files
- `+1` = 1 added file
- `✘2` = 2 deleted files
- `?1` = 1 untracked file

Zero counts are omitted.

---

## Journey 4: Project Path

### Step 1: Extract Path

From stdin's `cwd`: `/Users/me/Documents/projects/my-app`

### Step 2: Apply Path Levels

**Config**: `pathLevels: 1` (default)
```
my-app
```

**Config**: `pathLevels: 2`
```
projects/my-app
```

**Config**: `pathLevels: 3`
```
Documents/projects/my-app
```

### Step 3: Render

```
[Opus | Max] │ my-app git:(main*)
```

Path displayed in yellow.

---

## Journey 5: Configuration Counts (Optional)

**Config**: `showConfigCounts: true`

### Step 1: Count Files

**User scope** (`~/.claude/`):
```
CLAUDE.md files:  Check ~/.claude/CLAUDE.md existence
Rules:            Count .md files in ~/.claude/rules/ recursively
MCPs:             Extract mcpServers keys from ~/.claude/settings.json
                  Subtract disabledMcpServers
Hooks:            Check for hooks in ~/.claude/settings.json
```

**Project scope** (`{cwd}/`):
```
CLAUDE.md files:  Check {cwd}/CLAUDE.md, {cwd}/CLAUDE.local.md,
                  {cwd}/.claude/CLAUDE.md, {cwd}/.claude/CLAUDE.local.md
Rules:            Count .md files in {cwd}/.claude/rules/
MCPs:             Extract from {cwd}/.mcp.json, {cwd}/.claude/settings.json
                  Subtract disabled MCPs
Hooks:            Check for hooks in project settings
```

### Step 2: MCP Deduplication

```typescript
// Within each scope: deduplicate server names
// Across scopes: no deduplication (same MCP in both = counts as 2)

// Disabled MCPs subtracted:
// settings.json → disabledMcpServers (array of server names)
// settings.json → disabledMcpjsonServers (array from .mcp.json)
```

### Step 3: Render

```
2 CLAUDE.md | 4 rules | 3 MCPs | 1 hooks
```

All in dim. Only shown if total count >= `environmentThreshold` (default: 0, always show).

### Step 4: Display Location

**Expanded layout**: Separate line below context/usage bars.
**Compact layout**: Appended to the single line.

---

## Combined Project Line (Expanded)

```
[Opus | Max] │ my-project git:(main* ↑1 ↓3 !3 +1 ✘2 ?1)
```

Components in order:
1. Model bracket (cyan): `[Opus | Max]`
2. Separator: `│`
3. Project path (yellow): `my-project`
4. Git info (cyan/magenta): `git:(main* ↑1 ↓3 !3 +1 ✘2 ?1)`

---

## Combined Project Line (Compact)

```
[Opus] █████░░░░░ 45% | my-project git:(main*) | 2 CLAUDE.md | 3 MCPs
```

Everything on one line with `|` separators.

---

## Error Handling

| Failure | Behavior |
|---------|----------|
| Not in git repo | Git section hidden entirely |
| `git` not installed | Git section hidden |
| Git command timeout (>1s) | Git section hidden |
| Settings file missing | Count as 0 |
| Invalid JSON in settings | Count as 0 |
| No MCP servers | "0 MCPs" (or hidden if threshold not met) |
