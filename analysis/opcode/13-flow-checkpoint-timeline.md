# Flow: Checkpoint & Timeline Management

> The complete journey of creating, navigating, restoring, and forking session checkpoints.

---

## Flow Diagram

```
┌──────────────┐     ┌───────────────────────────────────────────┐
│  Session     │     │              Timeline Sidebar              │
│  Active      │────►│                                           │
│              │     │  ○ Checkpoint 1 (auto, 10:30)             │
│  [GitBranch  │     │  │                                        │
│   button]    │     │  ○ Checkpoint 2 (manual, 10:45) ◄─current│
│              │     │  │                                        │
│              │     │  ├─○ Fork A (10:50)                       │
│              │     │  │  └─○ Fork A.1                          │
│              │     │  │                                        │
│              │     │  └─○ Checkpoint 3 (auto, 11:00)           │
│              │     │                                           │
│              │     │  [Create Checkpoint] [Settings]           │
└──────────────┘     └───────────────────────────────────────────┘
```

---

## Step 1: Enable Timeline

**User action**: Clicks GitBranch icon in session header

**What happens**:
1. `showTimeline` state toggled to `true`
2. `TimelineNavigator` component mounts as sidebar panel
3. `api.listCheckpoints(sessionId, projectId, projectPath)` called
4. Returns array of checkpoints with timeline tree structure

**User sees**: Sidebar with:
- Vertical timeline with checkpoint markers
- Each marker: timestamp, description, token count, model
- Current checkpoint highlighted
- Branch lines for forks
- "Create Checkpoint" button at bottom
- Settings gear icon

---

## Step 2: Configure Auto-Checkpoints

**User action**: Clicks settings gear in timeline sidebar

**User sees**: Dialog with:
- Toggle: "Auto-checkpoint enabled" (on/off)
- Dropdown: Strategy selector
  - **Manual** → Only when you click "Create Checkpoint"
  - **Per Prompt** → After every user message
  - **Per Tool Use** → After any tool is used (read, write, edit, bash)
  - **Smart** → After destructive tools only (write, edit, multiedit, bash with file ops)
- Display: "Total checkpoints: N"

**Backend call**: `api.updateCheckpointSettings(sessionId, projectId, projectPath, { enabled, strategy })`

**What happens with auto-checkpoint**:
After each streamed message, the frontend calls:
```
api.checkAutoCheckpoint(sessionId, projectId, projectPath, message)
```
Backend evaluates:
1. Is auto-checkpoint enabled? If no → return
2. Check strategy:
   - **PerPrompt**: Is this a user message? → Create checkpoint
   - **PerToolUse**: Does content contain `tool_use`? → Create checkpoint
   - **Smart**: Is tool destructive (write/edit/bash with file keywords)? → Create checkpoint
3. If trigger matched → Create checkpoint automatically
4. Return checkpoint info to frontend
5. Timeline updates with new checkpoint marker

---

## Step 3: Create Manual Checkpoint

**User action**: Clicks "Create Checkpoint" button

**User sees**: Small dialog with:
- Text input: "Checkpoint name (optional)"
- "Create" and "Cancel" buttons

**What happens**:
```
1. api.createCheckpoint(sessionId, projectId, projectPath, undefined, name)
   │
   ▼
2. Backend CheckpointManager:
   a. Collect all tracked files (from tool use detection)
   b. For each file:
      - Read content
      - Calculate SHA-256 hash
      - If hash not in content_pool → compress with zstd, store
      - Write reference JSON to refs/{checkpointId}/
   c. Compress current session messages (JSONL) with zstd
   d. Write metadata.json with:
      - Checkpoint ID (UUID)
      - Message index (current position)
      - Token totals
      - Model used
      - User's last prompt
      - File change count
      - Snapshot size
   e. Add node to timeline tree
   f. Update timeline.json on disk
   │
   ▼
3. Frontend:
   - Refresh checkpoint list
   - New marker appears on timeline
   - Toast: "Checkpoint created"
```

---

## Step 4: Restore Checkpoint

**User action**: Clicks a checkpoint marker on the timeline

**User sees**: Confirmation: "Restore to checkpoint '{name}'? Current unsaved changes will be lost."

