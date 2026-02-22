# Flow: Diagnostics & Audit

> Understanding what the safety net is doing, debugging blocks, and reviewing history.

---

## Flow Diagram

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Doctor  │     │  Explain     │     │  Audit Logs  │
│  Command │     │  Command     │     │  (automatic) │
└────┬─────┘     └─────┬────────┘     └──────┬───────┘
     │                  │                      │
     ▼                  ▼                      ▼
 Health check      Step-by-step         Historical
 & self-test       analysis trace       block records
```

---

## Journey 1: Doctor Command

**User action**: `npx cc-safety-net doctor`

### What the Doctor Checks

**1. Hook Integration Status**
```
✅ Claude Code hook: registered
✅ OpenCode plugin: configured
❌ Gemini CLI: not configured
❌ Copilot CLI: no hook file found
```

Reads `~/.claude/settings.json`, `opencode.json`, etc. to verify hooks are set up.

**2. Self-Test (Sample Commands)**
```
Testing dangerous commands:
  ✅ git reset --hard          → BLOCKED (expected)
  ✅ git checkout -- file.txt  → BLOCKED (expected)
  ✅ rm -rf /                  → BLOCKED (expected)
  ✅ rm -rf ~                  → BLOCKED (expected)
  ✅ git checkout -b newbranch → ALLOWED (expected)
  ✅ rm -rf /tmp/build         → ALLOWED (expected)
```

Runs known-dangerous and known-safe commands through the analysis engine.

**3. Configuration Validation**
```
User config: ~/.cc-safety-net/config.json
  → 3 custom rules loaded
  → No validation errors

Project config: .safety-net.json
  → 2 custom rules loaded
  → No validation errors

Effective rules: 5 total (2 overrides from project scope)
```

**4. Environment Variables**
```
SAFETY_NET_STRICT:                not set (fail-open)
SAFETY_NET_PARANOID_RM:           not set
SAFETY_NET_PARANOID_INTERPRETERS: not set
TMPDIR:                           /tmp (default, safe)
```

**5. Recent Activity (Last 7 Days)**
```
Blocked commands in last 7 days:
  2025-01-15 14:30  git reset --hard     (session: abc123)
  2025-01-14 09:15  rm -rf ~/Documents   (session: def456)
  Total: 2 blocks
```

Reads from audit log files in `~/.cc-safety-net/logs/`.

**6. System Info**
```
cc-safety-net: v1.2.3
Runtime: Bun 1.1.x
Node: v22.x
OS: darwin arm64
```

**7. Update Check**
```
✅ Up to date (v1.2.3)
# or
⚠️ Update available: v1.2.3 → v1.3.0 (npm update -g cc-safety-net)
```

### JSON Output
```bash
npx cc-safety-net doctor --json
```
Outputs all diagnostic information as structured JSON for CI/CD integration.

---

## Journey 2: Explain Command

**User action**: `npx cc-safety-net explain "bash -c 'git checkout -- file.txt'"`

### Step-by-Step Trace Output

```
Command: bash -c 'git checkout -- file.txt'
CWD: /Users/me/project

Step 1: Split into segments
  → 1 segment: ["bash", "-c", "git checkout -- file.txt"]

Step 2: Strip environment variables
  → No env vars found

Step 3: Strip wrappers
  → No wrappers found (bash is a shell, not a wrapper)

Step 4: Shell wrapper detection
  → MATCH: "bash" is a shell wrapper
  → Extracting -c argument: "git checkout -- file.txt"
  → Recursing (depth=1)

  Step 4.1: Split inner command
    → 1 segment: ["git", "checkout", "--", "file.txt"]

  Step 4.2: Strip environment variables
    → None

  Step 4.3: Strip wrappers
    → None

  Step 4.4: Shell wrapper detection
    → Not a shell wrapper

  Step 4.5: Interpreter detection
    → Not an interpreter

  Step 4.6: Command-specific rules
    → Command: "git"
    → Subcommand: "checkout"
    → Analyzing git checkout...
    → Found "--" (double dash) at position 2
    → Has path specs after "--": ["file.txt"]
    → BLOCK: "git checkout -- discards uncommitted changes to specified files"

Result: ❌ BLOCKED
  Reason: git checkout -- discards uncommitted changes to specified files
  Segment: git checkout -- file.txt
  Depth: 1 (inside bash -c wrapper)
```

### JSON Output
```bash
npx cc-safety-net explain "git reset --hard" --json
```
Returns trace as structured JSON with each step documented.

### Custom CWD
```bash
npx cc-safety-net explain "rm -rf ./build" --cwd /Users/me/other-project
```
Analyzes with a different working directory context (affects rm path classification).

---

## Journey 3: Audit Log Review

### Automatic Logging

Every blocked command is automatically written to:
```
~/.cc-safety-net/logs/<session_id>.jsonl
```

### Log Entry Format
```json
{
  "ts": "2025-01-15T14:30:00.123Z",
  "command": "git reset --hard HEAD~3 (truncated to 300 chars)",
  "segment": "git reset --hard HEAD~3",
  "reason": "git reset --hard destroys all uncommitted changes permanently",
  "cwd": "/Users/me/project"
}
```

### Secret Redaction

Before writing to logs, sensitive data is automatically redacted:

```
Original: "TOKEN=ghp_abc123xyz git push https://user:pass123@github.com"
Redacted: "TOKEN=[REDACTED] git push https://[REDACTED]@github.com"
```

**Patterns redacted**:
- `TOKEN=*`, `SECRET=*`, `PASSWORD=*`, `API_KEY=*` → value redacted
- `https://user:pass@host` → `https://[REDACTED]@host`
- `ghp_*` (GitHub tokens) → `ghp_[REDACTED]`
- `Authorization: *` → `Authorization: [REDACTED]`
- `Bearer *` → `Bearer [REDACTED]`

### Manual Review

```bash
# View recent blocks for a session
cat ~/.cc-safety-net/logs/abc123.jsonl | jq .

# Count blocks per day
cat ~/.cc-safety-net/logs/*.jsonl | jq -r .ts | cut -d'T' -f1 | sort | uniq -c

# Search for specific commands
cat ~/.cc-safety-net/logs/*.jsonl | jq 'select(.command | contains("rm"))'
```

### Session ID Sanitization

Log filenames use sanitized session IDs to prevent path traversal:
- `/`, `\`, `..` characters are replaced
- Only alphanumeric characters and hyphens preserved

---

## Journey 4: Config Verification

**User action**: `npx cc-safety-net --verify-config` (or `-vc`)

### What It Checks

1. **User config** (`~/.cc-safety-net/config.json`):
   - JSON syntax valid?
   - `version` field present and equals 1?
   - `rules` is an array?
   - Each rule has: `name`, `command`, `reason`?
   - Each rule's `block_args` is an array of strings?
   - No duplicate rule names?

2. **Project config** (`.safety-net.json`):
   - Same checks as user config
   - Reports which rules override user rules (by name)

3. **Merge preview**:
   - Shows effective rules after merging both scopes
   - Highlights overrides

### Example Output
```
User config: ~/.cc-safety-net/config.json
  ✅ Valid JSON
  ✅ Schema valid
  → 3 rules: block-docker-prune, block-npm-force, custom-git-rule

Project config: .safety-net.json
  ✅ Valid JSON
  ✅ Schema valid
  → 2 rules: custom-git-rule, block-git-add-all
  ⚠️ "custom-git-rule" overrides user-scope rule with same name

Effective rules: 4 total
  1. block-docker-prune (user)
  2. block-npm-force (user)
  3. custom-git-rule (project, overrides user)
  4. block-git-add-all (project)
```
