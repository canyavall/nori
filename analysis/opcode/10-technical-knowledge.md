# Opcode - Technical Knowledge Base

> Everything needed to rebuild this system or something similar from scratch.

---

## 1. Claude CLI Binary Discovery

### The Problem
The `claude` CLI can be installed in many locations depending on the method (npm global, homebrew, bun, nvm, manual). The app needs to find and validate it across macOS, Linux, and Windows.

### Discovery Algorithm (Priority Order)
1. **Stored preference** - Check SQLite `app_settings` table for `claude_binary_path`
2. **`which`/`where` command** - System PATH lookup (`which claude` on Unix, `where claude` on Windows)
3. **Parse shell aliases** - Handle output like `claude: aliased to /path/to/claude`
4. **NVM installations** - Iterate `~/.nvm/versions/node/*/bin/claude` + check `NVM_BIN` env var
5. **Standard paths** - Check each of:
   ```
   /usr/local/bin/claude
   /opt/homebrew/bin/claude
   ~/.claude/local/claude
   ~/.local/bin/claude
   ~/.npm-global/bin/claude
   ~/.yarn/bin/claude
   ~/.bun/bin/claude
   ~/bin/claude
   ```

### Version Extraction
```
Regex: (\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?)
Execute: claude --version
Parse: Split by ".", compare numerically part by part
Handle pre-release: "1.0.17-beta" → compare numeric parts, string fallback for suffix
```

### Environment Setup for Spawning
When spawning the `claude` process, inherit only essential env vars:
```
PATH, HOME, USER, SHELL, LANG, LC_*
NODE_PATH, NVM_*, HOMEBREW_*
HTTP_PROXY, HTTPS_PROXY, NO_PROXY, ALL_PROXY
```
If binary is in NVM location, prepend its node bin directory to PATH.
If binary is in Homebrew location, prepend `/opt/homebrew/bin` to PATH.

---

## 2. Claude CLI Command Arguments

### New Session
```bash
claude -p "prompt" --model "sonnet" --output-format "stream-json" --verbose
```

### Continue (Same Session)
```bash
claude -c -p "prompt" --model "sonnet" --output-format "stream-json" --verbose
```

### Resume (By Session ID)
```bash
claude --resume "session-uuid" -p "prompt" --model "sonnet" --output-format "stream-json" --verbose
```

### MCP Commands
```bash
claude mcp list
claude mcp add -s {user|project|local} --transport {stdio|sse} -e KEY=value name -- command args...
claude mcp remove name
```

### Key Flags
- `--output-format stream-json` - JSONL streaming output (one JSON object per line)
- `--verbose` - Include detailed tool output
- `--dangerously-skip-permissions` - Bypass safety checks (opcode uses this everywhere, NOT recommended)
- `-p` - The prompt text
- `-c` - Continue in current session
- `--resume` - Resume specific session by ID

---

## 3. JSONL Session Format

### File Location
```
~/.claude/projects/{encoded_project_path}/{session_id}.jsonl
```

### Path Encoding
Replace `/` with `-` in project path. Example:
```
/Users/test/my-project → -Users-test-my-project
```
Note: This encoding is lossy (`/foo-bar` vs `/foo/bar`). Opcode mitigates by reading `cwd` from JSONL entries.

### JSONL Message Structure
Each line is an independent JSON object:
```json
{
  "type": "system|user|assistant|result",
  "subtype": "init|...",
  "timestamp": "2024-01-15T10:30:00Z",
  "cwd": "/Users/test/my-project",
  "sessionId": "uuid",
  "requestId": "uuid",
  "costUSD": 0.003,
  "message": {
    "role": "user|assistant",
    "model": "claude-sonnet-4-20250514",
    "content": [
      {"type": "text", "text": "Hello world"},
      {"type": "tool_use", "id": "toolu_xxx", "name": "Read", "input": {"file_path": "/foo"}},
      {"type": "tool_result", "tool_use_id": "toolu_xxx", "content": "file contents..."}
    ],
    "usage": {
      "input_tokens": 1500,
      "output_tokens": 300,
      "cache_creation_input_tokens": 0,
      "cache_read_input_tokens": 500
    }
  }
}
```

### Session ID Extraction
The first system message with `subtype: "init"` contains the real `session_id`. This may differ from the one passed in `--resume`.

### Token Counting
Tokens can appear in two locations:
- `message.usage` (on assistant messages)
- Top-level `usage` (on result messages)

