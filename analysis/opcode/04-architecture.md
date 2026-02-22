# Opcode - Architecture

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Opcode Desktop App                        │
│                                                               │
│  ┌─────────────────────┐    IPC (92 cmds)   ┌──────────────┐│
│  │   React Frontend    │◄──────────────────►│ Rust Backend  ││
│  │                     │                     │              ││
│  │ - Zustand stores    │   Tauri Events      │ - Commands   ││
│  │ - Tab management    │◄───────────────────│ - Process mgr││
│  │ - Analytics (PH)    │   (streaming)       │ - Checkpoint ││
│  │ - Radix UI          │                     │ - SQLite DB  ││
│  └─────────────────────┘                     └──────┬───────┘│
│                                                      │        │
└──────────────────────────────────────────────────────┼────────┘
                                                       │
                              ┌─────────────────────────┼──────────────┐
                              │                         │              │
                        ┌─────▼─────┐            ┌──────▼─────┐  ┌────▼────┐
                        │ claude CLI│            │ SQLite DB  │  │  Disk   │
                        │ (subprocess)           │ agents.db  │  │ Storage │
                        │           │            │            │  │         │
                        │ stdin/out │            │ - agents   │  │ ~/.claude│
                        │ streaming │            │ - runs     │  │ sessions│
                        └───────────┘            │ - settings │  │ ckpts  │
                                                 └────────────┘  └─────────┘
```

## Frontend Architecture

```
App.tsx
├── ThemeProvider (context)
├── OutputCacheProvider (context)
├── TabProvider (context)
│   └── AppContent
│       ├── CustomTitlebar
│       ├── TabManager (tab bar)
│       └── TabContent (renders active tab)
│           ├── ClaudeCodeSession (interactive chat)
│           │   ├── SessionHeader
│           │   ├── MessageList (virtualized)
│           │   ├── FloatingPromptInput
│           │   ├── TimelineNavigator
│           │   └── SlashCommandPicker
│           ├── CCAgents (agent management)
│           │   ├── CreateAgent
│           │   ├── AgentExecution
│           │   └── GitHubAgentBrowser
│           ├── UsageDashboard
│           ├── MCPManager
│           ├── Settings
│           └── ProjectList / SessionList
```

### State Management

- **TabContext**: Tab lifecycle (max 20 tabs), persistence to localStorage
- **ThemeContext**: Theme selection (dark/gray/light/custom), CSS variable injection
- **sessionStore (Zustand)**: Projects, sessions, current session, outputs
- **agentStore (Zustand)**: Agent runs, metrics, running agents, polling

### Communication Layer

```typescript
// apiAdapter.ts - Dual-mode bridge
if (isTauriEnvironment()) {
  // Desktop: Tauri IPC invoke()
  return await invoke(command, args);
} else {
  // Web: REST API fetch()
  return await fetch(`/api/${endpoint}`, { method, body });
}
```

## Backend Architecture

### Module Structure

```
src-tauri/src/
├── main.rs              # Tauri app entry, registers 92 commands
├── lib.rs               # Library entry
├── web_main.rs          # Alternative web server entry
├── web_server.rs        # Axum REST + WebSocket server
├── claude_binary.rs     # Claude CLI discovery & version management
├── commands/
│   ├── claude.rs        # Session/project/hooks commands
│   ├── agents.rs        # Agent CRUD + execution
│   ├── mcp.rs           # MCP server management
│   ├── usage.rs         # Usage analytics
│   ├── storage.rs       # Generic SQL database viewer
│   ├── proxy.rs         # Proxy configuration
│   └── slash_commands.rs # Custom slash commands
├── process/
│   └── registry.rs      # Process lifecycle (spawn, track, kill)
└── checkpoint/
    ├── mod.rs           # Data structures
    ├── state.rs         # Per-session manager lifecycle
    ├── manager.rs       # Checkpoint creation/restore logic
    └── storage.rs       # Content-addressable file storage
```

### Key Design Patterns

1. **Process Registry**: In-memory HashMap tracking running Claude processes by run_id, with Arc<Mutex<>> for thread safety
2. **Content-Addressable Storage**: Checkpoint files stored by SHA256 hash for deduplication
3. **Lazy Manager Pattern**: CheckpointManagers created on-demand per session, cached in shared state
4. **Event Streaming**: Tauri events (`claude-output:{sessionId}`) for real-time output

### Database Schema

```sql
-- agents table
CREATE TABLE agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'bot',
    system_prompt TEXT NOT NULL,
    default_task TEXT,
    model TEXT DEFAULT 'sonnet',
    enable_file_read BOOLEAN DEFAULT 1,
    enable_file_write BOOLEAN DEFAULT 1,
    enable_network BOOLEAN DEFAULT 0,
    hooks TEXT,  -- JSON
    created_at TEXT,
    updated_at TEXT
);

-- agent_runs table
CREATE TABLE agent_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER REFERENCES agents(id),
    agent_name TEXT,
    agent_icon TEXT,
    task TEXT,
    model TEXT,
    project_path TEXT,
    session_id TEXT,
    status TEXT,
    pid INTEGER,
    process_started_at TEXT,
    created_at TEXT,
    completed_at TEXT
);

-- app_settings table
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
```

## Security Model

### Desktop Mode
- File system access scoped to `$HOME/**` via Tauri capabilities
- Shell execution restricted to `claude` binary specifically
- CSP restricts scripts to `'self'` + PostHog endpoints
- No network access to arbitrary domains from frontend

### Web Server Mode
- CORS: Allow any origin (development-only)
- No authentication or authorization
- Uses `--dangerously-skip-permissions` flag on all Claude executions
- Single-session only (multi-session has event isolation issues)

### Concerning Patterns
- `--dangerously-skip-permissions` used in BOTH desktop and web modes
- Storage commands expose raw SQL execution capability
- No input sanitization on project paths beyond basic encoding
