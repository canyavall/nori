# Flow: Workspace Synchronization

> How KV keeps local vault and configuration in sync with a shared workspace repository.

---

## Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Session Start │────►│  Read git    │────►│  Pull/validate│────►│  Build file  │
│ or /kv-sync   │     │  config      │     │  workspace    │     │  manifest    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│ Update state  │◄────│  Apply       │◄────│  Analyze     │◄───────────┘
│ & rebuild     │     │  changes     │     │  changes     │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## Step 1: Read Git Configuration

**From `kv.json`**:
```json
{
  "git": {
    "origin": "https://github.com/team/claude-workspace.git",
    "branch": "main"
  }
}
```

**Supports two source types**:
- **Remote git**: `https://` or `git@` URL → clone/pull
- **Local path**: `/path/to/workspace` → direct file read (no git)

---

## Step 2: Sync Repository

**Remote git**:
1. If `.cache/workspace/` doesn't exist → `git clone`
2. If exists → `git pull` on configured branch
3. Validate checkout matches expected branch

**Local path**:
1. Validate directory exists and is accessible
2. No git operations needed

---

## Step 3: Build File Manifest

**Scan both locations**:
- **Workspace**: All files in `.cache/workspace/` (the cloned repo)
- **Local**: All files in `.claude/kv/` and `.claude/` (KV-managed files)

**For each file**: Compute SHA-256 hash of contents.

```typescript
interface FileEntry {
  workspacePath: string    // path in workspace repo
  localPath: string        // path in local project
  workspaceHash: string    // SHA-256 of workspace version
  localHash: string        // SHA-256 of local version
}
```

---

## Step 4: Load Previous Sync State

**From `.cache/sync-state.json`** and **`.cache/vault-pull-state.json`**:

```json
{
  "timestamp": "2026-02-17T09:00:00Z",
  "files": {
    "vault/frontend/react-patterns.md": {
      "hash": "abc123...",
      "category": "vault"
    },
    "hooks/kv-onStart.mjs": {
      "hash": "def456...",
      "category": "non-vault"
    }
  }
}
```

The cache hash represents the state at last successful sync. This enables 3-way comparison.

---

## Step 5: Analyze Changes (3-Way Merge)

**For each file, compare three versions**:
- **L** (Local): Current file on disk
- **W** (Workspace): File in the repository
- **C** (Cache): File at last sync

**Decision matrix**:

| L == C | W == C | L == W | Result |
|--------|--------|--------|--------|
| yes | yes | yes | `no-change` |
| yes | no | — | `workspace-change` (safe to pull) |
| no | yes | — | `local-change` (keep local) |
| no | no | no | `conflict` |
| — | — | — | `new-workspace` / `new-local` / `deleted-*` |

**Categorized changes**: Files are split into `vault` and `non-vault` categories with different handling rules.

---

## Step 6: Apply Changes (Full-Sync Mode Only)

**Non-vault files** (hooks, scripts, config templates):
- `workspace-change` → overwrite local with workspace version
- `local-change` → keep local (won't push)
- `conflict` → workspace wins (non-vault is system-managed)
- `new-workspace` → copy to local
- `deleted-workspace` → delete local copy

**Vault files** (knowledge packages):
- `workspace-change` → overwrite local with workspace version
- `local-change` → **KEEP LOCAL** (never overwrite user edits)
- `conflict` → **KEEP LOCAL** (user edits take priority)
- `new-workspace` → copy to local
- `deleted-workspace` → keep local (don't delete user's vault files)

```
Vault rule: Locally-modified vault files are NEVER overwritten.
This protects developer customizations to knowledge packages.
```

---

## Step 7: Save Sync State

**Write updated state files**:

1. `sync-state.json` → new hashes for all synced files
2. `vault-pull-state.json` → separate state for vault-only tracking
3. `system/metadata.json` → update `workspace_sha` and `distributed_at`

---

## Step 8: Rebuild Knowledge Index

After sync completes, trigger a knowledge index rebuild to pick up any new or changed vault packages.

---

## Two Operating Modes

### Check-Only Mode (Session Start)

**When**: Automatically on every `SessionStart` hook.

**Behavior**:
- Steps 1-5 execute (read, pull, analyze)
- Step 6 **skipped** (no files modified)
- Reports status only: "3 workspace changes pending"
- Developer can choose to run `/kv-sync` for full sync

**Purpose**: Non-disruptive awareness. Developer knows updates are available.

### Full-Sync Mode (Manual /kv-sync)

**When**: Developer explicitly runs `/kv-sync`.

**Behavior**:
- All steps execute including Step 6 (apply changes)
- Files are actually modified on disk
- Knowledge index rebuilt
- Session status updated

**Purpose**: Deliberate sync when developer is ready for updates.

---

## Example: Team Member Updates a Knowledge Package

**Scenario**: Team lead updates `vault/backend/api-design.md` in the workspace repo.

**Developer starts new session**:
1. SessionStart → check-only sync
2. Git pull → new commit detected
3. File manifest: `api-design.md` has different workspace hash
4. 3-way: W changed, L unchanged, C matches L → `workspace-change`
5. Report: "1 vault file updated in workspace"

**Developer runs `/kv-sync`**:
1. Full sync mode
2. `api-design.md` → workspace-change → overwrite local with new version
3. Save new sync state with updated hash
4. Rebuild knowledge index
5. Next auto-load of `api-design.md` will use the updated content

---

## Example: Developer Customizes a Package Locally

**Scenario**: Developer modifies `vault/frontend/react-patterns.md` locally to add project-specific notes.

**Developer starts new session**:
1. SessionStart → check-only sync
2. File manifest: local hash differs from cache hash
3. 3-way: L changed, W unchanged → `local-change`
4. No action needed (local modifications preserved)

**Team lead also updates same file in workspace**:
1. Next session → check-only sync
2. 3-way: L changed AND W changed → `conflict`
3. Report: "1 vault conflict (local changes preserved)"
4. Even on `/kv-sync`: local version kept, workspace version not applied
5. Developer must manually merge if they want workspace changes

---

## Sync State Diagram

```
Time 0: Install
  L=W=C (all identical)

Time 1: Workspace changes api-design.md
  L=C, W≠C → workspace-change
  /kv-sync → L=W=C (all match again)

Time 2: Developer changes react-patterns.md locally
  L≠C, W=C → local-change
  /kv-sync → no action (local preserved)

Time 3: Both change react-patterns.md
  L≠C, W≠C, L≠W → conflict
  /kv-sync → local kept, C not updated for this file
```
