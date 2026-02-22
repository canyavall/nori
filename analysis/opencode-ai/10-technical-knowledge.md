# OpenCode - Technical Knowledge Base

> Everything needed to rebuild this system or something similar from scratch.

---

## 1. Go Project Structure for a Terminal AI Tool

### Directory Layout
```
project/
+-- main.go                    # Entry point, calls cmd.Execute()
+-- cmd/
|   +-- root.go                # CLI setup with cobra: flags, commands
+-- internal/                  # Enforces Go visibility rules
    +-- app/app.go             # Wires all services together
    +-- config/config.go       # Configuration loading
    +-- db/                    # Database layer (sqlc generated)
    +-- llm/
    |   +-- agent/             # Agent loop (stream + tool execution)
    |   +-- models/            # Model definitions (ID, pricing, context window)
    |   +-- prompt/            # System prompts per agent type
    |   +-- provider/          # LLM API client implementations
    |   +-- tools/             # Tool implementations
    +-- tui/                   # Bubble Tea TUI
    +-- session/               # Session management
    +-- message/               # Message management
    +-- permission/            # Permission system
    +-- pubsub/                # Generic event broker
    +-- lsp/                   # Language Server Protocol client
    +-- logging/               # Structured logging
```

### Key Principle
The `internal/` directory prevents external packages from importing any of the internal types. This is important for a tool where the entire codebase is the product (not a library).

---

## 2. Provider Abstraction (Multi-LLM Support)

### The Interface
```go
type Provider interface {
    SendMessages(ctx context.Context, messages []message.Message, tools []tools.BaseTool) (*ProviderResponse, error)
    StreamResponse(ctx context.Context, messages []message.Message, tools []tools.BaseTool) <-chan ProviderEvent
    Model() models.Model
}
```

### Factory Pattern
```go
func NewProvider(providerName models.ModelProvider, opts ...ProviderClientOption) (Provider, error) {
    clientOptions := providerClientOptions{}
    for _, o := range opts {
        o(&clientOptions)
    }
    switch providerName {
    case models.ProviderAnthropic:
        return &baseProvider[AnthropicClient]{client: newAnthropicClient(clientOptions)}, nil
    case models.ProviderOpenAI:
        return &baseProvider[OpenAIClient]{client: newOpenAIClient(clientOptions)}, nil
    // ... etc
    }
}
```

### Generic Base Provider
```go
type ProviderClient interface {
    send(ctx context.Context, messages []message.Message, tools []tools.BaseTool) (*ProviderResponse, error)
    stream(ctx context.Context, messages []message.Message, tools []tools.BaseTool) <-chan ProviderEvent
}

type baseProvider[C ProviderClient] struct {
    options providerClientOptions
    client  C
}
```

The `baseProvider[C]` generic struct delegates to the concrete client type, providing common message cleaning logic.

### Reusing OpenAI Client for Compatible APIs
Several providers reuse the OpenAI client with a different base URL:
```go
case models.ProviderGROQ:
    clientOptions.openaiOptions = append(clientOptions.openaiOptions,
        WithOpenAIBaseURL("https://api.groq.com/openai/v1"))
    return &baseProvider[OpenAIClient]{client: newOpenAIClient(clientOptions)}, nil

case models.ProviderOpenRouter:
    clientOptions.openaiOptions = append(clientOptions.openaiOptions,
        WithOpenAIBaseURL("https://openrouter.ai/api/v1"),
        WithOpenAIExtraHeaders(map[string]string{...}))
    return &baseProvider[OpenAIClient]{client: newOpenAIClient(clientOptions)}, nil
```

### Streaming Event Types
```go
const (
    EventContentStart  EventType = "content_start"
    EventToolUseStart  EventType = "tool_use_start"
    EventToolUseDelta  EventType = "tool_use_delta"
    EventToolUseStop   EventType = "tool_use_stop"
    EventContentDelta  EventType = "content_delta"
    EventThinkingDelta EventType = "thinking_delta"
    EventContentStop   EventType = "content_stop"
    EventComplete      EventType = "complete"
    EventError         EventType = "error"
    EventWarning       EventType = "warning"
)
```