Formula: `input_tokens + output_tokens + cache_creation_input_tokens + cache_read_input_tokens`

---

## 4. Process Lifecycle Management

### Data Model
```
ProcessRegistry {
  processes: HashMap<run_id, ProcessHandle>
  next_id: starts at 1,000,000
}

ProcessHandle {
  info: ProcessInfo { run_id, pid, started_at, project_path, task, model }
  child: Arc<Mutex<Option<tokio::process::Child>>>
  live_output: Arc<Mutex<String>>
}
```

### Spawn Flow
1. Create `tokio::process::Command` with piped stdout/stderr
2. Set working directory to project path
3. Set environment variables (see section 1)
4. Spawn process, get Child handle
5. Store in ProcessRegistry with unique run_id
6. Spawn async task to read stdout line-by-line
7. Each line appended to `live_output` buffer
8. Extract session_id from init message in stream

### Kill Flow
1. Try `child.start_kill()` (sends SIGTERM on Unix)
2. Wait up to 5 seconds for graceful exit (poll every 100ms)
3. If still alive, send SIGKILL: `libc::kill(pid, libc::SIGKILL)` (Unix) or `taskkill /F /PID` (Windows)
4. Remove from registry
5. Update database status to "cancelled"

### Event Emission
Emit both generic and session-specific events:
```
claude-output + claude-output:{sessionId}
claude-error + claude-error:{sessionId}
claude-complete + claude-complete:{sessionId}
claude-cancelled + claude-cancelled:{sessionId}
```

---

## 5. Content-Addressable Checkpoint Storage

### Directory Layout
```
~/.claude/projects/{project_id}/.timelines/{session_id}/
├── timeline.json
├── checkpoints/
│   └── {checkpoint_id}/
│       ├── metadata.json
│       └── messages.jsonl.zstd      (zstandard compressed)
└── files/
    ├── content_pool/
    │   └── {sha256_hash}            (zstd compressed file content)
    └── refs/
        └── {checkpoint_id}/
            └── {sanitized_filename}.json   (metadata reference)
```

### Storage Algorithm (Create Checkpoint)
```
1. For each tracked file:
   a. Read file content
   b. Calculate SHA-256 hash
   c. Check if content_pool/{hash} exists
   d. If not: compress with zstd (level 3), write to content_pool/{hash}
   e. Write reference JSON to refs/{checkpoint_id}/{sanitized_name}.json:
      { path, hash, is_deleted, permissions (unix mode), size }

2. Compress session messages (JSONL) with zstd, write to messages.jsonl.zstd

3. Write checkpoint metadata:
   { id, session_id, project_id, message_index, timestamp, description,
     parent_checkpoint_id, metadata: { total_tokens, model_used, user_prompt,
     file_changes, snapshot_size } }

4. Update timeline.json tree structure (add node to current branch)
```

### Restore Algorithm
```
1. Read checkpoint metadata
2. For each file reference in refs/{checkpoint_id}/:
   a. Read reference JSON (get hash, path, permissions)
   b. Read content_pool/{hash}
   c. Decompress with zstd
   d. Write to original file path
   e. Restore Unix permissions if stored
3. Decompress messages.jsonl.zstd
4. Return messages to frontend for display
```

### Deduplication
Files with identical content share the same hash in `content_pool/`. If 10 checkpoints all have the same `package.json`, it's stored once.

### Garbage Collection
```
1. Collect all hashes referenced by all refs/ in all checkpoints
2. List all files in content_pool/
3. Delete content_pool files not in referenced set
```

