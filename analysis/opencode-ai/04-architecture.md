# OpenCode - Architecture

## System Architecture

```
+-------------------------------------------------------------------+
|                        OpenCode Process                            |
|                                                                    |
|  +------------------+    PubSub Events     +-------------------+  |
|  |   Bubble Tea     |<------------------->|   Agent Service    |  |
|  |   TUI Layer      |                     |                    |  |
|  |                   |                     | - CoderAgent       |  |
|  | - Chat Page       |   tea.Cmd/Msg      | - TitleAgent       |  |
|  | - Logs Page       |<------------------->| - SummarizerAgent  |  |
|  | - Dialog Overlays |                     | - TaskAgent        |  |
|  | - Status Bar      |                     +--------+-----------+  |
|  +------------------+                               |              |
|                                                      |              |
|          +-------------------------------------------+              |
|          |                    |                    |                 |
|  +-------v------+   +--------v--------+  +--------v----------+    |
|  |   Provider    |   |  Tool System    |  | Permission Service|    |
|  |   Layer       |   |                 |  |                   |    |
|  |               |   | - BashTool      |  | - Request/Grant   |    |
|  | - Anthropic   |   | - EditTool      |  | - Deny/AutoApprove|    |
|  | - OpenAI      |   | - WriteTool     |  | - Session-scoped  |    |
|  | - Gemini      |   | - ViewTool      |  +-------------------+    |
|  | - Bedrock     |   | - GlobTool      |                           |
|  | - Copilot     |   | - GrepTool      |  +-------------------+    |
|  | - Azure       |   | - LsTool        |  | LSP Clients       |    |
|  | - Groq        |   | - FetchTool     |  |                   |    |
|  | - OpenRouter   |   | - PatchTool     |  | - gopls           |    |
|  | - VertexAI    |   | - Sourcegraph   |  | - ts-language-srv |    |
|  | - xAI         |   | - AgentTool     |  | - (any LSP)       |    |
|  | - Local       |   | - DiagTool      |  +-------------------+    |
|  +---------------+   | - MCP Tools     |                           |
|                       +--------+--------+  +-------------------+    |
|                                |           | Session Service   |    |
|                                |           | Message Service   |    |
|                                |           | History Service   |    |
|                                |           +--------+----------+    |
|                                |                    |               |
|                       +--------v--------------------v----------+    |
|                       |            SQLite Database              |    |
|                       |     .opencode/opencode.db              |    |
|                       |                                        |    |
|                       | sessions | messages | files            |    |
|                       +--------------------------------------------+
+-------------------------------------------------------------------+
```

## Package Structure

