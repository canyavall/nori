# OpenCode - Technical Knowledge Base

> Everything needed to rebuild this system or something similar from scratch.

---

## 1. Server Architecture (Hono + Bun)

### Core Pattern
```typescript
// Hono app with OpenAPI documentation
const app = new Hono()
  .use(cors({ origin: dynamicWhitelist }))
  .use(basicAuth({ OPENCODE_SERVER_PASSWORD }))
  .route("/session", SessionRoutes)
  .route("/event", EventRoutes)  // SSE
  // ... more routes

// Start server
Bun.serve({ port: 4096, fetch: app.fetch })
```

### SSE Event Streaming
```typescript
// Server: publish events
Bus.publish(Session.Event.Updated, { sessionID, ... })

// SSE endpoint
app.get("/event", (c) => {
  return streamSSE(c, async (stream) => {
    const unsub = Bus.subscribeAll((event) => {
      stream.writeSSE({ data: JSON.stringify(event) })
    })
    // Heartbeat every 10 seconds
    const interval = setInterval(() => {
      stream.writeSSE({ data: JSON.stringify({ type: "heartbeat" }) })
    }, 10_000)
  })
})

// Client: consume events
const eventSource = new EventSource(`${serverUrl}/event`)
eventSource.onmessage = (e) => {
  const event = JSON.parse(e.data)
  store.reconcile(event)
}
```

### Event Batching (Client-Side)
```typescript
// Batch SSE events into single SolidJS render (16ms debounce)
let pending: BusEvent[] = []
let timer: number | null = null

function onEvent(event: BusEvent) {
  pending.push(event)
  if (!timer) {
    timer = setTimeout(() => {
      batch(() => pending.forEach(process))
      pending = []
      timer = null
    }, 16)
  }
}
```

---

## 2. Tool System

### Tool Definition
```typescript
const MyTool: Tool.Info = {
  id: "my_tool",
  init: async (ctx) => ({
    description: "Does something",
    parameters: z.object({
      path: z.string().describe("File path"),
      content: z.string().optional(),
    }),
    execute: async (args, toolCtx) => {
      // Check permissions
      await toolCtx.ask({
        permission: "edit",
        pattern: args.path,
        description: `Edit ${args.path}`,
      })

      // Do work...
      return {
        title: `Edited ${args.path}`,
        metadata: { path: args.path },
        output: "File edited successfully",
      }
    },
  }),
}
```

### Built-in Tools
| Tool | Permission | Description |
|------|-----------|-------------|
| `bash` | `bash` | Shell execution with tree-sitter parsing |
| `read` | `read` | File reading (line/byte truncation) |
| `write` | `edit` | File creation/writing |
| `edit` | `edit` | File editing with Levenshtein matching |
| `apply_patch` | `edit` | Apply unified diffs (GPT models) |
| `glob` | none | File pattern matching (Bun.Glob) |
| `grep` | none | Regex code search |
| `webfetch` | `webfetch` | HTTP requests → markdown |
| `websearch` | `websearch` | Search engine (Exa-based) |
| `codesearch` | `codesearch` | Semantic code search |
| `task` | none | Subagent task delegation |
| `todoread` | `todoread` | Read task list |
| `todowrite` | `todowrite` | Update task list |
| `question` | `question` | Ask user a question |
| `skill` | none | Invoke defined skills |
| `lsp` | none | LSP queries (experimental) |
| `batch` | none | Batch operations (experimental) |

### Tool Output Truncation
```
MAX_LINES: ~10,000
MAX_BYTES: ~200KB
Strategy: Truncate content, store full output in filesystem
Reference: outputPath points to full file
```

### Tool Filtering
- `apply_patch` used instead of `edit`/`write` for GPT-based models
- `codesearch`/`websearch` only for "opencode" provider or with `OPENCODE_ENABLE_EXA`
- `question` only for app/cli/desktop clients

---

## 3. Agent System

### Agent Definition
```typescript
const Agent = {
  name: "build",
  description: "Default agent for development work",
  mode: "primary",     // "primary" | "subagent" | "all"
  native: true,
  permission: [
    { permission: "edit", pattern: ".env", action: "ask" },
    { permission: "*", pattern: "*", action: "allow" },
  ],
  model: { modelID: "claude-sonnet-4-20250514", providerID: "anthropic" },
  temperature: undefined,
  topP: undefined,
  steps: undefined,    // Max tool iterations
}
```

### Built-in Agents
| Name | Mode | Access | Purpose |
|------|------|--------|---------|
| `build` | primary | Full | Default development agent |
| `plan` | primary | Read-only | Code exploration, planning |
| `general` | subagent | Full (no todos) | Research, multi-step tasks |
| `explore` | subagent | Read-only | Codebase exploration |
| `compaction` | primary (hidden) | None | Session compaction |
| `title` | primary (hidden) | None | Title generation |
| `summary` | primary (hidden) | None | Summary generation |

### Agent Resolution
1. Native agents (built-in)
2. Config file agents (`opencode.json`)
3. Plugin agents
4. Custom agents from `.opencode/agents/`

