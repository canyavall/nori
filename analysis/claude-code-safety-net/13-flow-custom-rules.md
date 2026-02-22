# Flow: Custom Rules & Configuration

> Setting up project-specific and user-specific safety rules.

---

## Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Define      │────►│  Validate    │────►│  Merge       │────►│  Match at    │
│  Rules       │     │  Config      │     │  Scopes      │     │  Runtime     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Journey 1: Create Project Rules

### Step 1: Create Config File

**User action**: Create `.safety-net.json` in project root:

```json
{
  "version": 1,
  "rules": [
    {
      "name": "block-git-add-all",
      "command": "git",
      "subcommand": "add",
      "block_args": ["-A", "--all", "."],
      "reason": "Use 'git add <specific-files>' instead of staging everything."
    },
    {
      "name": "block-npm-audit-fix-force",
      "command": "npm",
      "subcommand": "audit",
      "block_args": ["--force"],
      "reason": "npm audit fix --force can introduce breaking changes."
    }
  ]
}
```

### Step 2: Validate

**User action**: Run `/verify-custom-rules` in Claude Code or:
```bash
npx cc-safety-net --verify-config
```

**What happens**:
1. Reads `.safety-net.json` and `~/.cc-safety-net/config.json`
2. Validates JSON syntax
3. Validates schema (version, rules array, rule fields)
4. Reports: duplicate rule names, invalid fields, missing required fields
5. Shows summary of loaded rules

### Step 3: Rules Active

Next time safety net runs, custom rules are loaded and applied after built-in rules.

---

## Journey 2: Create User-Level Rules

### Step 1: Create Config File

**User action**: Create `~/.cc-safety-net/config.json`:

```json
{
  "version": 1,
  "rules": [
    {
      "name": "block-docker-system-prune",
      "command": "docker",
      "subcommand": "system",
      "block_args": ["prune"],
      "reason": "docker system prune removes all unused data. Be specific."
    }
  ]
}
```

### Step 2: Applies to All Projects

User-level rules apply everywhere. No project override needed.

---

## Journey 3: Rule Scope Merging

**Configuration**:
- User scope: `~/.cc-safety-net/config.json` → rules [A, B, C]
- Project scope: `.safety-net.json` → rules [B', D]

**Merge result**:
```
Effective rules: [A, B'(project overrides user), C, D]
```

Rules with the **same name** (case-insensitive) → project version wins.
Rules with different names → both included.

---

## Journey 4: Custom Rule Matching

### How Matching Works

```typescript
for each rule in config.rules:
  1. Normalize command to basename
     "git" matches "/usr/bin/git"

  2. Match rule.command (case-insensitive)
     rule.command = "git" → matches "git", "Git", "/usr/bin/git"

  3. If rule.subcommand specified:
     Match second token after command
     rule.subcommand = "add" → matches "git add ..."

  4. If rule.block_args specified:
     Check if ANY blocked arg is present in remaining tokens
     rule.block_args = ["-A", "--all", "."]
     → matches "git add -A", "git add --all", "git add ."

  5. Short option expansion:
     "-Af" is expanded to {"-A", "-f"}
     If "-A" is in block_args → matches

  6. If all conditions match → BLOCK with rule.reason
```

### Example: Rule In Action

```
Rule: { name: "block-git-add-all", command: "git", subcommand: "add", block_args: ["-A"] }

"git add -A"           → BLOCK: "[block-git-add-all] Use 'git add <specific-files>'..."
"git add --all"        → ALLOW (--all not in block_args, only -A is)
"git add file.txt"     → ALLOW (no blocked arg present)
"git commit -m 'msg'"  → ALLOW (subcommand is "commit", not "add")
```

**Note**: To block both `-A` and `--all`, include both in `block_args`:
```json
"block_args": ["-A", "--all", "."]
```

---

## Journey 5: Interactive Rule Creation

### Using Slash Command
```
/set-custom-rules
```

**What happens**:
1. Interactive prompts guide through rule creation
2. Asks for: rule name, command, subcommand, blocked args, reason
3. Writes to `.safety-net.json` in project root
4. Validates the created config

---

## Journey 6: Enable Paranoid Mode

### Paranoid RM
```bash
export SAFETY_NET_PARANOID_RM=1
```

**Effect**: `rm -rf` within the current directory is now blocked (normally allowed).
**Exception**: Temp directories (`/tmp`, `/var/tmp`, `$TMPDIR`) are still allowed.

**Use case**: Working on a critical codebase where even `rm -rf ./build` should require manual confirmation.

### Paranoid Interpreters
```bash
export SAFETY_NET_PARANOID_INTERPRETERS=1
```

**Effect**: ALL interpreter one-liners are blocked:
- `python -c "..."` → BLOCK
- `node -e "..."` → BLOCK
- `ruby -e "..."` → BLOCK
- `perl -e "..."` → BLOCK

**Use case**: Preventing any opaque code execution that can't be analyzed for safety.

### Full Paranoid (Both)
```bash
export SAFETY_NET_PARANOID=1
```
Enables both paranoid RM and paranoid interpreters.

---

## Journey 7: Enable Strict Mode

```bash
export SAFETY_NET_STRICT=1
```

**Effect**: Any command that can't be parsed (unclosed quotes, malformed syntax) is BLOCKED instead of allowed.

**Default behavior** (without strict): Unparseable commands are allowed (fail-open). This is the safe default because most parsing failures are harmless.

**Use case**: CI/CD environments where you want maximum certainty that nothing slips through.

---

## Journey 8: Environment Variable Reference

| Variable | Effect |
|----------|--------|
| `SAFETY_NET_STRICT=1` | Fail-closed on unparseable commands |
| `SAFETY_NET_PARANOID=1` | Enable all paranoid modes |
| `SAFETY_NET_PARANOID_RM=1` | Block rm -rf within cwd |
| `SAFETY_NET_PARANOID_INTERPRETERS=1` | Block all interpreter one-liners |
| `TMPDIR=<path>` | If overridden to non-temp, disables TMPDIR allowance |