```
opencode/
+-- main.go                    # Entry point
+-- cmd/
|   +-- root.go                # Cobra CLI setup (flags, commands)
|   +-- schema/                # JSON schema generator for config
+-- internal/
    +-- app/
    |   +-- app.go             # App struct: wires all services together
    |   +-- lsp.go             # LSP client initialization
    +-- config/
    |   +-- config.go          # Viper-based config loading, validation
    |   +-- init.go            # Project initialization (OpenCode.md dialog)
    +-- db/
    |   +-- connect.go         # SQLite connection setup
    |   +-- db.go              # sqlc-generated database interface
    |   +-- embed.go           # Embedded migration files
    |   +-- models.go          # sqlc-generated Go structs
    |   +-- sessions.sql.go    # sqlc-generated session queries
    |   +-- messages.sql.go    # sqlc-generated message queries
    |   +-- files.sql.go       # sqlc-generated file queries
    |   +-- migrations/        # SQL migration files (goose format)
    +-- diff/
    |   +-- diff.go            # Unified diff generation
    |   +-- patch.go           # Patch application logic
    +-- fileutil/
    |   +-- fileutil.go        # File path utilities
    +-- format/
    |   +-- format.go          # Output formatting (text, JSON)
    |   +-- spinner.go         # CLI spinner for non-interactive mode
    +-- history/
    |   +-- file.go            # File change tracking service
    +-- llm/
    |   +-- agent/
    |   |   +-- agent.go       # Core agent loop (stream + tool execution)
    |   |   +-- agent-tool.go  # Sub-agent tool (delegates tasks)
    |   |   +-- tools.go       # Tool registration (CoderAgentTools, TaskAgentTools)
    |   |   +-- mcp-tools.go   # MCP tool loading
    |   +-- models/
    |   |   +-- models.go      # Model registry and Model struct
    |   |   +-- anthropic.go   # Anthropic model definitions
    |   |   +-- openai.go      # OpenAI model definitions
    |   |   +-- gemini.go      # Gemini model definitions
    |   |   +-- copilot.go     # GitHub Copilot model definitions
    |   |   +-- groq.go        # Groq model definitions
    |   |   +-- azure.go       # Azure model definitions
    |   |   +-- openrouter.go  # OpenRouter model definitions
    |   |   +-- vertexai.go    # VertexAI model definitions
    |   |   +-- xai.go         # xAI model definitions
    |   |   +-- local.go       # Local/self-hosted model definitions
    |   +-- prompt/
    |   |   +-- prompt.go      # Prompt assembly (system + context + env)
    |   |   +-- coder.go       # Coder agent system prompts
    |   |   +-- summarizer.go  # Summarizer agent prompt
    |   |   +-- task.go        # Task agent prompt
    |   |   +-- title.go       # Title generation prompt
    |   +-- provider/
    |   |   +-- provider.go    # Provider interface + factory
    |   |   +-- anthropic.go   # Anthropic client implementation
    |   |   +-- openai.go      # OpenAI client implementation
    |   |   +-- gemini.go      # Gemini client implementation
    |   |   +-- bedrock.go     # AWS Bedrock client implementation
    |   |   +-- azure.go       # Azure OpenAI client implementation
    |   |   +-- copilot.go     # GitHub Copilot client implementation
    |   |   +-- vertexai.go    # VertexAI client implementation
    |   +-- tools/
    |       +-- tools.go       # BaseTool interface + ToolInfo/ToolResponse
    |       +-- bash.go        # Bash command execution tool
    |       +-- edit.go        # File edit tool (find-and-replace)
    |       +-- write.go       # File write tool
    |       +-- view.go        # File view tool (with offset/limit)
    |       +-- glob.go        # Glob pattern file search
    |       +-- grep.go        # Content search tool
    |       +-- ls.go          # Directory listing tool
    |       +-- fetch.go       # URL fetch tool
    |       +-- patch.go       # Diff patch application tool
    |       +-- sourcegraph.go # Sourcegraph code search
    |       +-- diagnostics.go # LSP diagnostics tool
    |       +-- file.go        # File utilities for tools
    |       +-- shell/
    |           +-- shell.go   # Persistent shell session management
    +-- logging/
    |   +-- logger.go          # Structured logging
    |   +-- message.go         # Log message types
    |   +-- writer.go          # Log writer (buffer for TUI display)
    +-- lsp/
    |   +-- client.go          # LSP client lifecycle
    |   +-- handlers.go        # LSP message handlers
    |   +-- language.go        # Language-to-LSP mapping
    |   +-- methods.go         # LSP method constants
    |   +-- protocol.go        # LSP protocol messages
    |   +-- transport.go       # LSP stdio transport
    |   +-- protocol/          # Full LSP type definitions
    |   +-- util/              # LSP utility functions
    |   +-- watcher/           # File system watcher for LSP
    +-- message/
    |   +-- message.go         # Message model + service
    |   +-- content.go         # Content part types (text, tool use, etc.)
    |   +-- attachment.go      # File attachment handling
    +-- permission/
    |   +-- permission.go      # Permission request/grant service
    +-- pubsub/
    |   +-- broker.go          # Generic pub/sub event broker
    |   +-- events.go          # Event type definitions
    +-- session/
    |   +-- session.go         # Session model + service
    +-- tui/
    |   +-- tui.go             # Root TUI model (appModel)
    |   +-- components/
    |   |   +-- chat/          # Chat page components
    |   |   |   +-- chat.go    # Chat page model
    |   |   |   +-- editor.go  # Message editor component
    |   |   |   +-- list.go    # Message list component
    |   |   |   +-- message.go # Message rendering
    |   |   |   +-- sidebar.go # File changes sidebar
    |   |   +-- core/
    |   |   |   +-- status.go  # Status bar component
    |   |   +-- dialog/        # Dialog overlay components
    |   |   |   +-- arguments.go     # Multi-argument input dialog
    |   |   |   +-- commands.go      # Command palette dialog
    |   |   |   +-- complete.go      # Autocomplete dialog
    |   |   |   +-- custom_commands.go # Custom command loading
    |   |   |   +-- filepicker.go    # File picker dialog
    |   |   |   +-- help.go          # Help dialog
    |   |   |   +-- init.go          # Project init dialog
    |   |   |   +-- models.go        # Model selection dialog
    |   |   |   +-- permission.go    # Permission prompt dialog
    |   |   |   +-- quit.go          # Quit confirmation dialog
    |   |   |   +-- session.go       # Session switcher dialog
    |   |   |   +-- theme.go         # Theme switcher dialog
    |   |   +-- logs/          # Logs page components
    |   |   +-- util/          # TUI utility components
    |   +-- image/             # Image rendering in terminal
    |   +-- layout/            # Layout helpers (container, overlay, split)
    |   +-- page/              # Page models (chat, logs)
    |   +-- styles/            # Global styles, icons, markdown
    |   +-- theme/             # Theme definitions (10+ themes)
    |   +-- util/              # TUI utility functions
    +-- version/
        +-- version.go         # Build version info
```