### Token Usage Tracking
```go
type TokenUsage struct {
    InputTokens         int64
    OutputTokens        int64
    CacheCreationTokens int64
    CacheReadTokens     int64
}
```

### Model Definition
```go
type Model struct {
    ID                  ModelID
    Name                string
    Provider            ModelProvider
    APIModel            string            // Actual API model string
    CostPer1MIn         float64
    CostPer1MOut        float64
    CostPer1MInCached   float64
    CostPer1MOutCached  float64
    ContextWindow       int64
    DefaultMaxTokens    int64
    CanReason           bool              // Supports thinking/reasoning
    SupportsAttachments bool              // Supports image attachments
}
```

### Cost Calculation
```go
cost := model.CostPer1MInCached/1e6*float64(usage.CacheCreationTokens) +
    model.CostPer1MOutCached/1e6*float64(usage.CacheReadTokens) +
    model.CostPer1MIn/1e6*float64(usage.InputTokens) +
    model.CostPer1MOut/1e6*float64(usage.OutputTokens)
```

---

## 3. Tool System

### BaseTool Interface
```go
type BaseTool interface {
    Info() ToolInfo
    Run(ctx context.Context, params ToolCall) (ToolResponse, error)
}

type ToolInfo struct {
    Name        string
    Description string
    Parameters  map[string]any     // JSON Schema for parameters
    Required    []string           // Required parameter names
}

type ToolResponse struct {
    Type     toolResponseType   // "text" or "image"
    Content  string
    Metadata string             // Optional JSON metadata
    IsError  bool
}
```

### Tool Registration
Tools are registered as a simple slice:
```go
func CoderAgentTools(...) []tools.BaseTool {
    return append(
        []tools.BaseTool{
            tools.NewBashTool(permissions),
            tools.NewEditTool(lspClients, permissions, history),
            tools.NewFetchTool(permissions),
            tools.NewGlobTool(),
            tools.NewGrepTool(),
            tools.NewLsTool(),
            tools.NewSourcegraphTool(),
            tools.NewViewTool(lspClients),
            tools.NewPatchTool(lspClients, permissions, history),
            tools.NewWriteTool(lspClients, permissions, history),
            NewAgentTool(sessions, messages, lspClients),
        }, mcpTools...,
    )
}
```

### Task Agent (Read-Only Tools)
```go
func TaskAgentTools(lspClients map[string]*lsp.Client) []tools.BaseTool {
    return []tools.BaseTool{
        tools.NewGlobTool(),
        tools.NewGrepTool(),
        tools.NewLsTool(),
        tools.NewSourcegraphTool(),
        tools.NewViewTool(lspClients),
    }
}
```

### Bash Tool Details
- Uses a persistent shell session (`internal/llm/tools/shell/shell.go`)
- Shell path configurable (defaults to `$SHELL` or `/bin/bash`)
- Banned commands list prevents network tools
- Safe read-only commands bypass permission prompts
- Default timeout: 1 minute, max: 10 minutes
- Output truncated at 30,000 characters
- Returns start/end timestamps as metadata

### Permission-Aware Tools
Tools that modify state accept a `permission.Service`:
```go
type bashTool struct {
    permissions permission.Service
}
```

The tool calls `permissions.Request(...)` which blocks until the user responds via the TUI dialog.

---

## 4. Agent Loop (Core Agentic Pattern)

