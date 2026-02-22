# Flow: Installation & Distribution

> From first install to a fully configured KV system with hooks, vault, and index.

---

## Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ /kv-install   │────►│  Clone       │────►│  Copy files  │────►│  Register    │
│               │     │  workspace   │     │  to .claude/  │     │  hooks       │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│ KV Ready      │◄────│  Build       │◄────│  Write       │◄───────────┘
│               │     │  index       │     │  config      │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## Step 1: Clone Workspace to Cache

**What happens**:
- Clone the workspace git repository to `.claude/kv/.cache/workspace/`
- Or validate local path if using a local workspace source

```bash
git clone https://github.com/team/claude-workspace.git .claude/kv/.cache/workspace/
```

---

## Step 2: Copy Distribution Files

**What happens**: Copy system files from workspace to the project's `.claude/` directory.

**Copied**:
- Hook scripts (`kv-onStart.mjs`, `kv-onPrompt.mjs`, `kv-onTool.mjs`)
- Feature scripts (compiled `.mjs` files)
- Vault contents (`vault/` directory with all knowledge packages)
- Role templates

**Not copied**: Workspace-only files (README, build configs, source TypeScript).

---

## Step 3: Copy Vault

**What happens**: Copy the entire vault directory structure:

```
workspace/vault/           →  .claude/kv/vault/
  frontend/                    frontend/
    react-patterns.md            react-patterns.md
    css-conventions.md           css-conventions.md
  backend/                     backend/
    api-design.md                api-design.md
```

---

## Step 4: Merge Settings (Register Hooks)

**What happens**: Update `.claude/settings.json` to register KV hooks.

**Before**:
```json
{
  "hooks": {}
}
```

**After**:
```json
{
  "hooks": {
    "SessionStart": [
      { "type": "command", "command": "node .claude/kv/hooks/kv-onStart.mjs" }
    ],
    "UserPromptSubmit": [
      { "type": "command", "command": "node .claude/kv/hooks/kv-onPrompt.mjs" }
    ],
    "PostToolUse": [
      { "type": "command", "command": "node .claude/kv/hooks/kv-onTool.mjs" }
    ]
  }
}
```

**Merge behavior**: Existing hooks are preserved; KV hooks are appended.

---

## Step 5: Update CLAUDE.md

**What happens**: Prepend KV documentation to the project's `.claude/CLAUDE.md`.

This gives Claude awareness of the KV system, available skills (`/kv-search`, `/kv-load`, etc.), and vault structure.

---

## Step 6: Update .gitignore

**What happens**: Add KV patterns to `.gitignore`.

```gitignore
# KV System
.claude/kv/sessions/
.claude/kv/.cache/
.claude/kv/vault-local/
.claude/kv/knowledge.json
```

**Tracked** (committed): vault/, hooks, kv.json, system files.
**Ignored**: sessions (ephemeral), cache (generated), vault-local (personal), index (generated).

---

## Step 7: Write Configuration

**What happens**: Create `.claude/kv.json` with auto-detected settings.

```json
{
  "git": {
    "origin": "https://github.com/team/claude-workspace.git",
    "branch": "main"
  },
  "vault": {
    "preload": [],
    "autoloadExceptions": []
  },
  "role": {
    "customRole": null,
    "defaultRole": "staff_engineer"
  }
}
```

**Origin auto-detection**: Read from the workspace repository's git remote.

---

## Step 8: Migrate Cache

**What happens**: If an old `.kv-cache` directory exists from a previous version, move it to the new `.claude/kv/.cache/` location.

**Backwards compatibility**: Prevents re-cloning the workspace on upgrades.

---

## Step 9: Ensure Directories

**What happens**: Create all required directories:

```
.claude/kv/
.claude/kv/vault/
.claude/kv/vault-local/
.claude/kv/sessions/
.claude/kv/sessions/archive/
.claude/kv/.cache/
.claude/kv/system/
```

---

## Step 10: Build Knowledge Index

**What happens**: Scan all vault packages and generate `knowledge.json`.

```
Scanning vault/...
  Found 42 packages across 8 categories
  Generated knowledge.json (42 packages, 156 tags)
```

See [Flow: Session Lifecycle](./11-flow-session-lifecycle.md) Step 6 for details.

---

## Step 11: Write Metadata

**What happens**: Write distribution metadata to `.claude/kv/system/metadata.json`.

```json
{
  "version": "1.2.0",
  "distributed_at": "2026-02-17T10:00:00Z",
  "workspace_sha": "a1b2c3d4e5f6...",
  "distribution_source": "install",
  "schema_version": "1"
}
```

---

## Post-Install: First Session

After installation, the next Claude Code session will:
1. `SessionStart` hook fires → full session initialization
2. Knowledge index already built (Step 10)
3. Preload packages (if configured)
4. Inject role template
5. Developer has full KV functionality

---

## Auto-Repair

If KV detects a broken structure on session start (missing directories, missing files), it runs the installation flow again automatically:

```
SessionStart → validateStructure() → FAIL
  → runInstallation() → re-execute install flow
  → Continue with session initialization
```

This handles cases where:
- Files were accidentally deleted
- Git operations corrupted the workspace
- Version upgrades changed the expected structure