## Key Design Patterns

### 1. Elm Architecture (Bubble Tea)
The entire TUI follows the Elm architecture:
- **Model**: `appModel` struct holds all state (pages, dialogs, permissions)
- **Update**: `func (a appModel) Update(msg tea.Msg) (tea.Model, tea.Cmd)` handles all messages
- **View**: `func (a appModel) View() string` renders the full UI as a string

Messages flow through a single Update function which dispatches to the appropriate component.

### 2. Generic PubSub Event Broker
A type-safe generic pub/sub system `Broker[T]` used throughout:
```go
type Broker[T any] struct { ... }
func (b *Broker[T]) Subscribe(ctx context.Context) <-chan Event[T]
func (b *Broker[T]) Publish(t EventType, payload T)
```
Used by: `agent.Service`, `session.Service`, `message.Service`, `permission.Service`, `logging`

### 3. Provider Factory Pattern
All LLM providers implement a common `Provider` interface:
```go
type Provider interface {
    SendMessages(ctx context.Context, messages []message.Message, tools []tools.BaseTool) (*ProviderResponse, error)
    StreamResponse(ctx context.Context, messages []message.Message, tools []tools.BaseTool) <-chan ProviderEvent
    Model() models.Model
}
```
Created via `NewProvider(providerName, opts...)` factory with functional options pattern.

### 4. Tool Interface
All tools implement `BaseTool`:
```go
type BaseTool interface {
    Info() ToolInfo
    Run(ctx context.Context, params ToolCall) (ToolResponse, error)
}
```
Tools are registered as a slice, making it trivial to add new ones.

### 5. Service Layer Pattern
Domain logic is encapsulated in service interfaces:
- `session.Service` - CRUD for sessions
- `message.Service` - CRUD for messages
- `permission.Service` - Request/grant permissions
- `history.Service` - File change tracking

Each service wraps a `db.Querier` (sqlc-generated) and a `pubsub.Broker`.

### 6. Context-Based Cancellation
All agent operations use `context.WithCancel` for cancellation:
```go
genCtx, cancel := context.WithCancel(ctx)
a.activeRequests.Store(sessionID, cancel)
```
Active requests tracked in `sync.Map` for safe concurrent access.

## Database Schema

```sql
-- Sessions
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    parent_session_id TEXT,
    title TEXT NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    cost REAL NOT NULL DEFAULT 0.0,
    summary_message_id TEXT,  -- added in migration 2
    updated_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

-- Messages
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    parts TEXT NOT NULL DEFAULT '[]',  -- JSON array of content parts
    model TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    finished_at INTEGER
);

-- Files (change tracking)
CREATE TABLE files (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    content TEXT NOT NULL,
    version TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(path, session_id, version)
);
```

Triggers automatically:
- Update `updated_at` on row changes
- Increment/decrement `message_count` on messages table insert/delete

## Data Flow: User Prompt to Response

```
1. User types in TUI editor, presses Ctrl+S
   |
2. chat.SendMsg dispatched to chat page
   |
3. Chat page calls agent.Run(ctx, sessionID, content)
   |
4. Agent creates user message in DB (message.Service.Create)
   |
5. Agent calls provider.StreamResponse(ctx, messages, tools)
   |
6. Provider sends API request to LLM (streaming)
   |
7. Provider yields ProviderEvents via channel:
   |  - EventContentDelta -> append to assistant message
   |  - EventToolUseStart -> record tool call
   |  - EventToolUseStop -> finalize tool call
   |  - EventComplete -> finalize message
   |
8. Agent processes events, updates message in DB
   |  (publishes via PubSub -> TUI subscribes -> re-renders)
   |
9. If tool calls present:
   |  a. For each tool call:
   |     - Find matching BaseTool by name
   |     - Check permissions (may block waiting for TUI dialog)
   |     - Execute tool.Run(ctx, toolCall)
   |     - Collect ToolResponse
   |  b. Create tool result message in DB
   |  c. Append to message history
   |  d. Go back to step 5 (loop)
   |
10. If no tool calls (finish_reason = end_turn):
    |  Return AgentEvent with final message
    |  Track usage (tokens, cost) on session
    |
11. TUI receives completion, updates UI
```