### The Loop
```go
func (a *agent) processGeneration(ctx, sessionID, content, attachmentParts) AgentEvent {
    // 1. Create user message in DB
    userMsg := a.createUserMessage(ctx, sessionID, content, attachmentParts)
    msgHistory := append(existingMsgs, userMsg)

    for {
        // 2. Check cancellation
        select {
        case <-ctx.Done():
            return a.err(ctx.Err())
        default:
        }

        // 3. Stream response and handle events
        agentMessage, toolResults, err := a.streamAndHandleEvents(ctx, sessionID, msgHistory)

        // 4. If tool calls present, loop back with results
        if agentMessage.FinishReason() == message.FinishReasonToolUse && toolResults != nil {
            msgHistory = append(msgHistory, agentMessage, *toolResults)
            continue  // Back to step 2
        }

        // 5. No more tool calls, return final response
        return AgentEvent{Type: AgentEventTypeResponse, Message: agentMessage, Done: true}
    }
}
```

### Stream Event Processing
```go
func (a *agent) processEvent(ctx, sessionID, assistantMsg, event) error {
    switch event.Type {
    case provider.EventThinkingDelta:
        assistantMsg.AppendReasoningContent(event.Content)
        return a.messages.Update(ctx, *assistantMsg)
    case provider.EventContentDelta:
        assistantMsg.AppendContent(event.Content)
        return a.messages.Update(ctx, *assistantMsg)
    case provider.EventToolUseStart:
        assistantMsg.AddToolCall(*event.ToolCall)
        return a.messages.Update(ctx, *assistantMsg)
    case provider.EventToolUseStop:
        assistantMsg.FinishToolCall(event.ToolCall.ID)
        return a.messages.Update(ctx, *assistantMsg)
    case provider.EventComplete:
        assistantMsg.SetToolCalls(event.Response.ToolCalls)
        assistantMsg.AddFinish(event.Response.FinishReason)
        a.messages.Update(ctx, *assistantMsg)
        return a.TrackUsage(ctx, sessionID, a.provider.Model(), event.Response.Usage)
    }
}
```

### Tool Execution Within Agent Loop
```go
for i, toolCall := range toolCalls {
    // Find matching tool
    var tool tools.BaseTool
    for _, availableTool := range a.tools {
        if availableTool.Info().Name == toolCall.Name {
            tool = availableTool
            break
        }
    }

    if tool == nil {
        toolResults[i] = message.ToolResult{Content: "Tool not found", IsError: true}
        continue
    }

    // Execute with cancellation support
    toolResult, toolErr := tool.Run(ctx, tools.ToolCall{
        ID: toolCall.ID, Name: toolCall.Name, Input: toolCall.Input,
    })

    // Handle permission denied specially
    if errors.Is(toolErr, permission.ErrorPermissionDenied) {
        // Cancel all remaining tool calls
        break
    }

    toolResults[i] = message.ToolResult{
        ToolCallID: toolCall.ID,
        Content:    toolResult.Content,
        IsError:    toolResult.IsError,
    }
}
```

### Cancellation Pattern
```go
// Store cancel function per session
genCtx, cancel := context.WithCancel(ctx)
a.activeRequests.Store(sessionID, cancel)

// Cancel method
func (a *agent) Cancel(sessionID string) {
    if cancelFunc, exists := a.activeRequests.LoadAndDelete(sessionID); exists {
        cancel()
    }
}
```

### Title Generation (Async)
When the first message in a session is sent, title generation runs in a background goroutine:
```go
if len(msgs) == 0 {
    go func() {
        a.generateTitle(context.Background(), sessionID, content)
    }()
}
```
Uses a dedicated `titleProvider` (smaller/cheaper model, max 80 tokens).

---

## 5. Auto-Compact (Context Summarization)

### Trigger Condition
After each agent response, check if tokens exceed 95% of context window:
```go
tokens := session.CompletionTokens + session.PromptTokens
if (tokens >= int64(float64(contextWindow)*0.95)) && config.Get().AutoCompact {
    // Trigger summarization
}
```

### Summarization Flow
1. Get all messages from current session
2. Append summarization prompt: "Provide a detailed but concise summary..."
3. Send to `summarizeProvider` (can be a different model)
4. Create assistant message with summary content
5. Set `session.SummaryMessageID` to the summary message ID
6. On next agent run, messages before the summary are dropped, and the summary message becomes the first "user" message

