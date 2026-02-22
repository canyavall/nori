# Flow: Session Lifecycle

> The complete journey of starting, interacting with, and ending a session in OpenCode.

---

## Flow Diagram

```
+-------------+     +---------------+     +----------------+     +--------------+
|  Launch     |---->| Create/Switch |---->| Compose Prompt |---->|  Streaming   |
|  TUI        |     |   Session     |     |  (Editor)      |     |  Response    |
+-------------+     +---------------+     +-------+--------+     +------+-------+
                                                   |                     |
                                                   |<--------------------+
                                                   |   (loop: more prompts)
                                                   |
                                          +--------v---------+
                                          | Auto-Compact or  |
                                          | Cancel / Quit    |
                                          +------------------+
```

---

## Step 1: Application Launch

**User runs**: `opencode` (or `opencode -c /path/to/project`)

**What happens**:
1. `cmd/root.go` parses CLI flags via Cobra
2. `config.Load(workingDir, debug)` reads config from multiple locations
3. Database connection established (`.opencode/opencode.db`, auto-migrated via goose)
4. `app.New(ctx, conn)` creates the App struct, wiring all services:
   - Session, Message, History services (wrapping sqlc queries)
   - Permission service (in-memory)
   - CoderAgent (with tools, provider, title/summarize sub-agents)
   - LSP clients (initialized in background goroutine)
5. `tui.New(app)` creates the root Bubble Tea model
6. `tea.NewProgram(model).Run()` starts the TUI event loop

**User sees**: Chat page with empty message list and editor at the bottom

**Alternative (non-interactive)**: `opencode -p "prompt"` skips TUI entirely, creates a session, auto-approves permissions, runs agent, prints result to stdout, exits.

---

## Step 2: Create New Session

**User action**: Types in the editor and presses Ctrl+S (or Enter when editor not focused)

**What happens**:
1. `chat.SendMsg{Text: prompt}` message dispatched
2. Chat page creates a new session: `app.Sessions.Create(ctx, "New Session")`
3. Session stored in SQLite with UUID, empty title
4. `pubsub.CreatedEvent` published (TUI subscriptions update)
5. Agent.Run called with new session ID

**Alternative (switch session)**: User presses Ctrl+A to open session dialog:
1. `app.Sessions.List(ctx)` fetches all sessions
2. Session dialog renders list (sorted by `updated_at` DESC)
3. User selects with j/k + Enter
4. Chat page loads selected session's messages from DB
5. Editor ready for new prompts

---

## Step 3: Compose & Send Prompt

**User sees**: Text editor at bottom of chat page

**Editor capabilities**:
- Multi-line text input with cursor movement
- Ctrl+S sends the message
- Ctrl+E opens external editor (respects `$EDITOR`)
- Ctrl+F opens file picker for image attachments
- Esc blurs editor and focuses message list
- i re-focuses editor (vim-like)

**What happens on send**:
1. Validate prompt is not empty
2. If agent is busy for this session, show "Agent is busy" warning
3. Extract text and any image attachments
4. Call `app.CoderAgent.Run(ctx, sessionID, content, attachments...)`
5. Clear editor
6. Agent starts processing (see Step 4)

**Image attachments**:
- Ctrl+F opens file picker
- Selected images stored as `message.Attachment{FilePath, MimeType, Content}`
- Passed to agent as `BinaryContent` parts
- Only sent if model `SupportsAttachments`

---

## Step 4: Agent Processing (Streaming)

**User sees**: Messages appearing incrementally in the message list

