# Flow: Web Server Mode (Mobile/Browser Access)

> The complete journey of running Opcode as a web server for remote access.

---

## Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Start Web   │────►│  Open in     │────►│  Use Claude      │
│  Server      │     │  Browser     │     │  (WebSocket)     │
│  (Terminal)  │     │  (Phone/PC)  │     │                  │
└──────────────┘     └──────────────┘     └──────────────────┘
```

---

## Step 1: Start the Server

**User runs** (in terminal):
```bash
# Default (port 8080)
just web

# Custom port
just web-port 3000

# Or directly:
cd src-tauri && cargo run --bin opcode-web
cd src-tauri && cargo run --bin opcode-web -- --port 3000
```

**What happens**:
```
1. Build React frontend (vite build → dist/)
2. Start Rust binary (opcode-web)
3. Axum server binds to 0.0.0.0:{port}
4. Static file server serves dist/ at /
5. API endpoints registered
6. WebSocket endpoint ready at /ws/claude
7. Console: "Server running at http://0.0.0.0:8080"
```

**To find your IP for phone access**:
```bash
just ip
# Shows: "Use this IP on your phone: http://YOUR_IP:8080"
```

---

## Step 2: Open in Browser

**User navigates to** `http://{ip}:8080` on phone or another device

**What loads**:
- Same React frontend as desktop app
- `apiAdapter.ts` detects non-Tauri environment
- Switches to REST API + WebSocket mode
- All Tauri `invoke()` calls → HTTP `fetch()` calls

### Environment Detection
```typescript
function isTauriEnvironment(): boolean {
  // No window.__TAURI__ in browser
  return false;
}
// All calls route through REST API
```

### Command → Endpoint Mapping
| Tauri Command | REST Endpoint |
|---------------|---------------|
| `list_projects` | `GET /api/projects` |
| `get_project_sessions` | `GET /api/projects/{id}/sessions` |
| `list_agents` | `GET /api/agents` |
| `get_usage_stats` | `GET /api/usage` |
| `get_claude_settings` | `GET /api/settings/claude` |
| `slash_commands_list` | `GET /api/slash-commands` |
| `mcp_list` | `GET /api/mcp/servers` |

---

## Step 3: Start a Claude Session (WebSocket)

**User types a prompt and clicks Send**

**What happens (web mode)**:

### Connection
```
1. Frontend opens WebSocket:
   ws://{host}:{port}/ws/claude

2. Connection established
3. Server assigns session ID, stores sender in HashMap
```

### Send Request
```json
{
  "command_type": "execute",
  "project_path": "/Users/dev/my-project",
  "prompt": "Help me refactor the auth module",
  "model": "sonnet",
  "session_id": null
}
```

### Server Processing
```
1. Parse JSON request
2. Determine command type (execute/continue/resume)
3. Find Claude binary (same discovery as desktop)
4. Build command:
   claude -p "prompt"
     --model sonnet
     --output-format stream-json
     --verbose
     --dangerously-skip-permissions

5. Spawn subprocess with piped stdout/stderr
6. Set CWD to project_path
```

### Streaming Response
```
Server → Client (via WebSocket):

{"type": "start", "message": "Starting Claude execution..."}
{"type": "output", "content": "{\"type\":\"system\",\"subtype\":\"init\",\"session_id\":\"abc123\"}"}
{"type": "output", "content": "{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"Let me look at...\"}]}}"}
{"type": "output", "content": "{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"tool_use\",\"name\":\"Read\",\"input\":{\"file_path\":\"/auth.ts\"}}]}}"}
...
{"type": "completion", "status": "success"}
```

### Frontend Processing
```
WebSocket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'output') {
    // Dispatch as DOM CustomEvent (simulates Tauri event)
    window.dispatchEvent(
      new CustomEvent('claude-output', { detail: data.content })
    );
  }

  if (data.type === 'completion') {
    window.dispatchEvent(
      new CustomEvent('claude-complete', { detail: data })
    );
  }

  if (data.type === 'error') {
    window.dispatchEvent(
      new CustomEvent('claude-error', { detail: data.message })
    );
  }
};
```

---

## API Endpoints Available

| Method | Endpoint | Returns |
|--------|----------|---------|
| GET | `/` | React frontend (static files) |
| GET | `/api/projects` | Project list |
| GET | `/api/projects/{id}/sessions` | Session list |
| GET | `/api/agents` | Agent list (empty in web mode*) |
| GET | `/api/usage` | Usage statistics |
| GET | `/api/settings/claude` | Default settings |
| GET | `/api/slash-commands` | Empty list |
| GET | `/api/mcp/servers` | Empty list |
| WS | `/ws/claude` | WebSocket for Claude execution |
| POST | `/api/sessions/{id}/cancel` | Cancel execution (stub*) |
| GET | `/api/sessions/{id}/output` | Session output |

*Limited functionality in web mode: no SQLite database access, so agents and runs are not available.

---

## Known Limitations (Critical Issues)

### 1. Session Isolation Broken
**Problem**: Events dispatched globally, not per-session
```
// Only dispatches generic event:
window.dispatchEvent(new CustomEvent('claude-output', { detail: message }));

// Should ALSO dispatch:
window.dispatchEvent(new CustomEvent(`claude-output:${sessionId}`, { detail: message }));
```
**Impact**: Multiple concurrent sessions see each other's output.

### 2. Cancel is a No-Op
**Problem**: Cancel endpoint doesn't terminate processes
```rust
async fn cancel_claude_execution(sessionId) {
    println!("[TRACE] Cancel request for: {}", sessionId);
    // Does nothing. Process keeps running.
}
```

### 3. stderr Not Captured
**Problem**: Only stdout is streamed. Claude errors go to stderr and are silently lost.

### 4. No Authentication
**Problem**: Anyone on the network can connect and execute commands.

### 5. `--dangerously-skip-permissions`
**Problem**: All executions bypass Claude's safety checks. Any prompt can do anything.

---

## Security Considerations for Web Mode

| Concern | Status |
|---------|--------|
| Authentication | None |
| CORS | Allow any origin |
| Permission bypass | Always enabled |
| Transport encryption | None (HTTP only) |
| Session isolation | Broken |
| Process management | Incomplete |

**Recommendation**: Web mode is suitable ONLY for trusted local networks during development. Do NOT expose to the internet.
