# Flow: Session Lifecycle

> From Claude Code startup to a fully initialized KV session with knowledge and role context.

---

## Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Claude Code   │────►│  Validate    │────►│  Create      │────►│  Build       │
│ SessionStart  │     │  Structure   │     │  Session     │     │  Index       │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│  Output       │◄────│  Inject      │◄────│  Preload     │◄───────────┘
│  Context      │     │  Role        │     │  Knowledge   │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## Step 1: Hook Fires

**Event**: Claude Code emits `SessionStart`.

**stdin JSON**:
```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/me/.claude/projects/.../session.jsonl",
  "source": "new_conversation"
}
```

`kv-onStart.ts` reads stdin, guards on KV_DIR existence, and delegates to `runSessionStart()`.

---

## Step 2: Validate Structure

**What happens**:
1. Check all required directories exist: `kv/`, `vault/`, `sessions/archive/`, feature directories
2. Check all required files exist: `kv.json`, `knowledge.json`
3. If anything missing → auto-repair by running `distribution-install.mjs`

**Auto-repair**: Full installation flow runs silently. Creates directories, copies files, registers hooks.

---

## Step 3: Archive Previous Sessions

**What happens**:
1. Find all `*-state.json` files in `sessions/`
2. Move each to `sessions/archive/`
3. Move corresponding `*-events.jsonl` to `sessions/archive/`
4. Keep max 99 archived sessions (oldest deleted)

---

## Step 4: Create New Session

**What happens**:
1. Generate session ID:
   - Use `session_id` from hook input if available
   - Fallback: `session-YYYY-MM-DD-{timestamp}`
2. Read KV version from `system/metadata.json`
3. Build initial state:
   ```json
   {
     "session_id": "abc123",
     "kv_version_at_start": "1.2.0",
     "started_at": "2026-02-17T10:00:00Z",
     "updated_at": "2026-02-17T10:00:00Z",
     "prompt_count": 0,
     "loaded_packages": [],
     "categories_shown": false,
     "claude_session_id": "abc123",
     "transcript_path": "/path/to/session.jsonl",
     "session_source": "new_conversation"
   }
   ```
4. Write `sessions/abc123-state.json`
5. Log `session:start` event to `sessions/abc123-events.jsonl`

---

## Step 5: Check Workspace Sync (Read-Only)

**What happens**:
1. Read `kv.json` for git config (origin, branch)
2. If git origin configured:
   - Validate workspace repository state
   - Check for pending changes (but don't apply)
   - Report sync status in session report
3. This is **check-only** mode — no files are modified

**Full sync** only runs on explicit `/kv-sync` command.

---

## Step 6: Build Knowledge Index

**What happens**:
1. **Fast path check**: Compare vault directory mtime against `knowledge.json` mtime
   - If unchanged → skip rebuild (~10ms)
   - If changed → full rebuild (~120ms)
2. **Full rebuild**:
   - Scan `vault/` and `vault-local/` for `.md` files
   - Parse YAML frontmatter from each file
   - Derive categories from directory structure
   - Validate metadata, apply filters
   - Build `knowledge.json` with packages and tag index
3. Report: `"generated (N packages)"`

---

## Step 7: Preload Knowledge

**What happens**:
1. Read `vault.preload` from `kv.json`:
   ```json
   { "vault": { "preload": ["coding-standards", "project-overview"] } }
   ```
2. If no preload config → skip
3. Filter against session `loaded_packages` (none loaded yet on fresh session)
4. Load content via unified `loadKnowledgeContent()`:
   - Read `.md` files
   - Strip YAML frontmatter
   - Format as `## Knowledge: {name} ({category})\n{content}`
5. Update session `loaded_packages`
6. Store formatted content for output

---

## Step 8: Inject Role

**What happens**:
1. Read role config from `kv.json`:
   ```json
   { "role": { "customRole": null, "defaultRole": "staff_engineer" } }
   ```
2. Determine active role: `customRole` > `defaultRole` > `'staff_engineer'`
3. Load template from `templates/staff_engineer.txt`
4. Since prompt_count = 0: format as `<role>...full template...</role>`

---

## Step 9: Aggregate & Output Context

**What happens**: Combine all components into a single output:

```
┌─────────────────────────────────────────┐
│ Session Status Report                    │
│ ┌─────────────────────────────────────┐ │
│ │ ✓ Sync: up to date                  │ │
│ │ ✓ Index: 42 packages                │ │
│ │ ✓ Preload: 2 packages loaded        │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ Knowledge Mandate (category tree)        │
│   frontend/                              │
│     react-patterns, css-conventions      │
│   backend/                               │
│     api-design, database-patterns        │
│                                          │
│ Preloaded Knowledge                      │
│   ## Knowledge: coding-standards (...)   │
│   {content}                              │
│   ## Knowledge: project-overview (...)   │
│   {content}                              │
│                                          │
│ <role>                                   │
│   {full staff_engineer template}         │
│ </role>                                  │
└─────────────────────────────────────────┘
```

This entire block is written to stdout and becomes part of Claude's system context for the session.

---

## Session End

Sessions don't have an explicit "end" event. The previous session is archived when the **next** session starts (Step 3). This means the last session's state and events persist until the next Claude Code startup.

**Archive retention**: 99 most recent sessions kept. Oldest deleted beyond that.
