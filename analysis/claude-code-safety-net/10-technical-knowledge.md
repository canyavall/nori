# claude-code-safety-net - Technical Knowledge Base

> Everything needed to understand or rebuild the safety net's core capabilities.

---

## 1. Shell Command Parsing

**Library**: `shell-quote` v1.8.3 (proxied to preserve `$VAR` references).

**Parsing approach**:
```typescript
import { parse } from 'shell-quote'

// shell-quote returns: string[] | { op: string }[] (operators)
// Operators: &&, ||, |, &, ;, (, )
// Strings: tokens after expansion

// Custom proxy preserves $VAR as literal strings instead of expanding
function splitShellCommands(command: string): string[][] {
  const tokens = parse(command)
  // Split on operators → array of segments
  // Each segment = string[] of command tokens
  // Handle $(...) via extractCommandSubstitution()
  // Handle backticks via extractBacktickSubstitutions()
}
```

**Unclosed quotes detection**:
```typescript
function hasUnclosedQuotes(command: string): boolean {
  // Track single/double quote state
  // Handle escaped quotes
  // Return true if any quote remains open
}
```

**Strict mode**: When `SAFETY_NET_STRICT=1` and quotes are unclosed → BLOCK (fail-closed).

---

## 2. Command Segmentation

Commands are split on shell operators into independent segments:

```
"cd /tmp && git reset --hard || rm -rf ."
         ^^                  ^^
    Split on: &&, ||, |, |&, &, ;, \n

    Segment 1: ["cd", "/tmp"]
    Segment 2: ["git", "reset", "--hard"]
    Segment 3: ["rm", "-rf", "."]
```

**Each segment analyzed independently**. First block reason found causes denial.

**CWD tracking across segments**: After `cd`/`pushd`/`popd`, `effectiveCwd` becomes `null` (unknown), making subsequent path analysis more conservative.

---

## 3. Environment Variable Stripping

```typescript
function stripEnvAssignmentsWithInfo(tokens: string[]): {
  tokens: string[],           // Command without env prefixes
  envAssignments: Map<string, string>  // Extracted vars
}

// "FOO=bar BAR=baz git reset --hard"
// → tokens: ["git", "reset", "--hard"]
// → envAssignments: { "FOO": "bar", "BAR": "baz" }
```

**TMPDIR detection**: If `TMPDIR=<non-temp-path>` is found, the safe TMPDIR allowance for rm is disabled.

---

## 4. Wrapper Stripping

```typescript
function stripWrappers(tokens: string[]): string[] {
  // Removes: sudo, env, command, builtin
  // "sudo env command git reset --hard"
  // → ["git", "reset", "--hard"]
}
```

---

## 5. Shell Wrapper Unwrapping

Detects shell invocations with `-c` flag and recursively analyzes the inner command:

**Shell wrappers recognized**: `bash`, `sh`, `zsh`, `ksh`, `dash`, `fish`, `csh`, `tcsh`

```typescript
function extractDashCArg(tokens: string[]): string | null {
  // Find -c or -lc flag
  // Return the string argument after it
  // Handles: bash -c "cmd", bash -c 'cmd', bash -lc 'cmd'
}

// "bash -c 'git reset --hard'"
// → Extract "git reset --hard"
// → Recurse analyzeCommandInternal("git reset --hard", depth+1)
```

**Recursion depth limit**: 10 levels (prevents infinite loops).

---

## 6. Interpreter Detection

**Interpreters recognized**: `python`, `python2`, `python3`, `node`, `ruby`, `perl`

**Code extraction flags**: `-c` (python/ruby/perl), `-e` (node/ruby/perl)

**Normal mode**: Scan code for dangerous patterns using regex:
```typescript
const DANGEROUS_PATTERNS = [
  /\brm\s+.*-[rR].*-f\b/,
  /\bgit\s+reset\s+--hard\b/,
  /\bgit\s+checkout\s+--\b/,
  /\bgit\s+clean\s+-f\b/,
  // ... more patterns
]
```

