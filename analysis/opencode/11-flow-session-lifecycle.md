# Flow: Session Lifecycle

> From opening OpenCode to completing a coding task.

---

## Flow Diagram

```
┌─────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐
│  Start   │────►│  Select   │────►│  Prompt  │────►│ Streaming│
│ OpenCode │     │  Agent/   │     │  Input   │     │ Response │
│          │     │  Model    │     │          │     │          │
└─────────┘     └───────────┘     └────┬─────┘     └────┬─────┘
                                       │                 │
                                       │◄────────────────┘
                                       │    (multi-turn loop)
                                       ▼
                              ┌─────────────────┐
                              │  End / Archive   │
                              └─────────────────┘
```

---

## Step 1: Start OpenCode

### TUI Mode (Default)
```bash
opencode              # Start in current directory
opencode /path/to/dir # Start in specific directory
```

**What happens**:
1. Yargs parses CLI args
2. `Installation.VERSION` detected, first-run migration if needed
3. Server starts on random port (or 4096 if `serve` mode)
4. `Instance.provide()` sets up project context:
   - Detect `.git` directory → set worktree
   - Calculate project ID from git root commit
   - Load configuration (7-layer precedence)
   - Initialize database (SQLite + WAL)
   - Start LSP clients for detected languages
   - Start MCP servers from config
   - Start file watcher (chokidar)
5. TUI renders via OpenTUI (SolidJS → terminal at 60fps)
6. Home route shows: session list, MCP status, tips

### Web Mode
```bash
opencode web          # Start server + open browser
opencode serve        # Start headless API server
```

### Desktop Mode
- Tauri launches → starts embedded server → loads web UI in WebView
- Server gate waits for backend ready before showing UI

---

## Step 2: Select Agent & Model

**User sees** (TUI): Sidebar with agent/model selectors

**Available agents**:
- `build` (default) — Full access
- `plan` — Read-only exploration
- Switch with `Tab` key

**Model selection**:
- Provider + model dropdown
- 19+ providers, each with multiple models
- Cost shown per model (input/output per 1M tokens)
- Keyboard: dedicated keybinding to open model picker

**What happens**:
1. Agent determines permission ruleset
2. Model determines provider SDK to use
3. Both stored in local state for the session

---

## Step 3: Compose Prompt

**TUI**: Multi-line text editor with history and autocomplete
**Web/Desktop**: Rich textarea with file references

**Features**:
- Multi-line input (TUI uses custom Textarea component)
- Prompt history (up/down arrows)
- `@general` to invoke subagent
- `/skill-name` to invoke skills
- File references with drag-drop (desktop)
- Image paste support (desktop clipboard plugin)
- Thinking mode selection

**On submit**:
```
1. Create or continue session
2. Build MessageV2.User:
   {
     role: "user",
     content: "user text",
     system: optional system override,
     variant: optional model variant
   }
3. POST /session/{sessionID}/stream (or internal call in TUI)
```

---

## Step 4: LLM Stream Processing

**What happens server-side**:

```
1. Resolve agent permissions
2. Build system prompt:
   a. Agent prompt (if custom)
   b. Provider default instructions
   c. Plugin hooks (system.transform)
   d. Message-specific system
   e. Two-part caching structure

3. Resolve tools:
   a. Built-in tools (bash, read, write, edit, glob, grep, etc.)
   b. MCP tools (converted from MCP protocol)
   c. Plugin tools
   d. Filter by agent permissions and model capabilities

4. Call Vercel AI SDK streamText():
   model, system, messages, tools, toolChoice,
   temperature, topP, maxTokens, headers

5. Process stream chunks:
   "text-delta"      → Append to TextPart in DB
   "reasoning-delta" → Append to ReasoningPart in DB
   "tool-call"       → Execute tool with permission check
   "tool-result"     → Store ToolPart result in DB

6. After each part update:
   Bus.publish(Session.Event.Updated)
   → SSE → All connected clients
```

**Client receives** (via SSE):
```
Session.Event.Updated → Update store → Re-render UI
```

---

## Step 5: Tool Execution (During Streaming)

**When LLM calls a tool**:

```
1. Parse tool arguments (Zod validation)
2. Check permissions:
   a. Match against agent ruleset
   b. "allow" → proceed
   c. "deny" → DeniedError → LLM gets error message
   d. "ask" → suspend, emit Permission.Event.Asked

3. If "ask":
   a. Client shows permission dialog
   b. User replies: once / always / reject
   c. Reply propagated via Permission.Event.Replied
   d. "always" → store in PermissionTable for future

4. Execute tool:
   a. Update ToolPart: status → "running"
   b. Run tool logic (file op, bash, search, etc.)
   c. Collect output + metadata
   d. Truncate if needed (10k lines / 200KB)
   e. Update ToolPart: status → "completed"

5. Return result to LLM stream
6. LLM may call more tools or generate text
```

**Doom loop detection**:
```
If 3 identical consecutive tool calls (same tool + same args):
  → Trigger "doom_loop" permission prompt
  → User can allow or abort
```

---

## Step 6: Multi-Turn Conversation

**User sends another message** → same flow as Step 3-5

**Context management**:
- All previous messages + parts included in LLM context
- When context grows large → automatic compaction:
  1. Hidden "compaction" agent summarizes older messages
  2. CompactionPart inserted as marker
  3. Older messages excluded from LLM context
  4. Full history preserved in database

---

## Step 7: Session Actions

### Fork Session
```
1. User selects "fork" at specific message
2. Session.fork(parentID, upToMessageID)
3. New session created with parent_id reference
4. Messages copied up to selected point
5. Independent conversation from that point
```

### Revert
```
1. User selects "revert" to earlier state
2. Snapshot/diff applied to restore file state
3. Session.revert tracked in session metadata
4. Can continue from reverted state
```

### Share
```
1. User clicks "share"
2. Session data uploaded to share service
3. Public URL generated
4. Anyone with URL can view transcript
```

### Archive
```
1. Session marked as archived (time_archived set)
2. Hidden from default session list
3. Still accessible via search/filter
```

---

## Step 8: Session End

**TUI**: `Ctrl+C` or quit command
**Web/Desktop**: Close tab or navigate away

**Cleanup**:
1. Abort any running LLM streams
2. Kill running tool processes
3. Dispose instance resources
4. LSP connections cleaned up
5. File watcher stopped
6. Database connections closed
