# Flow: MCP Server Management

> The complete journey of adding, configuring, testing, and removing Model Context Protocol servers.

---

## Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  MCP Server  │────►│  Add Server  │────►│  Test Connection  │
│  List        │     │  (Form/JSON) │     │                   │
└──────┬───────┘     └──────────────┘     └──────────────────┘
       │
       ├───► Import from Claude Desktop
       ├───► Import from JSON
       └───► Remove Server
```

---

## Step 1: View MCP Server List

**User action**: Opens MCP Manager (from titlebar or settings)

**What happens**:
```
1. api.mcpList()
   │
   ▼
2. Backend:
   a. Execute: claude mcp list
   b. Parse output (table format or JSON)
   c. Read settings files for additional config:
      - ~/.claude/settings.json (user scope)
      - {project}/.claude/settings.json (project scope)
      - {project}/.claude/settings.local.json (local scope)
   d. Merge into unified server list
   │
   ▼
3. Frontend renders MCPServerList
```

**User sees**: Tab-based interface
- **Servers tab**: List of configured servers
- **Add tab**: Form to add new server
- **Import/Export tab**: Bulk operations

**Each server card shows**:
- Server name
- Transport type (stdio / sse)
- Command (for stdio) or URL (for sse)
- Scope badge (user / project / local)
- Status indicator (connected / disconnected / unknown)
- Remove button

---

## Step 2: Add Server (Form)

**User action**: Clicks "Add" tab

**User sees**: Form with fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | Text | Yes | Unique identifier |
| Transport | Select | Yes | "stdio" or "sse" |
| Command | Text | Yes (stdio) | e.g., "npx" |
| Arguments | Text array | No | e.g., ["-y", "@modelcontextprotocol/server-filesystem"] |
| URL | Text | Yes (sse) | e.g., "http://localhost:3000/sse" |
| Environment | Key-value pairs | No | e.g., API_KEY=xxx |
| Scope | Select | Yes | "user", "project", "local" |

**On submit**:
```
1. api.mcpAdd(name, transport, command, args, env, url, scope)
   │
   ▼
2. Backend:
   a. Build Claude command:
      claude mcp add -s {scope} --transport {transport}
        [-e KEY1=value1 -e KEY2=value2]
        {name}
        [-- {command} {args...}]
   b. Execute command
   c. Verify: claude mcp list (confirm added)
   │
   ▼
3. Frontend:
   - Refresh server list
   - Toast: "Server added"
   - Switch to Servers tab
```

---

## Step 3: Add Server (Raw JSON)

**User action**: Clicks "Add from JSON" option

**User sees**: JSON textarea

**Expected format**:
```json
{
  "name": "filesystem",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
  "env": {
    "API_KEY": "value"
  }
}
```

**On submit**:
```
api.mcpAddJson(jsonString, scope)
→ Backend parses JSON, calls same `claude mcp add` command
```

---

## Step 4: Import from Claude Desktop

**User action**: Clicks "Import from Claude Desktop"

**What happens**:
```
1. api.mcpAddFromClaudeDesktop()
   │
   ▼
2. Backend:
   a. Read Claude Desktop config:
      macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
      Windows: %APPDATA%/Claude/claude_desktop_config.json
      Linux: ~/.config/Claude/claude_desktop_config.json
   b. Parse mcpServers section
   c. For each server:
      - Execute: claude mcp add -s user {name} -- {command} {args}
      - Pass environment variables with -e flags
   d. Return count of imported servers
   │
   ▼
3. Frontend:
   - Refresh server list
   - Toast: "Imported N servers from Claude Desktop"
```

---

## Step 5: Test Connection

**User action**: Clicks "Test" button on a server card

**What happens**:
```
1. api.mcpTestConnection(serverName)
   │
   ▼
2. Backend:
   a. For stdio servers:
      - Spawn the command
      - Send initialize request via stdin
      - Wait for response (with timeout)
      - Check for valid MCP protocol response
   b. For SSE servers:
      - HTTP GET to server URL
      - Check for valid SSE endpoint response
   c. Return: { connected: boolean, error?: string }
   │
   ▼
3. Frontend:
   - Green checkmark if connected
   - Red X with error message if failed
   - Toast with result
```

**Note**: In current implementation, status checking returns mock data (TODO in code). Full implementation would require actually spawning/connecting to the server.

---

## Step 6: Remove Server

**User action**: Clicks remove button on server card

**Flow**:
1. Confirmation: "Remove MCP server '{name}'?"
2. User confirms
3. `api.mcpRemove(serverName)` called
4. Backend executes: `claude mcp remove {name}`
5. Server list refreshes
6. Toast: "Server removed"

---

## Step 7: Project-Specific MCP Config

**User action**: Configures MCP for a specific project (from Project Settings)

**User sees**: MCP section in project settings

**What happens**:
```
1. api.mcpReadProjectConfig(projectPath)
   │
   ▼
2. Backend reads: {projectPath}/.claude/settings.json
   Extracts mcpServers section
   │
   ▼
3. User edits servers (add/remove)
   │
   ▼
4. api.mcpSaveProjectConfig(projectPath, config)
   │
   ▼
5. Backend writes updated mcpServers to:
   {projectPath}/.claude/settings.json
```

### Config File Format
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
      "env": {
        "API_KEY": "value"
      }
    },
    "another-server": {
      "command": "python",
      "args": ["-m", "mcp_server"],
      "env": {}
    }
  }
}
```

### Scope Hierarchy
```
Local scope (machine-specific)     → {project}/.claude/settings.local.json
  ↓ overrides
Project scope (shared in repo)     → {project}/.claude/settings.json
  ↓ overrides
User scope (global per user)       → ~/.claude/settings.json
```