---

## 4. Permission System

### Rule Structure
```typescript
Rule {
  permission: string   // "bash", "edit", "read", "external_directory", "*"
  pattern: string      // Glob pattern or literal: "rm *", "*.env", "/etc/*"
  action: "allow" | "deny" | "ask"
}
```

### Evaluation Algorithm
```
1. Expand pattern: ~ → home dir, $VAR → env value
2. For each rule in ruleset (ordered):
   a. Match permission type
   b. Match pattern using Wildcard.match()
   c. If matched → return action
3. No match → default "ask"
```

### Permission Flow
```
Tool requests permission → ctx.ask()
  │
  ├─ "allow" rule matches → Execute immediately
  ├─ "deny" rule matches → DeniedError (abort tool)
  └─ "ask" rule matches →
       Bus.publish(Permission.Event.Asked)
       │
       └─ Client shows dialog → User replies:
            ├─ "once" → Allow this invocation only
            ├─ "always" → Store rule, allow future matches
            └─ "reject" → DeniedError, cancel pending
```

### Doom Loop Detection
```
3 identical consecutive tool calls with same input → trigger "doom_loop" permission
```

---

## 5. LLM Streaming (Vercel AI SDK)

### Stream Processing
```typescript
const stream = await streamText({
  model: provider.model(modelID),
  system: systemPrompt,
  messages: conversationHistory,
  tools: toolDefinitions,
  toolChoice: "auto",
  temperature, topP, maxTokens,
  headers: providerHeaders,
  experimental_repairToolCall: autoRepair,
})

for await (const chunk of stream.fullStream) {
  switch (chunk.type) {
    case "text-delta":
      // Append text to current message part
      await Session.appendText(partID, chunk.textDelta)
      break

    case "tool-call":
      // Execute tool with permission checking
      const result = await executeTool(chunk.toolName, chunk.args, ctx)
      // Store result in database
      await Session.updatePart(partID, { output: result, status: "completed" })
      break

    case "reasoning-delta":
      // Extended thinking (Claude)
      await Session.appendReasoning(partID, chunk.textDelta)
      break
  }
}
```

### System Prompt Construction
```
1. Agent-specific prompt (if defined)
2. Provider default instructions
3. Plugin hooks (experimental.chat.system.transform)
4. Message-specific system (user message.system field)
5. Two-part structure for prompt caching (header stable, tail changes)
```

### Auto-Repair for Tool Names
```typescript
experimental_repairToolCall: (failed) => {
  // Case-insensitive fuzzy match against registered tool names
  const match = tools.find(t => t.toLowerCase() === failed.toolName.toLowerCase())
  return match ? { ...failed, toolName: match } : null
}
```

---

## 6. Session Management

### Session Data Model
```
Session {
  id, slug, projectID, directory
  parentID       (for forked sessions)
  title
  version        (schema version)
  summary: { additions, deletions, files, diffs[] }
  share: { url }
  permission     (override ruleset)
  revert: { messageID, partID, snapshot, diff }
  time: { created, updated, compacting, archived }
}
```

### Message/Part Structure
```
Message {
  id, sessionID
  role: "user" | "assistant"
  agent         (which agent handled this)
  usage         (token counts)
  error         (if failed)
  time: { start, end }
}

Part (types):
  TextPart       - Assistant text output
  ReasoningPart  - Extended thinking (Claude)
  ToolPart       - Tool call + result + metadata
  SnapshotPart   - File state snapshot
  PatchPart      - Unified diff
  FilePart       - File attachments
  AgentPart      - Subagent invocation
  CompactionPart - Session compaction marker
```

### Session Lifecycle
```
create → messages → [compaction] → [fork] → [revert] → [archive]
```

### Compaction
When context grows too large:
1. Hidden "compaction" agent summarizes older messages
2. CompactionPart inserted as marker
3. Older messages still in DB but not sent to LLM
4. Preserves context while managing token limits

---

## 7. Database (Drizzle + SQLite)

### Pragmas (Performance)
```sql
PRAGMA journal_mode = WAL
PRAGMA synchronous = NORMAL
PRAGMA busy_timeout = 5000
PRAGMA cache_size = -64000    -- 64MB
PRAGMA foreign_keys = ON
```

### Tables
```
session          (id, project_id, parent_id, slug, title, version, summary, time_*)
message          (id, session_id, time_*, data JSON)
part             (id, message_id, session_id, time_*, data JSON)
todo             (session_id, content, status, priority, position, time_*)
permission       (project_id, data JSON, time_*)
project          (id, worktree, name, icon, commands, sandboxes, time_*)
session_share    (share links)
control_account  (admin settings)
```

### Migration System
```
migration/
  {timestamp}/
    migration.sql
Applied in timestamp order, tracked in internal migration table.
```

---

## 8. MCP Integration

### Transport Types
- **stdio** — Local process, stdin/stdout
- **SSE** — Server-Sent Events over HTTP
- **StreamableHTTP** — HTTP with streaming