### Key Design Choice
Instead of creating a new session, the summary is inserted into the existing session and a pointer (`SummaryMessageID`) marks where the compacted history starts. This preserves session identity while effectively resetting the context window.

---

## 6. PubSub Event System

### Generic Broker
```go
type EventType string

const (
    CreatedEvent EventType = "created"
    UpdatedEvent EventType = "updated"
    DeletedEvent EventType = "deleted"
)

type Event[T any] struct {
    Type    EventType
    Payload T
}

type Broker[T any] struct {
    subs     map[chan Event[T]]struct{}
    mu       sync.RWMutex
    done     chan struct{}
}
```

### Subscribe (Context-Scoped)
```go
func (b *Broker[T]) Subscribe(ctx context.Context) <-chan Event[T] {
    sub := make(chan Event[T], bufferSize)  // bufferSize = 64
    b.subs[sub] = struct{}{}
    go func() {
        <-ctx.Done()
        // cleanup: delete sub, close channel
    }()
    return sub
}
```

### Publish (Non-Blocking)
```go
func (b *Broker[T]) Publish(t EventType, payload T) {
    for _, sub := range subscribers {
        select {
        case sub <- event:   // Send if buffer has space
        default:             // Drop if buffer full (non-blocking)
        }
    }
}
```

### Usage Pattern (TUI Subscription)
In Bubble Tea, subscriptions are set up via `tea.Cmd`:
```go
func waitForEvent[T any](sub <-chan pubsub.Event[T]) tea.Cmd {
    return func() tea.Msg {
        event := <-sub
        return event  // Becomes a tea.Msg for Update()
    }
}
```

---

## 7. Session & Message Management

### Session Model
```go
type Session struct {
    ID               string
    ParentSessionID  string
    Title            string
    MessageCount     int64
    PromptTokens     int64
    CompletionTokens int64
    SummaryMessageID string
    Cost             float64
    CreatedAt        int64
    UpdatedAt        int64
}
```

### Message Content Parts
Messages store content as a JSON array of typed parts:
```go
type ContentPart interface { ... }

type TextContent struct {
    Text string
}

type ToolCall struct {
    ID    string
    Name  string
    Input string  // JSON string
}

type ToolResult struct {
    ToolCallID string
    Content    string
    Metadata   string
    IsError    bool
}

type BinaryContent struct {
    Path     string
    MIMEType string
    Data     []byte
}

type Finish struct {
    Reason FinishReason
    Time   int64
}
```

### Finish Reasons
```go
const (
    FinishReasonEndTurn          = "end_turn"
    FinishReasonToolUse          = "tool_use"
    FinishReasonCanceled         = "canceled"
    FinishReasonPermissionDenied = "permission_denied"
)
```

### sqlc Query Generation
SQL queries are defined in `.sql` files:
```sql
-- name: CreateSession :one
INSERT INTO sessions (id, parent_session_id, title, updated_at, created_at)
VALUES (?, ?, ?, strftime('%s', 'now'), strftime('%s', 'now'))
RETURNING *;

-- name: ListSessions :many
SELECT * FROM sessions WHERE parent_session_id IS NULL ORDER BY updated_at DESC;
```

sqlc generates type-safe Go code from these queries.

---

## 8. Bubble Tea TUI Architecture

### Elm Architecture
```
Model (state) -> View (render) -> Update (handle messages) -> Model...
```

### Root Model Structure
```go
type appModel struct {
    width, height   int
    currentPage     page.PageID
    pages           map[page.PageID]tea.Model
    status          core.StatusCmp

    // Dialog states (boolean flags)
    showPermissions bool
    showHelp        bool
    showQuit        bool
    showSessionDialog bool
    showCommandDialog bool
    showModelDialog   bool
    showInitDialog    bool
    showFilepicker    bool
    showThemeDialog   bool
    showMultiArgumentsDialog bool
    isCompacting      bool

    // Dialog models
    permissions  dialog.PermissionDialogCmp
    help         dialog.HelpCmp
    // ... etc
}
```

