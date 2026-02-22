# Flow: Command Analysis Pipeline

> How a bash command is analyzed from input to allow/deny decision.

---

## Flow Diagram

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Input   │───►│  Split   │───►│  Strip   │───►│  Detect  │───►│  Apply   │
│  Command │    │  Segments│    │  Wrappers│    │  Type    │    │  Rules   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                                      │
                                                              ┌───────▼───────┐
                                                              │ ALLOW or DENY │
                                                              └───────────────┘
```

---

## Step 1: Entry Point

**Input**: Command string + working directory + options

```typescript
analyzeCommand("sudo bash -c 'cd /tmp && git reset --hard'", {
  cwd: "/Users/me/project",
  sessionId: "abc123"
})
```

**What happens**:
1. Load configuration (user scope + project scope)
2. Call `analyzeCommandInternal(command, depth=0, options)`

---

## Step 2: Command Splitting

**Function**: `splitShellCommands(command)`

```
Input:  "cd /tmp && git reset --hard || rm -rf ."
                 ^^                   ^^
Split operators: &&, ||, |, |&, &, ;, \n

Output: [
  ["cd", "/tmp"],
  ["git", "reset", "--hard"],
  ["rm", "-rf", "."]
]
```

**Also handles**:
- `$(...)` command substitutions → extracted and analyzed separately
- Backtick substitutions → extracted and analyzed separately
- Parenthesized groups `(cmd1; cmd2)` → extracted

---

## Step 3: Strict Mode Check

If `SAFETY_NET_STRICT=1` and the command has unclosed quotes:
```
Input: "git reset --hard 'unclosed
→ BLOCK: "Command could not be safely analyzed (strict mode)"
```

Default behavior (non-strict): unparseable commands are ALLOWED (fail-open).

---

## Step 4: Per-Segment Analysis Loop

For each segment, call `analyzeSegment(tokens, depth, options)`.

Track state across segments:
- `effectiveCwd`: Current working directory (set to `null` after `cd`)
- Prior block: If any segment is blocked, skip remaining segments

---

## Step 5: Environment Variable Stripping

```
Input:  ["TMPDIR=/evil", "FOO=bar", "rm", "-rf", "."]
Output: tokens = ["rm", "-rf", "."]
        envAssignments = { "TMPDIR": "/evil", "FOO": "bar" }
```

**TMPDIR detection**: If TMPDIR is overridden to a non-temp path, the safe TMPDIR allowance for rm is disabled.

---

## Step 6: Wrapper Stripping

```
Input:  ["sudo", "env", "command", "git", "reset", "--hard"]
Output: ["git", "reset", "--hard"]
Removed: sudo, env, command
```

Wrappers recognized: `sudo`, `env`, `command`, `builtin`

---

## Step 7: Shell Wrapper Detection

**Check**: Is the first token a shell (`bash`, `sh`, `zsh`, `ksh`, `dash`, `fish`, `csh`, `tcsh`)?

```
Input:  ["bash", "-c", "git reset --hard"]
Action: Extract "-c" argument → "git reset --hard"
        Recurse: analyzeCommandInternal("git reset --hard", depth+1)