### MCP Tool → AI SDK Tool Conversion
```typescript
function convertMcpTool(mcpTool) {
  return {
    description: mcpTool.description,
    parameters: jsonSchema(mcpTool.inputSchema),
    execute: (args) => client.callTool({ name: mcpTool.name, arguments: args })
  }
}
```

### MCP Server States
`connected | disabled | failed | needs_auth | needs_client_registration`

### OAuth Support
MCP servers can require OAuth. OpenCode handles:
1. Browser-based OAuth login
2. Token storage for reuse
3. Automatic refresh

---

## 9. Configuration Format

### opencode.json / opencode.jsonc
```jsonc
{
  "$schema": "https://opencode.ai/schema.json",
  // Custom agents
  "agent": {
    "my-agent": {
      "name": "My Agent",
      "description": "Custom agent",
      "mode": "primary",
      "permission": [
        { "permission": "edit", "pattern": "*", "action": "allow" }
      ]
    }
  },
  // Custom commands
  "command": { ... },
  // Plugins (URLs)
  "plugin": ["https://example.com/plugin.ts"],
  // System prompt additions
  "instructions": ["Always use TypeScript"],
  // Provider overrides
  "provider": {
    "anthropic": { "options": { ... } }
  },
  // Permission overrides
  "permission": {
    "bash": { "allow": ["npm test"], "deny": ["rm -rf"] }
  },
  // MCP servers
  "mcp": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {}
    }
  },
  // Skills
  "skills": {
    "paths": [".opencode/skills"],
    "urls": ["https://example.com/skill.md"]
  }
}
```

### Auto-Discovery Directories
```
.opencode/
├── agents/       Agent overrides
├── commands/     Custom commands
├── plugins/      Plugin files
└── skills/       Skill definitions (SKILL.md)
```

---

## 10. Skill System

### Skill File Format (SKILL.md)
```markdown
---
name: deploy
description: Deploy the application to production
---

# Deploy

1. Run the test suite to make sure everything passes
2. Build the production bundle
3. Deploy to the server using the deploy script
4. Verify the deployment is healthy
```

### Discovery
```
Search: .claude/skills/, .agents/skills/, .opencode/skills/, config.skills.paths
Pattern: **/SKILL.md
Parsing: YAML frontmatter → Zod validation → Register
```

---

## 11. Plugin System

### Plugin Interface
```typescript
import { Plugin } from "@opencode-ai/plugin"

export default async ({ client, project, directory, $ }) => ({
  tools: [
    {
      name: "my_tool",
      description: "Custom tool",
      parameters: z.object({ ... }),
      execute: async (args) => { ... }
    }
  ],
  auth: [
    {
      name: "my_service",
      type: "oauth",
      prompts: [{ type: "text", name: "api_key", message: "Enter API key" }],
      validate: async (credentials) => true,
    }
  ]
})
```

---

## 12. LSP Integration

### Startup
```
1. Detect language from project files
2. Find LSP binary (tsserver, pyright, gopls, rust-analyzer)
3. Spawn LSP process (stdio transport)
4. Initialize handshake (capabilities, workspace folders)
5. Open tracked files
6. Listen for diagnostics
```

### Edit Tool Integration
```
After file edit:
1. Notify LSP of change (textDocument/didChange)
2. Wait 150ms (debounce)
3. Collect diagnostics
4. Report errors to LLM for auto-fix
```

---

## 13. TUI Architecture (OpenTUI)

### Unique Pattern: SolidJS → Terminal
```typescript
import { render } from "@opentui/solid"

render(() => <App />, {
  fps: 60,
  // Renders SolidJS reactive components to ANSI escape sequences
  // Full reactive system (signals, effects, memos) works in terminal
})
```

### Terminal Features
- Background color auto-detection (ANSI 11 query)
- Windows Ctrl+C guard
- Selection mode with clipboard
- Console stdout interception during TUI
- Keyboard event capture (raw mode)

---

## 14. Snapshot & Diff System

### File Diff Structure
```typescript
Snapshot.FileDiff {
  file: string      // File path
  before: string    // Original content
  after: string     // Modified content
  additions: number
  deletions: number
  status: "added" | "deleted" | "modified"
}
```

### Session Summary
After tool executions that modify files:
```
summary: {
  additions: totalLinesAdded,
  deletions: totalLinesDeleted,
  files: fileCount,
  diffs: FileDiff[]
}
```

---

## 15. SDK Generation

### OpenAPI → TypeScript Client
```bash
./packages/sdk/js/script/build.ts
# Reads: packages/sdk/openapi.json (auto-generated from Hono routes)
# Generates: packages/sdk/js/src/v2/gen/
#   - client/     (fetch client)
#   - types.gen.ts (TypeScript types)
#   - sdk.gen.ts   (SDK methods)
```

### Client Usage
```typescript
import { createOpencodeClient } from "@opencode-ai/sdk/v2/client"

const client = createOpencodeClient({
  baseUrl: "http://localhost:4096",
  headers: { "x-opencode-directory": "/path/to/project" },
})

const sessions = await client.GET("/session")
const events = new EventSource(`${baseUrl}/event`)
```
