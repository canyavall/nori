# Flow: Tool Registration, Permission, and Execution

> The complete journey of how tools are registered, discovered by the LLM, granted permissions, executed, and how results flow back.

---

## Flow Diagram

```
+------------------+     +------------------+     +-------------------+
|  Tool            |---->|  LLM Discovers   |---->| LLM Generates     |
|  Registration    |     |  Tools (schema)  |     | Tool Call          |
+------------------+     +------------------+     +--------+----------+
                                                           |
                                                  +--------v----------+
                                                  |  Agent Finds Tool |
                                                  |  by Name          |
                                                  +--------+----------+
                                                           |
                                              +------------v-----------+
                                              | Permission Required?   |
                                              |                        |
                                              | NO             YES     |
                                              |  |              |      |
                                              |  |    +---------v----+ |
                                              |  |    | TUI Dialog   | |
                                              |  |    | Allow/Deny   | |
                                              |  |    +------+-------+ |
                                              +--+-----------|--------+
                                                 |           |
                                          +------v-----------v-----+
                                          |    Tool.Run(ctx, call) |
                                          +--------+---------------+
                                                   |
                                          +--------v----------+
                                          | ToolResponse      |
                                          | -> Agent Loop     |
                                          | -> DB Message     |
                                          | -> Back to LLM    |
                                          +-------------------+
```

---

## Step 1: Tool Registration

**When**: At application startup, during agent creation

**What happens**:
```go
agent.CoderAgentTools(permissions, sessions, messages, history, lspClients)
```

Returns a `[]tools.BaseTool` containing:

| # | Tool | Needs Permission | Dependencies |
|---|------|-----------------|--------------|
| 1 | BashTool | Yes (except safe read-only cmds) | permission.Service |
| 2 | EditTool | Yes | lspClients, permission.Service, history.Service |
| 3 | FetchTool | Yes | permission.Service |
| 4 | GlobTool | No | (none) |
| 5 | GrepTool | No | (none) |
| 6 | LsTool | No | (none) |
| 7 | SourcegraphTool | No | (none) |
| 8 | ViewTool | No | lspClients |
| 9 | PatchTool | Yes | lspClients, permission.Service, history.Service |
| 10 | WriteTool | Yes | lspClients, permission.Service, history.Service |
| 11 | AgentTool | No (sub-agent) | sessions, messages, lspClients |
| 12 | DiagnosticsTool | No | lspClients (if any configured) |
| 13+ | MCP Tools | Yes (all) | permission.Service, MCP client |

**Task Agent** gets a read-only subset: Glob, Grep, Ls, Sourcegraph, View.

---

## Step 2: Tool Schema Generation

**What happens**: Each tool provides its schema via `Info()`:

```go
func (t *bashTool) Info() ToolInfo {
    return ToolInfo{
        Name:        "bash",
        Description: "Executes a given bash command...",
        Parameters: map[string]any{
            "type": "object",
            "properties": map[string]any{
                "command": map[string]any{
                    "type":        "string",
                    "description": "The bash command to execute",
                },
                "timeout": map[string]any{
                    "type":        "integer",
                    "description": "Optional timeout in milliseconds",
                },
            },
        },
        Required: []string{"command"},
    }
}
```

**How schemas reach the LLM**: Each provider implementation converts `[]tools.BaseTool` to its API-specific tool format:
- Anthropic: `anthropic.ToolParam{Name, Description, InputSchema}`
- OpenAI: `openai.ChatCompletionToolParam{Function{Name, Description, Parameters}}`
- Gemini: `genai.Tool{FunctionDeclarations}`

---

## Step 3: LLM Generates Tool Call

**What happens**: The LLM responds with a tool_use block (or function_call, depending on provider):

```json
{
    "type": "tool_use",
    "id": "toolu_abc123",
    "name": "bash",
    "input": "{\"command\": \"git status\"}"
}
```

**Events emitted by provider**:
1. `EventToolUseStart` with `ToolCall{ID, Name, Input: ""}`
2. `EventToolUseDelta` (optional, for streaming tool input)
3. `EventToolUseStop` with `ToolCall{ID, Name, Input: "full json"}`

---

## Step 4: Agent Finds Matching Tool

```go
for _, availableTool := range a.tools {
    if availableTool.Info().Name == toolCall.Name {
        tool = availableTool
        break
    }
}

if tool == nil {
    toolResults[i] = message.ToolResult{
        ToolCallID: toolCall.ID,
        Content:    fmt.Sprintf("Tool not found: %s", toolCall.Name),
        IsError:    true,
    }
    continue
}
```

---

## Step 5: Permission Check

**For tools that require permission** (bash, edit, write, patch, fetch, MCP tools):