```

**Handles**:
- `bash -c "cmd"` → extract and recurse
- `bash -lc "cmd"` → login shell variant
- `bash script.sh` → not analyzed (external file, unknown content)

**Recursion depth limit**: 10 levels maximum.

---

## Step 8: Interpreter Detection

**Check**: Is the first token an interpreter (`python`, `python3`, `node`, `ruby`, `perl`)?

```
Input:  ["python", "-c", "import os; os.system('rm -rf /')"]
```

### Paranoid Mode (`SAFETY_NET_PARANOID_INTERPRETERS=1`)
→ BLOCK all interpreter one-liners regardless of content.

### Normal Mode
1. Extract `-c` or `-e` code argument
2. Scan code for dangerous patterns:
   ```
   /\brm\s+.*-[rR].*-f\b/
   /\bgit\s+reset\s+--hard\b/
   /\bgit\s+checkout\s+--\b/
   ```
3. If pattern found → BLOCK
4. Also recurse: try to parse code as shell command and analyze

---

## Step 9: Busybox Unwrap

```
Input:  ["busybox", "rm", "-rf", "/"]
Action: Skip "busybox", re-analyze ["rm", "-rf", "/"]
```

---

## Step 10: Command-Specific Rules

Based on the head token (after all stripping), dispatch to specific analyzer:

### `git` → `analyzeGit(tokens)`
See detailed git rules in [Technical Knowledge Base](./10-technical-knowledge.md#7-git-subcommand-analysis).

```
"git reset --hard"           → BLOCK
"git checkout -- file.txt"   → BLOCK
"git checkout -b newbranch"  → ALLOW
"git restore --staged file"  → ALLOW
```

### `rm` → `analyzeRm(tokens, options)`
See detailed rm rules in [Technical Knowledge Base](./10-technical-knowledge.md#8-rm-path-classification).

```
"rm -rf /"                   → BLOCK (root)
"rm -rf ~"                   → BLOCK (home)
"rm -rf /tmp/build"          → ALLOW (temp directory)
"rm -rf ./node_modules"      → ALLOW (within cwd)
"rm -rf ../other-project"    → BLOCK (outside cwd)
```

### `find` → `analyzeFind(tokens)`
```
"find . -name '*.tmp' -delete"     → BLOCK (-delete action)
"find . -exec rm -rf {} \;"        → BLOCK (rm -rf in -exec)
"find . -name '*.tmp' -print"      → ALLOW
```

### `xargs` → `analyzeXargs(tokens, context)`
```
"xargs rm -rf"                     → BLOCK (dynamic input to rm -rf)
"xargs bash -c 'cmd'"             → BLOCK (shell with stdin)
"xargs -I {} rm -rf {}"           → BLOCK (template with rm -rf)
"xargs grep pattern"              → ALLOW (safe command)
```

### `parallel` → `analyzeParallel(tokens, context)`
```
"parallel rm -rf {} ::: /a /b"    → BLOCK (rm -rf with expansion)
"parallel bash -c '{}'             → BLOCK (shell with placeholder)
"parallel echo {} ::: a b c"      → ALLOW (safe command)
```

### Custom Rules → `checkCustomRules(tokens, config.rules)`
```
Configured: { command: "git", subcommand: "add", block_args: ["-A"] }
"git add -A"                      → BLOCK (custom rule)
"git add file.txt"                → ALLOW
```

---

## Step 11: CWD Change Detection

**Check**: Does this segment change the working directory?

```
Pattern: cd, pushd, popd (with optional sudo/command prefix)

"cd /some/path"    → effectiveCwd = null (unknown from here on)
"pushd /tmp"       → effectiveCwd = null
```

After CWD change, rm path classification becomes more conservative (can't determine if paths are "within cwd").

---

## Step 12: Return Result

```
If any segment blocked:
  return { reason: "...", segment: "..." }
  → Hook outputs deny JSON
  → Audit log written

If all segments allowed:
  return null
  → Hook outputs nothing (silent allow)
```

---

## Complete Example: Complex Command

```
Input: "sudo TMPDIR=/evil bash -c 'cd /opt && git clean -f && find . -delete'"
```

**Analysis trace**:
```
1. splitShellCommands → 1 outer segment
2. stripEnvAssignments → TMPDIR=/evil detected (non-temp!)
3. stripWrappers → remove "sudo"
4. Shell wrapper: "bash -c" detected
5. Extract inner: "cd /opt && git clean -f && find . -delete"
6. Recurse (depth=1):
   a. splitShellCommands → 3 segments
   b. Segment 1: "cd /opt" → CWD change, effectiveCwd = null
   c. Segment 2: "git clean -f"
      → analyzeGit: clean subcommand with -f flag
      → BLOCK: "git clean -f permanently deletes untracked files"
   d. (Segment 3 skipped, already blocked)
7. Return: BLOCK with reason from git clean
```