**Paranoid mode** (`SAFETY_NET_PARANOID_INTERPRETERS=1`): Block ALL interpreter one-liners regardless of content.

---

## 7. Git Subcommand Analysis

**Entry**: `analyzeGit(tokens: string[])`

**Global option handling**: Skips known git global flags (`-C`, `--git-dir`, `--work-tree`, etc.) to find the actual subcommand.

### checkout
```
BLOCK if:
  - Has "--" (double dash) → discards changes to specified paths
  - Has ref before "--" → checks out ref, discards working tree
  - Has "--pathspec-from-file" → bulk file checkout
  - Has 2+ positional args (ambiguous checkout)

ALLOW if:
  - Has "-b" or "--orphan" → creates new branch
  - Single positional arg → switch branch (safe)
```

### restore
```
BLOCK if:
  - No "--staged" flag → restores working tree (discards changes)
  - Has "--worktree" → explicitly targeting working tree

ALLOW if:
  - Has "--staged" only → just unstages (safe)
```

### reset
```
BLOCK if: --hard or --merge
ALLOW if: --soft, --mixed (default), or no mode flag
```

### clean
```
BLOCK if: -f (force) without -n/--dry-run
ALLOW if: -n/--dry-run (preview only)
```

### push
```
BLOCK if: --force or -f (without --force-with-lease)
ALLOW if: --force-with-lease (safe alternative)
```

### branch
```
BLOCK if: -D (force delete without merge check)
ALLOW if: -d (safe delete, checks if merged)
```

### stash
```
BLOCK if: "drop" or "clear" subcommand
ALLOW: push, pop, apply, list, show
```

### worktree
```
BLOCK if: "remove" with "--force"
ALLOW: add, list, prune
```

---

## 8. rm Path Classification

**Entry**: `analyzeRm(tokens: string[], options: { cwd, effectiveCwd })`

**Prerequisites**: Must have both `-r`/`-R`/`--recursive` AND `-f`/`--force` flags (combined detection handles bundled flags like `-rf`).

### Path classification logic:

```
For each target path:
  1. root_or_home_target    → BLOCK always
     /, ~, $HOME, $HOME/*, ../../.. (resolves to root)

  2. cwd_self_target        → BLOCK (rm -rf . is almost always wrong)
     ., ./, ./. (same as cwd)

  3. temp_target            → ALLOW always
     /tmp/*, /var/tmp/*, $TMPDIR/* (if TMPDIR not overridden)
     System temp dir from os.tmpdir()

  4. within_anchored_cwd    → ALLOW (unless paranoid mode)
     Relative paths that resolve within original cwd
     Absolute paths that are subdirectories of cwd

  5. outside_anchored_cwd   → BLOCK
     Any path that resolves outside cwd and isn't temp
```

**Paranoid RM mode** (`SAFETY_NET_PARANOID_RM=1`): Blocks `within_anchored_cwd` too (except temp).

**Home directory special case**: If cwd IS the home directory, blocks rm -rf within it (too dangerous).

---

## 9. find/xargs/parallel Analysis

### find
```
BLOCK if:
  - Has -delete action (outside -exec blocks)
  - Has -exec with rm -rf
```

### xargs
```
BLOCK if:
  - Child command is rm -rf (dynamic input to destructive cmd)
  - Child command is shell wrapper (bash -c with stdin)
  - Has -I/--replace with rm -rf template

Otherwise: recurse into child command analysis
```

### parallel (GNU parallel)
```
Parse: parallel <template> ::: <args>
Detect placeholders: {}, {1}, {.}
Expand templates with actual args
Recurse into each expanded command

BLOCK if:
  - Shell with placeholder + stdin (unpredictable commands)
  - Expanded commands match any block rules
```

---

## 10. Custom Rules System

**Config format** (`.safety-net.json` or `~/.cc-safety-net/config.json`):