**What happens (detailed flow)**:
```
1. Agent creates user message in DB
   -> pubsub.CreatedEvent -> TUI updates message list

2. If first message in session, async title generation:
   -> titleProvider.SendMessages([{user: content}])
   -> session.Save(title)
   -> pubsub.UpdatedEvent -> TUI updates session title

3. Agent calls provider.StreamResponse(ctx, messages, tools)
   -> Provider sends HTTP request to LLM API (streaming)

4. Agent creates empty assistant message in DB

5. For each ProviderEvent from stream:
   - EventContentDelta:
     -> assistantMsg.AppendContent(event.Content)
     -> messages.Update(ctx, assistantMsg)
     -> pubsub.UpdatedEvent -> TUI re-renders message

   - EventThinkingDelta:
     -> assistantMsg.AppendReasoningContent(event.Content)
     -> messages.Update -> TUI shows thinking content

   - EventToolUseStart:
     -> assistantMsg.AddToolCall(toolCall)
     -> messages.Update -> TUI shows pending tool call

   - EventToolUseStop:
     -> assistantMsg.FinishToolCall(toolCall.ID)
     -> messages.Update -> TUI shows completed tool call params

   - EventComplete:
     -> assistantMsg.SetToolCalls(response.ToolCalls)
     -> assistantMsg.AddFinish(finishReason)
     -> messages.Update
     -> Track token usage on session
```

---

## Step 5: Tool Execution

**When**: Agent receives `FinishReasonToolUse` from the LLM

**What happens**:
1. For each tool call in the response:
   a. Find matching `BaseTool` by name
   b. If not found: return "Tool not found" error
   c. Call `tool.Run(ctx, toolCall)`
   d. Tool may request permission (blocks until TUI dialog resolves)
   e. Collect `ToolResponse`
2. If any tool returns `ErrorPermissionDenied`:
   - Cancel all remaining tool calls
   - Set finish reason to `FinishReasonPermissionDenied`
3. Create tool result message in DB (role: "tool", parts: tool results)
4. Append assistant message + tool results to history
5. Loop back to Step 4 (send updated history to LLM)

**Permission dialog** (for write/edit/bash tools):
```
+-------------------------------------------+
|         Permission Required                |
|                                           |
|  Tool: bash                               |
|  Action: execute                          |
|  Command: git status                      |
|  Path: /Users/dev/project                 |
|                                           |
|  [a] Allow  [A] Allow for session  [d] Deny |
+-------------------------------------------+
```

---

## Step 6: Multi-Turn Conversation

**User action**: Types another prompt after receiving a response

**What happens**:
1. If agent is still processing: "Agent is busy" warning
2. If agent is done: same flow as Steps 3-5
3. Agent loads all messages from DB for the session (including tool messages)
4. If `SummaryMessageID` is set: messages before the summary are dropped
5. New user message appended to history
6. Provider called with full history

**Session state**:
- `PromptTokens` and `CompletionTokens` accumulate across turns
- `Cost` accumulates across turns
- `MessageCount` incremented by DB trigger on each insert

---

## Step 7: Auto-Compact (Context Summarization)

**When**: After an agent response completes, if tokens >= 95% of context window and `autoCompact` is enabled

**What happens**:
1. TUI dispatches `startCompactSessionMsg`
2. Compacting overlay shown: "Summarizing..."
3. Agent's `Summarize(ctx, sessionID)` called:
   a. Loads all messages from session
   b. Appends summarization prompt
   c. Sends to `summarizeProvider` (may be a different model)
   d. Creates assistant message with summary
   e. Sets `session.SummaryMessageID`
   f. Updates session cost
4. On next prompt, only messages after `SummaryMessageID` are sent to LLM
5. User can continue working without context window exhaustion

**User sees**: Brief "Summarizing..." overlay, then normal chat continues

---

## Step 8: Cancel Execution

**User action**: Presses Ctrl+X during streaming

**What happens**:
1. `agent.Cancel(sessionID)` called
2. Context cancel function invoked
3. Provider stream terminates
4. If mid-tool-execution: tool calls receive "canceled" error
5. Assistant message updated with `FinishReasonCanceled`
6. Agent marks request as complete
7. TUI returns to idle state

---

## Step 9: Quit Application

**User action**: Presses Ctrl+C

**What happens**:
1. Quit confirmation dialog shown: "Are you sure you want to quit?"
2. If agent is busy: warning shown alongside
3. User confirms (Enter or 'y')
4. `app.Shutdown()` called:
   - Cancel all file watcher goroutines
   - Shutdown all LSP clients (5-second timeout per client)
5. Bubble Tea program exits
6. Terminal restored to normal state
