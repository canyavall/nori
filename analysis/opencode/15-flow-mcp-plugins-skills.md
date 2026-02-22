# Flow: MCP, Plugins & Skills

> How OpenCode extends via external tools, plugins, and skill definitions.

---

## MCP (Model Context Protocol)

### Configuration
```jsonc
// opencode.json
{
  "mcp": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
      "env": { "API_KEY": "..." }
    },
    "remote-server": {
      "url": "https://mcp.example.com/sse",
      "transport": "sse"
    }
  }
}
```

### Transport Types
| Type | Description | Use Case |
|------|-------------|----------|
| **stdio** | Local process, stdin/stdout | Local tools (filesystem, git) |
| **SSE** | Server-Sent Events over HTTP | Remote servers |
| **StreamableHTTP** | HTTP with streaming | Advanced remote servers |

### MCP Lifecycle
```
1. Server starts → read MCP config
2. For each MCP server definition:
   a. Spawn process (stdio) or connect (SSE/HTTP)
   b. Initialize handshake
   c. List available tools
   d. Convert MCP tools to AI SDK format
   e. Register in tool registry
3. Monitor status: connected | disabled | failed | needs_auth
4. On tool change: Bus.publish(MCP.Event.ToolsChanged)
```

### OAuth for MCP Servers
```
1. MCP server returns "needs_auth" status
2. OpenCode opens browser for OAuth login
3. User authenticates
4. Token stored for future use
5. Reconnect with auth token
```

### MCP Tool Execution
```
LLM calls MCP tool → OpenCode converts args → MCP client.callTool()
  → MCP server processes → Returns result → Back to LLM
```

---

## Plugin System

### Plugin Definition
```typescript
// my-plugin.ts
import { Plugin } from "@opencode-ai/plugin"

export default async ({ client, project, directory, worktree, $ }) => ({
  // Custom tools
  tools: [
    {
      name: "deploy",
      description: "Deploy to production",
      parameters: z.object({
        environment: z.enum(["staging", "production"]),
      }),
      execute: async ({ environment }) => {
        const result = await $`./deploy.sh ${environment}`
        return { output: result.stdout }
      }
    }
  ],

  // Custom auth
  auth: [
    {
      name: "my-service",
      type: "oauth",
      prompts: [
        { type: "text", name: "api_key", message: "Enter API key" }
      ],
      validate: async (creds) => creds.api_key.startsWith("sk-"),
    }
  ]
})
```

### Plugin Discovery
```
1. Config: "plugin": ["https://example.com/plugin.ts", "./local-plugin.ts"]
2. .opencode/plugins/ directory
3. Auto-install dependencies (bun install)
4. Load and validate exports
5. Register tools and auth methods
```

### Plugin Context
```typescript
{
  client: OpencodeSDKClient,    // Full SDK access
  project: ProjectInfo,          // Current project
  directory: string,             // Working directory
  worktree: string,              // Git root
  serverUrl: string,             // Server URL for API calls
  $: BunShell,                   // Shell execution helper
}
```

---

## Skill System

### Skill Definition (SKILL.md)
```markdown
---
name: deploy
description: Deploy the application to production
---

# Deploy Instructions

Follow these steps to deploy:

1. Run the test suite first: `npm test`
2. Build production bundle: `npm run build`
3. Deploy using: `./scripts/deploy.sh production`
4. Verify health check at https://api.example.com/health

## Important Notes
- Always check the staging environment first
- Rollback command: `./scripts/rollback.sh`
```

### Skill Discovery
```
Search locations:
  .claude/skills/         (compatibility)
  .agents/skills/         (compatibility)
  .opencode/skills/       (primary)
  config.skills.paths     (custom paths)
  config.skills.urls      (remote URLs)

Pattern: **/SKILL.md
```

### Skill Execution
```
1. User types /deploy or LLM calls skill tool
2. SkillTool looks up skill by name
3. Skill content injected as context
4. LLM follows the instructions
5. Can use all available tools within skill
```

### Skill vs Agent vs Plugin
| Feature | Skill | Agent | Plugin |
|---------|-------|-------|--------|
| Format | Markdown | JSON config | TypeScript |
| Complexity | Low | Medium | High |
| Custom tools | No | No | Yes |
| Custom auth | No | No | Yes |
| Custom prompt | Yes | Yes | No |
| Permission rules | No | Yes | No |
| Invocation | `/name` in chat | Tab to switch | Auto-loaded |

---

## Custom Commands

### Configuration
```jsonc
// opencode.json
{
  "command": {
    "test": {
      "description": "Run test suite",
      "command": "npm test"
    },
    "lint": {
      "description": "Lint code",
      "command": "npm run lint"
    }
  }
}
```

### Discovery
```
.opencode/commands/  directory
opencode.json "command" field
```

### Execution
Available via command palette or CLI: `opencode run test`