### Dialog Overlay Pattern
```go
func (a appModel) View() string {
    // 1. Render base page
    appView := lipgloss.JoinVertical(lipgloss.Top,
        a.pages[a.currentPage].View(),
        a.status.View(),
    )

    // 2. Overlay dialogs on top
    if a.showPermissions {
        overlay := a.permissions.View()
        row := lipgloss.Height(appView)/2 - lipgloss.Height(overlay)/2
        col := lipgloss.Width(appView)/2 - lipgloss.Width(overlay)/2
        appView = layout.PlaceOverlay(col, row, overlay, appView, true)
    }
    // ... repeat for each dialog
    return appView
}
```

### Message Routing
Key messages are intercepted at the root level before reaching pages:
- `tea.KeyMsg` with Ctrl+C -> quit dialog
- `pubsub.Event[permission.PermissionRequest]` -> permission dialog
- `tea.WindowSizeMsg` -> resize all components
- Dialog close messages -> toggle visibility flags

When a dialog is visible, key messages are consumed by the dialog and NOT passed down:
```go
if a.showPermissions {
    d, permissionsCmd := a.permissions.Update(msg)
    if _, ok := msg.(tea.KeyMsg); ok {
        return a, tea.Batch(cmds...)  // Block key propagation
    }
}
```

### Theme System
```go
func SetTheme(name string) error
func CurrentTheme() Theme

type Theme interface {
    Primary() lipgloss.Color
    Secondary() lipgloss.Color
    Background() lipgloss.Color
    Text() lipgloss.Color
    TextMuted() lipgloss.Color
    Border() lipgloss.Color
    BorderFocused() lipgloss.Color
    Success() lipgloss.Color
    Warning() lipgloss.Color
    Error() lipgloss.Color
    // ... etc
}
```

Built-in themes: OpenCode, Catppuccin, Dracula, Flexoki, Gruvbox, Monokai, OneDark, Tokyo Night, Tron.

---

## 9. Permission System

### Request Flow
```go
func (s *permissionService) Request(opts CreatePermissionRequest) bool {
    // 1. Check auto-approve sessions
    if slices.Contains(s.autoApproveSessions, opts.SessionID) {
        return true
    }

    // 2. Check session-persistent permissions
    for _, p := range s.sessionPermissions {
        if p.ToolName == permission.ToolName && p.Action == permission.Action &&
           p.SessionID == permission.SessionID && p.Path == permission.Path {
            return true
        }
    }

    // 3. Create response channel and publish request
    respCh := make(chan bool, 1)
    s.pendingRequests.Store(permission.ID, respCh)
    s.Publish(pubsub.CreatedEvent, permission)

    // 4. Block until user responds via TUI
    resp := <-respCh
    return resp
}
```

### TUI Permission Dialog
The dialog presents three options:
- **Allow**: Grant this specific permission (one-time)
- **Allow for Session**: Grant for this tool+action+path for the rest of the session
- **Deny**: Reject the permission (returns `ErrorPermissionDenied`)

### Non-Interactive Auto-Approve
```go
func (s *permissionService) AutoApproveSession(sessionID string) {
    s.autoApproveSessions = append(s.autoApproveSessions, sessionID)
}
```

---

## 10. Configuration System

### File Locations (Priority Order)
1. `./.opencode.json` (project-local, highest priority)
2. `$XDG_CONFIG_HOME/opencode/.opencode.json`
3. `$HOME/.opencode.json`
4. Environment variables (with `OPENCODE_` prefix via Viper)

### Merge Strategy
Local config merges on top of global config using `viper.MergeConfigMap`.

### Provider Auto-Detection Order
When no agent models are configured, OpenCode detects available providers:
1. GitHub Copilot (checks `~/.config/github-copilot/hosts.json`)
2. Anthropic (`ANTHROPIC_API_KEY`)
3. OpenAI (`OPENAI_API_KEY`)
4. Google Gemini (`GEMINI_API_KEY`)
5. Groq (`GROQ_API_KEY`)
6. OpenRouter (`OPENROUTER_API_KEY`)
7. xAI (`XAI_API_KEY`)
8. AWS Bedrock (checks AWS credentials)
9. Azure OpenAI (`AZURE_OPENAI_ENDPOINT`)
10. VertexAI (`VERTEXAI_PROJECT` + `VERTEXAI_LOCATION`)