### File Name Sanitization
Replace `/` and `\` with `_` for checkpoint reference filenames.

### File Change Tracking
```
FileState {
  path: PathBuf,
  last_hash: Option<String>,     (SHA-256)
  is_modified: bool,
  last_modified: Option<DateTime>,
  exists: bool
}
```

Detection triggers:
- Tool operations: `edit`, `write`, `multiedit`, `bash`
- Bash side-effects: `echo >`, `cat >`, `cp`, `mv`, `rm`, `touch`, `sed`, `awk`, `npm`, `yarn`, `cargo`, `make`

### Auto-Checkpoint Strategies
- **Manual**: Only when user clicks "Create Checkpoint"
- **PerPrompt**: After every user message
- **PerToolUse**: After any message containing `tool_use` in content array
- **Smart**: After destructive tools only (write, edit, multiedit, bash with file keywords)

### Timeline Tree Structure
```json
{
  "session_id": "uuid",
  "root_node": {
    "checkpoint_id": "uuid",
    "children": [
      {
        "checkpoint_id": "uuid2",
        "children": []
      },
      {
        "checkpoint_id": "uuid3",  // fork branch
        "children": [...]
      }
    ]
  },
  "current_checkpoint_id": "uuid2",
  "auto_checkpoint_enabled": true,
  "checkpoint_strategy": "smart",
  "total_checkpoints": 5
}
```

---

## 6. Agent System

### Database Schema
```sql
CREATE TABLE agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'bot',
  system_prompt TEXT NOT NULL,
  default_task TEXT,
  model TEXT DEFAULT 'sonnet',
  enable_file_read BOOLEAN DEFAULT 1,
  enable_file_write BOOLEAN DEFAULT 1,
  enable_network BOOLEAN DEFAULT 0,
  hooks TEXT,                          -- JSON string
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agent_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL,
  agent_name TEXT NOT NULL,
  agent_icon TEXT NOT NULL,
  task TEXT NOT NULL,
  model TEXT NOT NULL,
  project_path TEXT NOT NULL,
  session_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',       -- pending|running|completed|failed|cancelled
  pid INTEGER,
  process_started_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);
```

### Agent Execution Flow
```
1. Insert agent_run record (status='pending')
2. Build system prompt: agent.system_prompt + "\n\nTask: " + task
3. Create Claude command with system prompt as -p argument
4. Set model from agent.model
5. Spawn via ProcessRegistry
6. Update agent_run: status='running', pid=process.pid
7. Stream stdout via event emission
8. On completion:
   a. Parse JSONL from ~/.claude/projects/{path}/{session_id}.jsonl
   b. Calculate metrics (duration, tokens, cost)
   c. Update agent_run: status='completed', completed_at=now
```

### Export Format (.opcode.json)
```json
{
  "version": 1,
  "exported_at": "2024-01-15T10:30:00Z",
  "agent": {
    "name": "Security Scanner",
    "icon": "shield",
    "model": "opus",
    "system_prompt": "You are a security expert...",
    "default_task": "Review the codebase for security issues"
  }
}
```

### Available Icons
```
bot, code, terminal, database, globe, shield,
file-text, git-branch, search, zap, brain, wrench
```

### Metrics Calculation from JSONL
```
Duration:    last_entry.timestamp - first_entry.timestamp
Tokens:      sum(input_tokens + output_tokens + cache_tokens) for all entries
Messages:    count of JSONL lines
Cost:        sum(tokens * model_pricing) per model
```

---

## 7. Usage Tracking & Cost Calculation

### Model Pricing (per million tokens)
```
                Input    Output    CacheWrite    CacheRead
Opus 4:         $15      $75       $18.75        $1.50
Sonnet 4:       $3       $15       $3.75         $0.30
```

### Cost Formula
```
cost = (input_tokens * input_price / 1_000_000)
     + (output_tokens * output_price / 1_000_000)
     + (cache_creation_tokens * cache_write_price / 1_000_000)
     + (cache_read_tokens * cache_read_price / 1_000_000)
```

### Usage Aggregation Algorithm
```
1. Walk ~/.claude/projects/ recursively for all .jsonl files
2. Extract project path from directory name (decode - back to /)
3. For each JSONL file:
   a. Parse each line as JSON
   b. Extract usage from message.usage or top-level usage
   c. Skip entries with zero tokens
   d. Deduplicate by (message content hash + request_id)
4. Aggregate by: model, date, project
5. Sort by earliest timestamp
```

### Usage Entry
```
UsageEntry {
  timestamp, model,
  input_tokens, output_tokens,
  cache_creation_tokens, cache_read_tokens,
  cost, session_id, project_path
}
```

---

## 8. MCP Server Configuration

### Config File Locations
```
User scope:    ~/.claude/settings.json
Project scope: {project}/.claude/settings.json
Local scope:   {project}/.claude/settings.local.json
```

### Config Format (inside settings.json)
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
      "env": {
        "API_KEY": "value"
      }
    }
  }
}
```

### Server Types
- **stdio**: Local process, communicates via stdin/stdout
- **sse**: Remote server, communicates via Server-Sent Events URL

---

## 9. WebSocket Streaming (Web Server Mode)

### Architecture
```
Axum Server (0.0.0.0:8080)
├── GET  /              → Serve React frontend (dist/)
├── GET  /api/projects  → List projects
├── GET  /api/agents    → List agents (empty in web mode)
├── GET  /api/usage     → Usage stats
├── GET  /ws/claude     → WebSocket upgrade
└── Static files        → dist/ directory
```

