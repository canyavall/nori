# Flow: Tool Execution & Permission

> How tools are defined, resolved, permission-checked, and executed.

---

## Flow Diagram

```
LLM generates tool_call
        │
        ▼
┌───────────────┐     ┌──────────────┐     ┌───────────────┐
│  Parse Args   │────►│  Check       │────►│   Execute     │
│  (Zod schema) │     │  Permissions │     │   Tool Logic  │
└───────────────┘     └──────┬───────┘     └───────┬───────┘
                             │                     │
                    ┌────────┼────────┐            │
                    ▼        ▼        ▼            ▼
                 allow     deny      ask      Return result
                    │        │        │        to LLM stream
                    │     DeniedErr   │
                    │                 ▼
                    │          ┌────────────┐
                    │          │ User Dialog│
                    │          │ once/always│
                    │          │   /reject  │
                    │          └─────┬──────┘
                    │                │
                    └────────────────┘
```

---

## Step 1: Tool Registration

**On server startup**:
```
1. Register built-in tools (bash, read, write, edit, glob, grep, etc.)
2. Load MCP server tools (converted to AI SDK format)
3. Load plugin tools
4. Load custom tools from config directories:
   - {tool,tools}/*.{js,ts} in .opencode/ directories
5. Filter based on:
   - Model capabilities (apply_patch for GPT, edit for Claude)
   - Provider features (websearch only with Exa)
   - Client type (question tool only for interactive clients)
```

---

## Step 2: Bash Tool (Shell Execution)

**User journey**: LLM decides to run a shell command

**Permission check**: `bash` permission against command pattern

**What happens**:
```
1. LLM generates: tool_call("bash", { command: "npm test" })
2. Parse with tree-sitter (Bash AST)
3. Check permission: rule match for "bash" + "npm test"
4. If allowed → execute:
   a. Spawn process via bun-pty (pseudo-terminal)
   b. Set CWD to project directory
   c. Stream stdout/stderr in real-time
   d. Capture exit code
   e. Truncate output if needed
5. Return: { title: "npm test (exit 0)", output: "stdout content" }
```

---

## Step 3: Edit Tool (File Modification)

**User journey**: LLM decides to edit a file

**Permission check**: `edit` permission against file path

**What happens**:
```
1. LLM generates: tool_call("edit", {
     path: "src/app.ts",
     old_string: "const x = 1",
     new_string: "const x = 2"
   })
2. Check permission: rule match for "edit" + "src/app.ts"
3. If allowed:
   a. Read current file content
   b. Find old_string in file
   c. If not exact match → Levenshtein distance fuzzy match
   d. Replace old_string with new_string
   e. Write file
   f. Notify LSP of change (textDocument/didChange)
   g. Wait 150ms for diagnostics
   h. Report any LSP errors in output
4. Return: { title: "Edit src/app.ts", metadata: { path, diff }, output: "success" }
```

---

## Step 4: Write Tool (File Creation)

**Permission check**: `edit` permission + `external_directory` if outside worktree

```
1. LLM generates: tool_call("write", { path: "new-file.ts", content: "..." })
2. Check permission for "edit" + path
3. If path outside worktree → additional "external_directory" permission
4. Create parent directories if needed
5. Write file content
6. Notify LSP
7. Return result with file info
```

---

## Step 5: Read Tool (File Reading)

**Permission check**: `read` permission (`.env` files always require asking)

```
1. LLM generates: tool_call("read", { path: "src/config.ts", offset: 0, limit: 200 })
2. Check permission: "read" + path
3. Special case: .env files → always "ask" (security)
4. Read file content
5. Truncate to line/byte limits
6. Return: { title: "Read src/config.ts", output: "file content" }
```

---

## Step 6: Task Tool (Subagent Delegation)

**User journey**: LLM needs help with a complex subtask

```
1. LLM generates: tool_call("task", {
     description: "Research authentication patterns",
     prompt: "Find all auth-related code...",
     agent: "explore"
   })
2. Create new subagent execution context
3. Run subagent with its own permission set
4. Subagent can use its allowed tools
5. Subagent returns result to parent
6. Parent LLM continues with result
```

---

## Step 7: Permission Dialog (Client-Side)

**When "ask" action is triggered**:

### TUI
```
┌─────────────────────────────────────┐
│ Permission Request                   │
│                                      │
│ bash: npm test                       │
│                                      │
│ [Allow Once] [Allow Always] [Reject] │
└─────────────────────────────────────┘
```

### Web/Desktop
- Modal dialog with same options
- Shows tool name, arguments, description

**Reply options**:
- **once** → Allow this specific invocation only
- **always** → Store rule in PermissionTable, allow all future matches
- **reject** → DeniedError returned to LLM, also cancels other pending permissions

**Storage** (for "always"):
```sql
INSERT INTO permission (project_id, data, time_created, time_updated)
VALUES (?, json_array(...new rule...), ?, ?)
```