The first available provider sets the default models for all agents.

### Validation
- Model existence checked against `SupportedModels` registry
- Provider API key verified (disabled if empty)
- MaxTokens validated against context window (capped at half)
- Reasoning effort validated (low/medium/high for OpenAI models)
- Invalid configs fall back to defaults with warnings

---

## 11. LSP Integration

### Client Lifecycle
```go
// Initialized per language in background goroutine
func (app *App) initLSPClients(ctx context.Context) {
    for lang, lspConfig := range config.Get().LSP {
        if lspConfig.Disabled { continue }
        client, err := lsp.NewClient(lang, lspConfig.Command, lspConfig.Args)
        // Start file watcher to notify LSP of changes
        app.startFileWatcher(ctx, lang, client)
    }
}
```

### Diagnostics Tool
```go
type diagnosticsTool struct {
    lspClients map[string]*lsp.Client
}

func (t *diagnosticsTool) Run(ctx context.Context, params ToolCall) (ToolResponse, error) {
    // Query all LSP clients for diagnostics
    // Return formatted diagnostic information
}
```

### File Watcher
Uses `fsnotify` to watch for file changes and notify LSP clients:
```go
watcher, _ := fsnotify.NewWatcher()
watcher.Add(config.WorkingDirectory())
for event := range watcher.Events {
    client.DidChangeWatchedFiles(event.Name)
}
```

---

## 12. Custom Commands

### File-Based Definition
```
~/.config/opencode/commands/prime-context.md  -> user:prime-context
.opencode/commands/review-pr.md               -> project:review-pr
~/.config/opencode/commands/git/commit.md     -> user:git:commit
```

### Named Arguments
Placeholders in format `$NAME` (uppercase, starts with letter):
```markdown
# Fetch Context for Issue $ISSUE_NUMBER

RUN gh issue view $ISSUE_NUMBER --json title,body,comments
RUN grep -R "$SEARCH_PATTERN" $DIRECTORY
```

When executed, OpenCode prompts for each unique argument value.

### Execution
The command content (with arguments replaced) is sent as a chat message to the AI assistant.

---

## 13. MCP Tool Integration

### Configuration
```json
{
    "mcpServers": {
        "filesystem": {
            "type": "stdio",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
            "env": ["API_KEY=value"]
        },
        "web-search": {
            "type": "sse",
            "url": "https://example.com/mcp",
            "headers": {"Authorization": "Bearer token"}
        }
    }
}
```

### Tool Discovery
```go
func GetMcpTools(ctx context.Context, permissions permission.Service) []tools.BaseTool {
    // For each configured MCP server:
    // 1. Connect via stdio or SSE
    // 2. Call tools/list to discover available tools
    // 3. Wrap each as a BaseTool with permission checking
    // 4. Return combined tool list
}
```

MCP tools are seamlessly integrated alongside built-in tools.

---

## 14. File Change Tracking

### History Service
```go
type Service interface {
    SaveVersion(ctx context.Context, sessionID, path, content, version string) error
    GetVersions(ctx context.Context, sessionID, path string) ([]File, error)
    GetLatest(ctx context.Context, sessionID, path string) (*File, error)
}
```

### Integration with Tools
The `edit`, `write`, and `patch` tools save file versions to the database:
```go
// Before writing
oldContent := readFile(path)
history.SaveVersion(ctx, sessionID, path, oldContent, "before")

// After writing
newContent := "..."
writeFile(path, newContent)
history.SaveVersion(ctx, sessionID, path, newContent, "after")
```

### TUI Sidebar Display
The chat page sidebar shows files changed during the session, loaded from the history service.