### WebSocket Protocol
```
Client → Server:
{
  "command_type": "execute|continue|resume",
  "project_path": "/path",
  "prompt": "user prompt",
  "model": "sonnet",
  "session_id": "uuid"  (for resume)
}

Server → Client:
{"type": "start", "message": "Starting..."}
{"type": "output", "content": "{jsonl line from claude}"}
{"type": "output", "content": "{another line}"}
{"type": "completion", "status": "success"}
  or
{"type": "error", "message": "error description"}
```

### Implementation Pattern
```
1. Accept WebSocket upgrade
2. Split into sender + receiver
3. Create mpsc::channel(100) for buffering
4. Store session in HashMap<session_id, sender>
5. Spawn forwarding task: channel → WebSocket
6. Loop on receiver: parse JSON requests
7. For each request: spawn Claude process, read output, send to channel
8. On disconnect: cleanup session from HashMap
```

---

## 10. Tauri IPC Command Registration

### Pattern
All 92 commands registered in `main.rs`:
```rust
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        list_projects,
        create_project,
        execute_claude_code,
        // ... 89 more
    ])
```

### Command Signature Pattern
```rust
#[tauri::command]
async fn command_name(
    app: tauri::AppHandle,
    state: tauri::State<'_, SharedState>,
    param1: String,
    param2: Option<String>,
) -> Result<ReturnType, String> {
    // Implementation
    Ok(result)
}
```

### Shared State Pattern
```rust
struct AppState {
    db: Mutex<Connection>,
    checkpoint_state: Arc<RwLock<CheckpointState>>,
    process_registry: Arc<ProcessRegistry>,
}
type SharedState = Arc<AppState>;
```

---

## 11. Dual-Mode API Adapter (Frontend)

### Environment Detection
```typescript
function isTauriEnvironment(): boolean {
  return !!(window as any).__TAURI__;
}
```

### Unified API Call
```typescript
async function apiCall<T>(command: string, params?: Record<string, any>): Promise<T> {
  if (isTauriEnvironment()) {
    return await invoke<T>(command, params);
  } else {
    const endpoint = mapCommandToEndpoint(command);
    const response = await fetch(endpoint, { method: 'GET', ... });
    return response.json();
  }
}
```

### Streaming in Web Mode
```typescript
// Open WebSocket
const ws = new WebSocket(`ws://${location.host}/ws/claude`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Dispatch as DOM CustomEvent (simulates Tauri events)
  window.dispatchEvent(new CustomEvent('claude-output', { detail: data }));
};
```

---

## 12. Hooks System

### Config Location
```
User:    ~/.claude/settings.json → hooks
Project: {project}/.claude/settings.json → hooks
Local:   {project}/.claude/settings.local.json → hooks
```

### Hook Validation
```bash
bash -n -c "{command}"   # Syntax check without execution
```

### Hook Format in settings.json
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Running bash tool'"
          }
        ]
      }
    ]
  }
}
```

---

## 13. Analytics Patterns (PostHog)

### PII Sanitization
Before sending any event:
- Mask file paths: `/Users/name/project/file.ts` → `***/***/project/file.ts`
- Remove API keys: Any 32+ character alphanumeric strings → `[REDACTED]`
- Sanitize emails: `user@domain.com` → `[EMAIL]`
- Mask project paths in all nested objects

### Event Batching
- Events queued in memory array
- Flushed every 5 seconds or on page unload
- Consent check before every flush

### Consent Flow
```typescript
const hasConsent = localStorage.getItem('analytics_consent') === 'true';
if (!hasConsent) return; // Don't track anything
```

---

## 14. Tab Persistence

### Storage Key
```
localStorage: 'opcode_tabs'
```

### Persistence Strategy
- Debounced save (500ms after last change)
- Immediate save on `window.beforeunload`
- Restore on app mount
- Max 20 tabs enforced

### Tab Data Model
```typescript
Tab {
  id: string,
  type: 'chat' | 'agent' | 'agents' | 'projects' | 'usage' | 'mcp' | 'settings',
  title: string,
  sessionId?: string,
  agentRunId?: string,
  status: 'active' | 'idle' | 'running' | 'complete' | 'error',
  hasUnsavedChanges: boolean,
  createdAt: Date,
  updatedAt: Date
}
```
