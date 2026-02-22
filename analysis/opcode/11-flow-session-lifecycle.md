# Flow: Claude Code Session Lifecycle

> The complete journey of starting, interacting with, and ending a Claude Code session.

---

## Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  Open App   │────►│ Select/Create│────►│  Prompt Input  │────►│  Streaming   │
│  (Tab View) │     │   Project    │     │  (Compose)     │     │  Response    │
└─────────────┘     └──────────────┘     └───────┬────────┘     └──────┬───────┘
                                                  │                     │
                                                  │◄────────────────────┘
                                                  │     (loop: more prompts)
                                                  │
                                         ┌────────▼────────┐
                                         │  End / Close Tab │
                                         └─────────────────┘
```

---

## Step 1: App Launch → Tab View

**User sees**: Welcome screen (first launch) or Tab view (returning user)

**What happens**:
1. `App.tsx` mounts, checks `startup_intro_enabled` setting
2. If enabled: shows `StartupIntro` overlay for 2 seconds
3. `ThemeProvider` loads theme from `app_settings` table + localStorage mirror
4. `TabProvider` restores tabs from localStorage (`opcode_tabs`)
5. `TabContent` renders the active tab
6. If no tabs exist, user sees empty state with "New Chat" option

**Keyboard shortcuts active**:
- `Cmd+T` → Create new chat tab
- `Cmd+W` → Close current tab
- `Cmd+Tab` / `Cmd+Shift+Tab` → Next/Previous tab
- `Cmd+1-9` → Jump to tab by index

---

## Step 2: Create New Session

**User action**: Clicks "+" button or presses Cmd+T

**What happens**:
1. `TabContext.addTab()` creates a new tab with type `'chat'`
2. Tab gets unique ID, title "New Chat", status `'idle'`
3. `ClaudeCodeSession` component mounts inside tab
4. Component sets up event listeners:
   - `claude-output` (generic)
   - `claude-error` (generic)
   - `claude-complete` (generic)
   - `claude-not-found` (for binary not found dialog)
5. No backend calls yet — waiting for first prompt

**User sees**: Empty chat area with `FloatingPromptInput` at bottom

---

## Step 3: Select Project Directory

**User action**: Clicks project selector or file picker

**What happens**:
1. `api.getHomeDirectory()` called to get base path
2. `FilePicker` component opens as modal overlay
3. User navigates directory tree (each directory click calls `api.listDirectoryContents(path)`)
4. User selects a directory → sets `projectPath` state
5. Modal closes, prompt input becomes enabled

**Alternative**: If resuming a session, project path comes from stored session data.

---

## Step 4: Compose & Send Prompt

**User sees**: Textarea with model selector and thinking mode selector

**User actions available**:
- Type prompt text (textarea auto-expands)
- Select model: Sonnet (fast) or Opus (capable)
- Select thinking mode: Auto / Think / Think Hard / Think Harder / Ultrathink
- Attach images (drag-drop or file picker)
- Type `/` to open slash command picker
- Press `Ctrl+Enter` or `Cmd+Enter` to send

**What happens on send**:
1. Validate: prompt not empty, project path set
2. If `isLoading` (already executing): add prompt to `queuedPrompts[]` array instead
3. Set `isLoading = true`
4. Build prompt string:
   - Prepend thinking mode keyword if not "auto"
   - Append image references as `@"/path/to/image.png"`
5. Call backend:
   - **First message**: `api.executeClaudeCode(projectPath, prompt, model)`
   - **Continuation**: `api.continueClaudeCode(projectPath, prompt, model)`
   - **Resume**: `api.resumeClaudeCode(projectPath, sessionId, prompt, model)`
6. Clear textarea, reset thinking mode

**IME handling** (for CJK input):
- Track composition state with `isIMEComposingRef`
- Prevent send during composition
- `onCompositionStart` → set flag
- `onCompositionEnd` → clear flag after `setTimeout(0)`

---

## Step 5: Streaming Response

**User sees**: Messages appearing incrementally with loading indicator

**What happens (event flow)**:

```
Backend spawns: claude -p "prompt" --model sonnet --output-format stream-json --verbose
     │
     ▼