**What happens**:
```
1. api.restoreCheckpoint(checkpointId, sessionId, projectId, projectPath)
   │
   ▼
2. Backend:
   a. Read checkpoint metadata
   b. For each file reference in refs/{checkpointId}/:
      - Read hash from reference JSON
      - Read content_pool/{hash}
      - Decompress with zstd
      - Write content to original file path
      - Restore Unix permissions (chmod)
   c. Decompress messages.jsonl.zstd
   d. Update timeline: set current_checkpoint_id = checkpointId
   e. Return restored messages
   │
   ▼
3. Frontend:
   - Replace messages[] with restored messages
   - Update current checkpoint marker (highlight)
   - Session continues from this point
   - New messages after restoration go to a new branch
   - Toast: "Restored to checkpoint"
```

**Important**: Restoration overwrites actual files on disk. The user's working directory is physically changed.

---

## Step 5: Fork from Checkpoint

**User action**: Right-clicks a checkpoint → "Fork" (or clicks fork button)

**User sees**: Dialog with:
- Text input: "New session name"
- "Fork" and "Cancel" buttons

**What happens**:
```
1. Generate new session ID (UUID)
2. api.forkFromCheckpoint(
     checkpointId, sessionId, projectId,
     projectPath, newSessionId, description
   )
   │
   ▼
3. Backend:
   a. Restore files to checkpoint state (same as Step 4)
   b. Create new branch node in timeline tree:
      - Parent: the forked checkpoint
      - New checkpoint as child with new session ID
   c. Copy checkpoint data for new session
   d. Update timeline.json
   │
   ▼
4. Frontend:
   - New tab opens with forked session
   - Timeline shows branch point
   - User can now work independently on the fork
   - Original session remains unchanged
```

---

## Step 6: View Checkpoint Diff

**User action**: Hovers over checkpoint → clicks "Diff" icon

**What happens**:
```
1. api.getCheckpointDiff(checkpointId, previousCheckpointId, sessionId, projectId, projectPath)
   │
   ▼
2. Backend compares two checkpoints:
   - List all file references in both
   - For each file: compare hashes
   - Modified: hash differs
   - Added: exists in new, not in old
   - Deleted: exists in old, not in new
   - Token delta: new.total_tokens - old.total_tokens
   │
   ▼
3. Return: { modified_files[], added_files[], deleted_files[], token_delta }
```

**User sees**: Diff view showing:
- Files changed (with status: modified/added/deleted)
- Token count change
- Optional: content diff for individual files

**Note**: In current implementation, full content diff returns `None` (TODO in code). Only file-level changes are reported.

---

## Step 7: Cleanup Old Checkpoints

**Happens automatically or via settings**:

```
1. api.cleanupOldCheckpoints(sessionId, projectId, projectPath, maxCheckpoints)
   │
   ▼
2. Backend:
   a. List all checkpoints sorted by timestamp
   b. If count > maxCheckpoints:
      - Delete oldest checkpoints (keep newest)
      - Remove checkpoint directories
      - Run garbage collection on content_pool
   c. Update timeline tree (remove deleted nodes)
   d. Save updated timeline.json
```

---

## File Tracking Deep Dive

### How Files Get Tracked

When Claude uses tools during a session, the checkpoint system detects which files are being modified:

```
Tool Detection:
├── "edit" / "multiedit" → file_path extracted from tool input
├── "write" → file_path extracted from tool input
├── "bash" → Heuristic analysis of command string:
│   ├── Contains "echo" + ">" → look for target file
│   ├── Contains "cp", "mv" → look for destination
│   ├── Contains "rm", "touch" → look for target
│   ├── Contains "sed", "awk" → look for target file
│   └── Contains "npm", "yarn", "cargo" → mark package files
└── "read" → Track as read (for snapshot, not modification)
```

### File State Machine

```
Unknown → Discovered (first tool use) → Modified (hash changed) → Snapshotted (in checkpoint)
                                              ↑                          │
                                              └──────────────────────────┘
                                                (modified again after snapshot)
```

Each file tracked stores:
- `path` → Full filesystem path
- `last_hash` → SHA-256 of last known content
- `is_modified` → Changed since last checkpoint
- `last_modified` → Timestamp of last change
- `exists` → Whether file currently exists on disk