```go
// Inside the tool's Run() method
func (t *bashTool) Run(ctx context.Context, call ToolCall) (ToolResponse, error) {
    params := parseBashParams(call.Input)

    // Check if command is safe (read-only)
    if isSafeReadOnlyCommand(params.Command) {
        // Skip permission check
    } else {
        // Request permission (blocks until user responds)
        allowed := t.permissions.Request(permission.CreatePermissionRequest{
            SessionID:   sessionID,
            ToolName:    "bash",
            Description: fmt.Sprintf("Execute: %s", params.Command),
            Action:      "execute",
            Params:      params,
            Path:        config.WorkingDirectory(),
        })
        if !allowed {
            return ToolResponse{}, permission.ErrorPermissionDenied
        }
    }

    // Execute...
}
```

**Permission Service flow**:
1. Check auto-approve sessions (non-interactive mode)
2. Check session-persistent permissions (previously "Allow for session")
3. Publish `PermissionRequest` via PubSub
4. Block on response channel (`<-respCh`)
5. TUI receives event, shows permission dialog
6. User presses: `a` (allow), `A` (allow for session), `d` (deny)
7. Response sent back via channel
8. Tool proceeds or returns `ErrorPermissionDenied`

**Permission denial cascade**: If any tool call is denied, ALL remaining tool calls in the batch are cancelled:
```go
if errors.Is(toolErr, permission.ErrorPermissionDenied) {
    for j := i + 1; j < len(toolCalls); j++ {
        toolResults[j] = message.ToolResult{
            Content: "Tool execution canceled by user",
            IsError: true,
        }
    }
    a.finishMessage(ctx, &assistantMsg, message.FinishReasonPermissionDenied)
    break
}
```

---

## Step 6: Tool Execution

### Bash Tool
```
1. Parse command and timeout from JSON input
2. Check banned commands list
3. Check safe read-only commands (skip permission)
4. Request permission if needed
5. Execute via persistent shell session:
   - shell.Execute(command, timeout)
   - Captures stdout + stderr combined
6. Truncate output if > 30,000 chars
7. Return ToolResponse{Content: output, Metadata: {start_time, end_time}}
```

### Edit Tool
```
1. Parse file_path and edit parameters
2. Request permission (action: "edit")
3. Read current file content
4. Save "before" version to history service
5. Apply find-and-replace or edit operation
6. Write modified content
7. Save "after" version to history service
8. Notify LSP clients of file change
9. Generate unified diff
10. Return ToolResponse{Content: diff}
```

### Write Tool
```
1. Parse file_path and content
2. Request permission (action: "write")
3. Save existing content (if any) to history
4. Write new content to file
5. Save new content to history
6. Notify LSP clients of file change
7. Return ToolResponse{Content: "File written successfully"}
```

### View Tool
```
1. Parse file_path, optional offset and limit
2. No permission needed (read-only)
3. Read file content
4. Apply offset/limit if specified
5. Add line numbers
6. If LSP client available for file type, include diagnostics
7. Return ToolResponse{Content: numbered lines}
```

### Glob Tool
```
1. Parse pattern and optional base path
2. No permission needed
3. Walk directory tree matching glob pattern (doublestar library)
4. Return list of matching file paths
```

### Grep Tool
```
1. Parse pattern, optional path, include filter, literal_text flag
2. No permission needed
3. Execute regex search across files
4. Return matching lines with file paths and line numbers
```

### Fetch Tool
```
1. Parse URL, format (text/markdown/html), optional timeout
2. Request permission (action: "fetch")
3. HTTP GET to URL
4. Convert content based on format:
   - html: return raw HTML
   - markdown: convert HTML to markdown (html-to-markdown library)
   - text: extract text content
5. Return ToolResponse{Content: converted content}
```

### Agent Tool (Sub-Agent)
```
1. Parse prompt
2. Create task session (child of current session)
3. Create new agent with TaskAgentTools (read-only)
4. Run sub-agent with prompt
5. Wait for completion
6. Return sub-agent's final response as tool result
```

---

## Step 7: Result Handling

**Tool results are collected into a message**:
```go
parts := make([]message.ContentPart, 0)
for _, tr := range toolResults {
    parts = append(parts, message.ToolResult{
        ToolCallID: tr.ToolCallID,
        Content:    tr.Content,
        Metadata:   tr.Metadata,
        IsError:    tr.IsError,
    })
}
msg := a.messages.Create(ctx, sessionID, message.CreateMessageParams{
    Role:  message.Tool,
    Parts: parts,
})
```

**Back to LLM**: The agent loop appends the assistant message (with tool calls) and the tool result message to the history, then sends the full history back to the LLM. The LLM then decides whether to make more tool calls or provide a final response.

---

## Step 8: Cancellation During Tool Execution

**If the user presses Ctrl+X while tools are executing**:

```go
select {
case <-ctx.Done():
    // Cancel all remaining tool calls
    for j := i; j < len(toolCalls); j++ {
        toolResults[j] = message.ToolResult{
            ToolCallID: toolCalls[j].ID,
            Content:    "Tool execution canceled by user",
            IsError:    true,
        }
    }
    a.finishMessage(context.Background(), &assistantMsg, message.FinishReasonCanceled)
    break
default:
    // Continue processing
}
```

The context is cancelled via the `cancel()` function stored in `activeRequests` sync.Map.