stdout produces JSONL lines
     │
     ▼
Backend reads line-by-line, emits Tauri event:
  emit("claude-output:{sessionId}", json_line)
  emit("claude-output", json_line)
     │
     ▼
Frontend event listener receives:
  handleStreamMessage(payload)
     │
     ▼
Parse JSONL message:
  - type: "system" → Extract session_id from init message
  - type: "assistant" → Add to messages[], render in MessageList
  - type: "tool_use" → Show tool widget (file read, write, bash, etc.)
  - type: "tool_result" → Update tool widget with result
  - type: "result" → Extract final usage metrics
     │
     ▼
UI updates:
  - MessageList re-renders with new messages (virtualized)
  - TokenCounter updates cumulative count
  - Auto-scroll to bottom (unless user scrolled up)
```

**Session ID detection**:
- First `system` message with `subtype: "init"` contains `session_id`
- Once detected: set up session-specific listeners (`claude-output:{id}`)
- Update tab title with first user prompt text

**Completion event**:
- `claude-complete:{sessionId}` received
- Set `isLoading = false`
- Check `queuedPrompts[]` — if non-empty, auto-send next prompt
- Update tab status to `'idle'`

**Error event**:
- `claude-error:{sessionId}` received
- Display error message in red banner
- Set `isLoading = false`
- Clear queued prompts (don't auto-retry)

---

## Step 6: Message Display & Interaction

**User sees**: Rich message bubbles with:
- Text content (markdown rendered)
- Code blocks (syntax highlighted)
- Tool use widgets (expandable/collapsible)
- Token counts per message

**Virtual scrolling**:
```
Container: Full height of chat area
Estimated item size: 150px
Overscan: 5 items above/below viewport
Measurement: Dynamic (getBoundingClientRect after render)
```

**Message filtering** (what NOT to show):
- System/meta messages without meaningful content
- User messages that are only tool results (shown in tool widgets)
- Duplicate tool results
- Empty content arrays

**Tool widgets display for**:
- `Read` → File path + content preview
- `Write` → File path + content diff
- `Edit` → File path + old/new content
- `Bash` → Command + output
- `Glob` → Pattern + matched files
- `Grep` → Pattern + matched lines

---

## Step 7: Multi-Turn Conversation

**User action**: Types another prompt while previous response is still visible

**Flow**:
1. If Claude is still executing → prompt added to queue (displayed as collapsible card)
2. If Claude is done → same flow as Step 4-5 but with `continueClaudeCode` instead of `executeClaudeCode`
3. Session ID persists across turns
4. All messages accumulate in `messages[]` state

**Prompt queue behavior**:
- Queue shown as card above input: "N prompts queued"
- Each item shows prompt text and model icon
- User can remove items from queue
- After completion, next queued prompt auto-submits
- If error occurs, queue is cleared

---

## Step 8: Session History & Resume

**User action**: Opens a session from the session list

**What happens**:
1. `api.loadSessionHistory(sessionId, projectId)` called
2. Returns array of JSONL message objects
3. Messages loaded into `messages[]` state
4. Session ID set, tab updated with session info
5. Event listeners registered for this session ID
6. FloatingPromptInput ready for new prompts (uses `resumeClaudeCode`)

---

## Step 9: Cancel Execution

**User action**: Clicks Stop/Cancel button during streaming

**What happens**:
1. `api.cancelClaudeExecution(sessionId)` called
2. Backend sends SIGTERM to Claude process
3. Waits 5 seconds, then SIGKILL if still alive
4. `claude-cancelled:{sessionId}` event emitted
5. Frontend: set `isLoading = false`, clear queue
6. Tab status → `'idle'`

---

## Step 10: Close Session / Tab

**User action**: Clicks X on tab or presses Cmd+W

**What happens**:
1. Check `hasUnsavedChanges` on tab
2. If running: prompt "Session is active. Close anyway?"
3. Call `api.clearCheckpointManager(sessionId)` to free backend resources
4. Unregister all event listeners
5. Clear timeout refs
6. `TabContext.removeTab(tabId)`
7. Next tab becomes active (or empty state if last tab)
8. Tab persistence saves to localStorage (debounced 500ms)