```json
{
  "version": 1,
  "rules": [
    {
      "name": "block-git-add-all",
      "command": "git",
      "subcommand": "add",
      "block_args": ["-A", "--all", "."],
      "reason": "Use 'git add <specific-files>' for clarity."
    }
  ]
}
```

**Matching algorithm**:
1. Normalize command to basename (strip path)
2. Match `command` field (case-insensitive)
3. If `subcommand` specified, match second token
4. If `block_args` specified, check if ANY blocked arg is present
5. Short option expansion: `-rf` matches if `-r` or `-f` is blocked

**Scope merging**: Project rules override user rules with the same name (case-insensitive).

---

## 11. Audit Logging

**Log location**: `~/.cc-safety-net/logs/<session_id>.jsonl`

**Entry format**:
```json
{
  "ts": "2025-01-15T10:30:00.123Z",
  "command": "git reset --hard (truncated to 300 chars)",
  "segment": "git reset --hard",
  "reason": "git reset --hard destroys all uncommitted changes",
  "cwd": "/Users/me/project"
}
```

**Session ID sanitization**: Prevents path traversal by replacing `/`, `\`, `..` characters.

---

## 12. Secret Redaction

Applied to audit logs and explain output:

```typescript
function redactSecrets(text: string): string {
  // Patterns:
  // TOKEN=*, SECRET=*, PASSWORD=*, API_KEY=* → redacted
  // https://user:pass@host → https://[REDACTED]@host
  // ghp_* (GitHub tokens) → ghp_[REDACTED]
  // Authorization: * → Authorization: [REDACTED]
  // Bearer * → Bearer [REDACTED]

  // Command truncation: max 300 chars
}
```

---

## 13. Hook Protocol (Claude Code)

**Input** (stdin JSON):
```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "git reset --hard"
  },
  "cwd": "/Users/me/project",
  "session_id": "abc123"
}
```

**Output** (stdout JSON on deny):
```json
{
  "hookSpecificOutput": {
    "permissionDecision": "deny",
    "permissionDecisionReason": "🛡️ Safety Net: git reset --hard destroys all uncommitted changes permanently. Use 'git stash' first."
  }
}
```

**On allow**: No output (silent pass).

---

## 14. Short Option Expansion

```typescript
function extractShortOpts(token: string): Set<string> {
  // "-rf" → Set { "-r", "-f" }
  // "-nf" → Set { "-n", "-f" }
  // "--force" → Set { "--force" }

  // Used for:
  // 1. Detecting rm -rf from bundled flags
  // 2. Matching custom rule block_args
  // 3. Git flag analysis
}
```

---

## 15. Status Line Integration

**Emoji modes**:
- `🛡️ Safety Net ✅` — Default (normal operation)
- `🛡️ Safety Net 🗑️` — Paranoid RM enabled
- `🛡️ Safety Net 🐚` — Paranoid interpreters enabled
- `🛡️ Safety Net 👁️` — Both paranoid modes (full paranoid)
- `🛡️ Safety Net 🔒` — Strict mode enabled

**Piping support**: Can chain with other statusline commands, appending safety net status to existing output.

---

## 16. Dangerous Text Scanning (Fallback)

For unparseable code or text, regex-based scanning catches embedded commands:

```typescript
const DANGEROUS_PATTERNS = [
  /\brm\s+.*-[rR].*-f\b/,           // rm -rf variants
  /\bgit\s+reset\s+--hard\b/,       // git reset --hard
  /\bgit\s+checkout\s+--\b/,        // git checkout --
  /\bgit\s+clean\s+-.*f\b/,         // git clean -f
  /\bgit\s+push\s+.*--force\b/,     // git push --force
  /\bgit\s+stash\s+(drop|clear)\b/, // git stash drop/clear
]
```

Used when:
- Interpreter code contains embedded shell commands
- Text within `$()` or backticks can't be parsed normally
