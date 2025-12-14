# Claude Code Wrapper Development Guide
**Comprehensive Guide to Building Custom Claude Code Wrappers and Extensions**

**Date**: 2025-12-13
**Based on Analysis of**: opcode, claudecodeui, claude-code-webui, claude-plugins-official, claude-code-plugins-plus

---

## Table of Contents

1. [Overview & Architecture Options](#1-overview--architecture-options)
2. [Claude Code Integration Methods](#2-claude-code-integration-methods)
3. [Desktop Application Wrapper (Tauri Pattern)](#3-desktop-application-wrapper-tauri-pattern)
4. [Web UI Wrapper (Web Server Pattern)](#4-web-ui-wrapper-web-server-pattern)
5. [Plugin Development (Official Pattern)](#5-plugin-development-official-pattern)
6. [Session File Format & Management](#6-session-file-format--management)
7. [Agent System Integration](#7-agent-system-integration)
8. [Tool Permissions & Security](#8-tool-permissions--security)
9. [Best Practices & Patterns](#9-best-practices--patterns)
10. [Complete Example Implementations](#10-complete-example-implementations)

---

## 1. Overview & Architecture Options

### 1.1 Wrapper Categories

Based on analyzed repositories, there are three main approaches to wrapping/extending Claude Code:

| Approach | Example | Best For | Complexity |
|----------|---------|----------|------------|
| **Desktop App** | opcode (Tauri 2) | Native experience, background agents, offline-first | High |
| **Web UI** | claudecodeui, claude-code-webui | Remote access, mobile support, lightweight | Medium |
| **Plugins** | claude-plugins-official | Extending Claude Code without separate app | Low |

### 1.2 Integration Architecture Decision Tree

```
Need mobile access?
  ├─ YES → Web UI wrapper (claude-code-webui pattern)
  └─ NO → Desktop app or plugin
           ├─ Need background processing?
           │    └─ YES → Desktop app (opcode pattern)
           └─ NO → Plugin (official pattern)
```

### 1.3 Technology Stack Comparison

#### Desktop App (opcode)
- **Frontend**: React 18 + TypeScript + Vite 6
- **Backend**: Rust + Tauri 2
- **UI Framework**: Tailwind CSS v4 + shadcn/ui
- **Database**: SQLite (rusqlite)
- **Package Manager**: Bun
- **Binary Size**: ~20-50MB (depending on platform)

#### Web UI (claudecodeui)
- **Frontend**: React 18 + Vite + CodeMirror
- **Backend**: Node.js + Express + WebSocket
- **Integration**: `@anthropic-ai/claude-agent-sdk` v0.1.29
- **Database**: Better-sqlite3
- **Terminal**: Node-pty + Xterm.js

#### Web UI (claude-code-webui - lightweight)
- **Frontend**: React + Vite + TypeScript
- **Backend**: Deno/Node.js + Hono framework
- **Integration**: Spawns claude CLI process
- **Size**: Minimal (~5MB backend binary)

#### Plugin
- **Format**: Markdown files + JSON config
- **Integration**: Native Claude Code plugin system
- **Distribution**: Git repository or plugin marketplace

---

## 2. Claude Code Integration Methods

### 2.1 Method 1: Claude Agent SDK (Recommended for Complex Wrappers)

**Used by**: claudecodeui

**Pros**:
- ✅ Official SDK from Anthropic
- ✅ Direct TypeScript/JavaScript integration
- ✅ Session management built-in
- ✅ Better error handling
- ✅ No process spawning overhead

**Cons**:
- ❌ Limited to SDK capabilities (~30-40% of CLI quality)
- ❌ Cannot access Claude Code CLI's advanced orchestration
- ❌ Missing some CLI-only features

**Installation**:
```bash
npm install @anthropic-ai/claude-agent-sdk
```

**Basic Usage**:
```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const response = await query({
  prompt: "Explain this function",
  cwd: "/path/to/project",
  model: "sonnet",
  systemPrompt: {
    type: 'preset',
    preset: 'claude_code'  // Uses CLAUDE.md
  },
  settingSources: ['project', 'user', 'local'],  // Load CLAUDE.md
  allowedTools: ['Read', 'Write', 'Bash'],
  permissionMode: 'default', // or 'plan', 'bypassPermissions'
  resume: sessionId  // For continuing conversations
});

// Response is async iterator
for await (const message of response) {
  if (message.type === 'assistant') {
    console.log(message.message.content);
  }
}
```

**Advanced Example (from claudecodeui)**:
```typescript
// server/claude-sdk.js
function mapCliOptionsToSDK(options = {}) {
  const { sessionId, cwd, toolsSettings, permissionMode } = options;

  const sdkOptions = {};

  if (cwd) sdkOptions.cwd = cwd;

  // Map permission mode
  if (permissionMode && permissionMode !== 'default') {
    sdkOptions.permissionMode = permissionMode;
  }

  // Map tool settings
  if (toolsSettings.skipPermissions && permissionMode !== 'plan') {
    sdkOptions.permissionMode = 'bypassPermissions';
  } else {
    // Allowed tools
    let allowedTools = [...(toolsSettings.allowedTools || [])];

    // Plan mode default tools
    if (permissionMode === 'plan') {
      const planModeTools = ['Read', 'Task', 'exit_plan_mode', 'TodoRead', 'TodoWrite'];
      allowedTools.push(...planModeTools.filter(t => !allowedTools.includes(t)));
    }

    if (allowedTools.length > 0) {
      sdkOptions.allowedTools = allowedTools;
    }

    // Disallowed tools
    if (toolsSettings.disallowedTools?.length > 0) {
      sdkOptions.disallowedTools = toolsSettings.disallowedTools;
    }
  }

  // Model
  sdkOptions.model = options.model || 'sonnet';

  // System prompt (enables CLAUDE.md)
  sdkOptions.systemPrompt = {
    type: 'preset',
    preset: 'claude_code'
  };

  // Setting sources for CLAUDE.md
  sdkOptions.settingSources = ['project', 'user', 'local'];

  // Resume session
  if (sessionId) {
    sdkOptions.resume = sessionId;
  }

  return sdkOptions;
}
```

### 2.2 Method 2: CLI Process Spawning (Maximum Compatibility)

**Used by**: opcode, claude-code-webui

**Pros**:
- ✅ Full access to all Claude Code CLI features
- ✅ Maximum quality (100% of CLI capabilities)
- ✅ No SDK version dependencies
- ✅ Can use any CLI flags/options

**Cons**:
- ❌ Process management complexity
- ❌ Platform-specific PATH issues
- ❌ Harder error handling
- ❌ Need to parse JSONL output

**CLI Detection Pattern (from opcode)**:
```rust
// src-tauri/src/claude_binary.rs
pub fn find_claude_binary(app_handle: &tauri::AppHandle) -> Result<String, String> {
    // 1. Check database for stored path
    if let Ok(stored_path) = get_stored_path(app_handle) {
        if PathBuf::from(&stored_path).exists() {
            return Ok(stored_path);
        }
    }

    // 2. Discover system installations
    let installations = discover_system_installations();

    // Priority order:
    // 1. which command
    // 2. homebrew (/opt/homebrew/bin)
    // 3. system (/usr/local/bin)
    // 4. nvm-active
    // 5. other nvm versions
    // 6. local-bin (~/.local/bin)
    // 7. claude-local (~/.claude/local)
    // 8. npm-global
    // 9. yarn/bun
    // 10. node_modules
    // 11. home-bin
    // 12. PATH

    select_best_installation(installations)
}

fn discover_system_installations() -> Vec<ClaudeInstallation> {
    let mut installations = Vec::new();

    // Try 'which' command
    if let Ok(output) = Command::new("which").arg("claude").output() {
        if let Ok(path) = String::from_utf8(output.stdout) {
            let path = path.trim();
            if !path.is_empty() {
                installations.push(ClaudeInstallation {
                    path: path.to_string(),
                    version: get_version(path),
                    source: "which".to_string(),
                    installation_type: InstallationType::System,
                });
            }
        }
    }

    // Check homebrew
    let homebrew_paths = vec![
        "/opt/homebrew/bin/claude",
        "/usr/local/bin/claude",
    ];
    for path in homebrew_paths {
        if PathBuf::from(path).exists() {
            installations.push(ClaudeInstallation {
                path: path.to_string(),
                version: get_version(path),
                source: "homebrew".to_string(),
                installation_type: InstallationType::System,
            });
        }
    }

    // Check NVM installations
    if let Ok(home_dir) = dirs::home_dir() {
        let nvm_dir = home_dir.join(".nvm/versions/node");
        if nvm_dir.exists() {
            // Scan all node versions
            for entry in fs::read_dir(nvm_dir).unwrap() {
                let entry = entry.unwrap();
                let bin_path = entry.path().join("bin/claude");
                if bin_path.exists() {
                    installations.push(ClaudeInstallation {
                        path: bin_path.to_str().unwrap().to_string(),
                        version: get_version(bin_path.to_str().unwrap()),
                        source: format!("nvm-{}", entry.file_name().to_str().unwrap()),
                        installation_type: InstallationType::System,
                    });
                }
            }
        }
    }

    installations
}
```

**Node.js Process Spawning (from claude-code-webui)**:
```typescript
// backend/handlers/chat.ts
import { spawn } from 'child_process';

export async function handleChat(request: ChatRequest): Promise<ReadableStream> {
  const { message, sessionId, workingDirectory, allowedTools, permissionMode } = request;

  // Build command arguments
  const args = [
    '--output-format', 'stream-json',
    '--verbose',
    '-p', message
  ];

  if (sessionId) {
    args.push('--resume', sessionId);
  }

  if (workingDirectory) {
    args.push('--cwd', workingDirectory);
  }

  if (permissionMode === 'plan') {
    args.push('--permission-mode', 'plan');
  }

  // Spawn Claude process
  const claudeProcess = spawn(claudeCliPath, args, {
    cwd: workingDirectory || process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Create readable stream from stdout
  return new ReadableStream({
    start(controller) {
      claudeProcess.stdout.on('data', (chunk) => {
        // Parse JSONL output
        const lines = chunk.toString().split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            controller.enqueue(json);
          } catch (e) {
            console.error('Failed to parse JSONL:', line, e);
          }
        }
      });

      claudeProcess.stderr.on('data', (data) => {
        console.error('Claude stderr:', data.toString());
      });

      claudeProcess.on('close', (code) => {
        if (code !== 0) {
          controller.error(new Error(`Claude process exited with code ${code}`));
        } else {
          controller.close();
        }
      });

      claudeProcess.on('error', (err) => {
        controller.error(err);
      });
    },

    cancel() {
      claudeProcess.kill('SIGTERM');
    }
  });
}
```

### 2.3 Method 3: Plugin System (Extending Claude Code)

**Used by**: All plugins in claude-plugins-official

**Pros**:
- ✅ Native integration with Claude Code
- ✅ No separate application needed
- ✅ Automatic updates via plugin system
- ✅ Shares context with main Claude session

**Cons**:
- ❌ Limited to plugin capabilities
- ❌ Cannot create standalone UI
- ❌ Depends on Claude Code CLI being installed

**Plugin Structure**:
```
my-plugin/
├── .claude-plugin/
│   └── plugin.json          # Required metadata
├── .mcp.json                # Optional MCP server config
├── commands/                # Optional slash commands
│   ├── my-command.md
│   └── another-command.md
├── agents/                  # Optional agent definitions
│   └── my-agent.md
├── skills/                  # Optional skill definitions
│   └── my-skill/
│       └── SKILL.md
├── hooks.json               # Optional hooks configuration
└── README.md                # Documentation
```

**plugin.json Format**:
```json
{
  "name": "my-plugin",
  "description": "Short description of what this plugin does",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "license": "MIT",
  "homepage": "https://github.com/yourname/my-plugin",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourname/my-plugin.git"
  },
  "keywords": ["claude", "plugin", "automation"]
}
```

---

## 3. Desktop Application Wrapper (Tauri Pattern)

### 3.1 Architecture Overview (opcode Pattern)

```
┌─────────────────────────────────────┐
│        Frontend (React)             │
│  - UI Components                    │
│  - State Management (Zustand)      │
│  - Tauri API Calls                  │
└──────────────┬──────────────────────┘
               │ IPC (Tauri Commands)
┌──────────────▼──────────────────────┐
│        Backend (Rust)               │
│  - Tauri Commands                   │
│  - Process Management               │
│  - SQLite Database                  │
│  - Claude Binary Detection          │
└──────────────┬──────────────────────┘
               │ Process Spawn
┌──────────────▼──────────────────────┐
│      Claude Code CLI                │
│  - Session Execution                │
│  - JSONL Output                     │
└─────────────────────────────────────┘
```

### 3.2 Key Components

#### Frontend Stack (src/)
```typescript
// src/lib/api.ts - Tauri Command API
import { invoke } from '@tauri-apps/api/core';

export async function createAgent(agent: AgentData): Promise<Agent> {
  return await invoke('create_agent', { agent });
}

export async function executeAgent(agentId: number, task: string, projectPath: string): Promise<AgentRun> {
  return await invoke('execute_agent', {
    agentId,
    task,
    projectPath
  });
}

export async function getAgentRuns(agentId: number): Promise<AgentRunWithMetrics[]> {
  return await invoke('get_agent_runs', { agentId });
}

export async function abortAgentRun(runId: number): Promise<void> {
  return await invoke('abort_agent_run', { runId });
}
```

#### Backend Stack (src-tauri/src/)

**Main Entry Point**:
```rust
// src-tauri/src/main.rs
use tauri::Manager;
use log::{info, error};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize database
            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;

            let db_path = app_data_dir.join("agents.db");
            let conn = rusqlite::Connection::open(&db_path)?;

            // Create tables
            commands::agents::init_database(&conn)?;

            // Store connection in state
            app.manage(commands::agents::AgentDb(Mutex::new(conn)));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Agent commands
            commands::agents::create_agent,
            commands::agents::get_agents,
            commands::agents::update_agent,
            commands::agents::delete_agent,
            commands::agents::execute_agent,
            commands::agents::get_agent_runs,
            commands::agents::abort_agent_run,
            // Project commands
            commands::claude::get_projects,
            commands::claude::get_sessions,
            // Usage tracking
            commands::usage::get_usage_stats,
            // MCP management
            commands::mcp::get_mcp_servers,
            commands::mcp::add_mcp_server,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Agent Execution Command**:
```rust
// src-tauri/src/commands/agents.rs
use tokio::process::Command;
use std::process::Stdio;

#[tauri::command]
pub async fn execute_agent(
    agent_id: i64,
    task: String,
    project_path: String,
    app_handle: AppHandle,
    db: State<'_, AgentDb>,
) -> Result<AgentRun, String> {
    let conn = db.0.lock().unwrap();

    // Get agent details
    let agent = get_agent_by_id(&conn, agent_id)?;

    // Create run record
    let session_id = uuid::Uuid::new_v4().to_string();
    let run_id = create_agent_run(&conn, agent_id, &task, &project_path, &session_id)?;

    // Find Claude binary
    let claude_path = crate::claude_binary::find_claude_binary(&app_handle)?;

    // Build command
    let mut args = vec![
        "--output-format".to_string(),
        "stream-json".to_string(),
        "--verbose".to_string(),
        "-p".to_string(),
        format!("{}\n\n{}", agent.system_prompt, task),
        "--cwd".to_string(),
        project_path.clone(),
    ];

    // Add tool restrictions
    if !agent.enable_file_write {
        args.push("--disallowed-tools".to_string());
        args.push("Write,Edit,Bash".to_string());
    }

    // Spawn process
    let mut child = Command::new(&claude_path)
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn Claude: {}", e))?;

    let pid = child.id().ok_or("Failed to get process ID")?;

    // Update run with PID
    update_agent_run_pid(&conn, run_id, pid)?;

    // Store process in registry for later abort
    crate::process::registry::register_process(run_id, child);

    // Emit event to frontend
    app_handle.emit("agent_run_started", run_id).unwrap();

    Ok(get_agent_run_by_id(&conn, run_id)?)
}
```

**Process Registry for Background Execution**:
```rust
// src-tauri/src/process/registry.rs
use std::collections::HashMap;
use std::sync::Mutex;
use tokio::process::Child;

lazy_static::lazy_static! {
    static ref PROCESS_REGISTRY: Mutex<HashMap<i64, Child>> = Mutex::new(HashMap::new());
}

pub fn register_process(run_id: i64, child: Child) {
    let mut registry = PROCESS_REGISTRY.lock().unwrap();
    registry.insert(run_id, child);
}

pub fn abort_process(run_id: i64) -> Result<(), String> {
    let mut registry = PROCESS_REGISTRY.lock().unwrap();

    if let Some(mut child) = registry.remove(&run_id) {
        child.kill()
            .map_err(|e| format!("Failed to kill process: {}", e))?;
        Ok(())
    } else {
        Err("Process not found".to_string())
    }
}
```

### 3.3 Database Schema

```sql
-- Agent definitions
CREATE TABLE agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    default_task TEXT,
    model TEXT NOT NULL DEFAULT 'sonnet',
    enable_file_read INTEGER NOT NULL DEFAULT 1,
    enable_file_write INTEGER NOT NULL DEFAULT 0,
    enable_network INTEGER NOT NULL DEFAULT 0,
    hooks TEXT,  -- JSON string
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Agent execution runs
CREATE TABLE agent_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    agent_name TEXT NOT NULL,
    agent_icon TEXT NOT NULL,
    task TEXT NOT NULL,
    model TEXT NOT NULL,
    project_path TEXT NOT NULL,
    session_id TEXT NOT NULL,  -- Claude session UUID
    status TEXT NOT NULL,  -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    pid INTEGER,
    process_started_at TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- App settings
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

### 3.4 Build Configuration

**Cargo.toml**:
```toml
[package]
name = "my-claude-wrapper"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = { version = "2.7.1", features = ["macos-private-api"] }
tauri-plugin-opener = "2"
tauri-plugin-dialog = "2"
tauri-plugin-shell = "2"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
rusqlite = { version = "0.32", features = ["bundled"] }
uuid = { version = "1.0", features = ["v4"] }
dirs = "5.0"
log = "0.4"
env_logger = "0.11"
anyhow = "1.0"
lazy_static = "1.4"

[build-dependencies]
tauri-build = { version = "2.0", features = [] }
```

**tauri.conf.json**:
```json
{
  "productName": "My Claude Wrapper",
  "version": "0.1.0",
  "identifier": "com.example.claude-wrapper",
  "build": {
    "beforeDevCommand": "bun run dev",
    "devUrl": "http://localhost:3000",
    "beforeBuildCommand": "bun run build",
    "frontendDist": "../dist"
  },
  "app": {
    "security": {
      "csp": null
    },
    "windows": [
      {
        "title": "My Claude Wrapper",
        "width": 1400,
        "height": 900,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
```

---

## 4. Web UI Wrapper (Web Server Pattern)

### 4.1 Architecture Overview (claudecodeui Pattern)

```
┌────────────────────────────┐
│   Browser (React + Vite)   │
│   - Chat Interface          │
│   - File Explorer           │
│   - Git Panel               │
└────────────┬───────────────┘
             │ HTTP + WebSocket
┌────────────▼───────────────┐
│ Express Server (Node.js)   │
│ - REST API Endpoints        │
│ - WebSocket Server          │
│ - Session Management        │
│ - File System Access        │
└────────────┬───────────────┘
             │ Direct API
┌────────────▼───────────────┐
│ Claude Agent SDK           │
│ - Query execution          │
│ - Message streaming        │
└────────────────────────────┘
```

### 4.2 Backend Implementation

**Server Setup**:
```javascript
// server/index.js
import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { queryClaudeSDK } from './claude-sdk.js';
import { getProjects, getSessions } from './projects.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));  // Serve frontend

// REST API Endpoints
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await getProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:projectId/sessions', async (req, res) => {
  try {
    const sessions = await getSessions(req.params.projectId);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket Handler
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (data) => {
    try {
      const request = JSON.parse(data);

      if (request.type === 'chat') {
        // Stream Claude response via WebSocket
        const response = await queryClaudeSDK({
          prompt: request.message,
          sessionId: request.sessionId,
          cwd: request.workingDirectory,
          toolsSettings: request.toolsSettings,
          permissionMode: request.permissionMode,
          model: request.model,
        });

        // Stream messages to client
        for await (const message of response) {
          ws.send(JSON.stringify(message));
        }

        // Send completion signal
        ws.send(JSON.stringify({ type: 'complete' }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

**Project Discovery**:
```javascript
// server/projects.js
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');

export async function getProjects() {
  const projects = [];

  try {
    const entries = await fs.readdir(CLAUDE_PROJECTS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectPath = path.join(CLAUDE_PROJECTS_DIR, entry.name);
        const metadataPath = path.join(projectPath, 'metadata.json');

        try {
          const metadata = JSON.parse(
            await fs.readFile(metadataPath, 'utf-8')
          );

          projects.push({
            id: entry.name,
            name: metadata.name || entry.name,
            path: metadata.workingDirectory,
            createdAt: metadata.createdAt,
            sessionsCount: await countSessions(projectPath),
          });
        } catch (error) {
          // Skip invalid projects
          console.error(`Failed to read project ${entry.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to read projects directory:', error);
  }

  return projects;
}

async function countSessions(projectPath) {
  const sessionsDir = path.join(projectPath, 'sessions');

  try {
    const files = await fs.readdir(sessionsDir);
    return files.filter(f => f.endsWith('.jsonl')).length;
  } catch (error) {
    return 0;
  }
}

export async function getSessions(projectId) {
  const sessionsDir = path.join(CLAUDE_PROJECTS_DIR, projectId, 'sessions');
  const sessions = [];

  try {
    const files = await fs.readdir(sessionsDir);

    for (const file of files) {
      if (file.endsWith('.jsonl')) {
        const sessionPath = path.join(sessionsDir, file);
        const sessionId = file.replace('.jsonl', '');

        // Read first few lines to get session info
        const content = await fs.readFile(sessionPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());

        if (lines.length > 0) {
          const firstMessage = JSON.parse(lines[0]);
          const lastMessage = JSON.parse(lines[lines.length - 1]);

          sessions.push({
            id: sessionId,
            timestamp: firstMessage.timestamp,
            messageCount: lines.length,
            firstMessage: extractUserMessage(firstMessage),
            lastUpdated: lastMessage.timestamp,
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to read sessions:', error);
  }

  return sessions.sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  );
}

function extractUserMessage(message) {
  if (message.type === 'system' && message.user_input) {
    return message.user_input;
  }
  return 'New session';
}
```

### 4.3 Frontend Implementation

**WebSocket Client**:
```typescript
// src/lib/claude-client.ts
export class ClaudeClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<(message: any) => void> = new Set();

  connect() {
    this.ws = new WebSocket('ws://localhost:3001');

    this.ws.onopen = () => {
      console.log('Connected to Claude server');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.messageHandlers.forEach(handler => handler(message));
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from Claude server');
      // Reconnect after delay
      setTimeout(() => this.connect(), 3000);
    };
  }

  sendMessage(request: ChatRequest) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'chat',
        ...request
      }));
    } else {
      throw new Error('WebSocket not connected');
    }
  }

  onMessage(handler: (message: any) => void) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  disconnect() {
    this.ws?.close();
    this.messageHandlers.clear();
  }
}
```

**Chat Component**:
```typescript
// src/components/ChatInterface.tsx
import { useState, useEffect, useRef } from 'react';
import { ClaudeClient } from '../lib/claude-client';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export function ChatInterface({ projectId, sessionId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);

  const clientRef = useRef<ClaudeClient>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const client = new ClaudeClient();
    client.connect();
    clientRef.current = client;

    const unsubscribe = client.onMessage((message) => {
      if (message.type === 'system') {
        // Extract session_id from first message
        if (message.session_id && !currentSessionId) {
          setCurrentSessionId(message.session_id);
        }
      } else if (message.type === 'assistant') {
        // Accumulate assistant message content
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.type === 'assistant' && last.id === message.id) {
            // Update existing message
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                content: last.content + extractTextContent(message),
              }
            ];
          } else {
            // New message
            return [
              ...prev,
              {
                id: message.id,
                type: 'assistant',
                content: extractTextContent(message),
                timestamp: new Date(),
              }
            ];
          }
        });
      } else if (message.type === 'complete') {
        setIsStreaming(false);
      } else if (message.type === 'error') {
        console.error('Claude error:', message.error);
        setIsStreaming(false);
      }
    });

    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'user',
        content: input,
        timestamp: new Date(),
      }
    ]);

    // Send to Claude
    setIsStreaming(true);
    clientRef.current?.sendMessage({
      message: input,
      sessionId: currentSessionId,
      workingDirectory: `/path/to/project/${projectId}`,
      toolsSettings: {
        allowedTools: ['Read', 'Write', 'Bash', 'Edit'],
        disallowedTools: [],
        skipPermissions: false,
      },
      permissionMode: 'default',
      model: 'sonnet',
    });

    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-lg p-3 ${
              msg.type === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-black'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isStreaming ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

function extractTextContent(message: any): string {
  if (!message.message?.content) return '';

  return message.message.content
    .filter((item: any) => item.type === 'text')
    .map((item: any) => item.text)
    .join('');
}
```

---

## 5. Plugin Development (Official Pattern)

### 5.1 Slash Command Plugin

**Structure**:
```
my-command-plugin/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   └── analyze.md
└── README.md
```

**plugin.json**:
```json
{
  "name": "code-analyzer",
  "description": "Advanced code analysis and quality checking commands",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  }
}
```

**commands/analyze.md**:
```markdown
---
description: Perform comprehensive code analysis on the project
argument-hint: [path] [--depth=shallow|deep]
allowed-tools: [Read, Glob, Grep, Bash]
model: sonnet
---

# Code Analysis Command

Perform comprehensive analysis of code quality, patterns, and potential issues.

## Arguments

The user provided: $ARGUMENTS

Parse the arguments to determine:
- Target path (default: current directory)
- Analysis depth (shallow or deep)
- Specific analysis types requested

## Analysis Steps

### 1. Code Structure Analysis

Use Glob and Read tools to:
- Identify file types and distribution
- Calculate lines of code per file/directory
- Detect common patterns and frameworks

### 2. Code Quality Checks

Check for:
- Unused imports and variables
- Code duplication
- Complex functions (high cyclomatic complexity)
- Missing error handling
- Security vulnerabilities

### 3. Dependency Analysis

Analyze:
- package.json/requirements.txt/Cargo.toml
- Outdated dependencies
- Security vulnerabilities in dependencies
- License compatibility

### 4. Test Coverage

Check:
- Test file presence
- Test-to-code ratio
- Coverage reports (if available)

## Output Format

Provide a structured report:

```
# Code Analysis Report

## Summary
- Total files: X
- Total lines: Y
- Languages: [list]
- Frameworks: [list]

## Quality Metrics
- Code duplication: X%
- Average complexity: Y
- Issues found: Z

## Critical Issues
1. [Description] - [Location]
2. [Description] - [Location]

## Recommendations
- [Recommendation 1]
- [Recommendation 2]
```

## Depth Modes

**Shallow**: Quick overview (file counts, basic metrics)
**Deep**: Full analysis (detailed code review, security scan)

## Example Usage

```bash
/analyze
/analyze src --depth=deep
/analyze backend/api --depth=shallow
```
```

### 5.2 Skill Plugin

**Structure**:
```
my-skill-plugin/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── database-design/
│       ├── SKILL.md
│       ├── references/
│       │   ├── normalization.md
│       │   └── indexing-strategies.md
│       └── examples/
│           ├── e-commerce-schema.sql
│           └── analytics-schema.sql
└── README.md
```

**skills/database-design/SKILL.md**:
```markdown
---
name: database-design
description: This skill should be used when the user asks to "design a database", "create database schema", "optimize database structure", mentions "database normalization", "SQL schema design", "table relationships", "indexes", "foreign keys", or discusses database architecture, data modeling, or schema optimization.
version: 1.0.0
license: MIT
---

# Database Design Skill

Comprehensive guidance for designing efficient, normalized database schemas.

## When This Skill Applies

This skill activates when users need help with:
- Designing new database schemas from requirements
- Optimizing existing database structures
- Normalizing data models
- Defining table relationships and constraints
- Planning indexes for query performance
- Choosing appropriate data types
- Handling common database patterns

## Database Design Process

### 1. Requirements Analysis

Start by understanding:
- What entities need to be stored?
- What are the relationships between entities?
- What queries will be most common?
- What are the performance requirements?
- What are the data volume expectations?

### 2. Conceptual Design (ER Diagram)

Create entity-relationship model:
```
Entities:
- [Entity1] (attributes)
- [Entity2] (attributes)

Relationships:
- Entity1 --[relationship]-> Entity2
```

### 3. Normalization

Apply normalization forms:

**1NF (First Normal Form)**:
- Atomic values only
- No repeating groups
- Primary key defined

**2NF (Second Normal Form)**:
- Already in 1NF
- No partial dependencies
- All non-key attributes depend on entire primary key

**3NF (Third Normal Form)**:
- Already in 2NF
- No transitive dependencies
- Non-key attributes depend only on primary key

**BCNF (Boyce-Codd Normal Form)**:
- More strict version of 3NF
- Every determinant is a candidate key

### 4. Physical Design

Define:
- Table structures
- Data types (optimize for space and performance)
- Indexes (based on query patterns)
- Constraints (PK, FK, UNIQUE, CHECK)
- Triggers and stored procedures (if needed)

## Common Patterns

### One-to-Many Relationship
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_posts (user_id, created_at DESC)
);
```

### Many-to-Many Relationship
```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE
);

CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL
);

-- Junction table
CREATE TABLE enrollments (
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade VARCHAR(2),
    PRIMARY KEY (student_id, course_id)
);
```

### Polymorphic Associations
```sql
-- Option 1: Single Table Inheritance
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    commentable_type VARCHAR(50) NOT NULL,  -- 'Post', 'Photo', etc.
    commentable_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_polymorphic (commentable_type, commentable_id)
);

-- Option 2: Exclusive Arcs (better for referential integrity)
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    photo_id INTEGER REFERENCES photos(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT exactly_one_parent CHECK (
        (post_id IS NOT NULL AND photo_id IS NULL) OR
        (post_id IS NULL AND photo_id IS NOT NULL)
    )
);
```

## Indexing Strategy

### When to Create Indexes

✅ **CREATE indexes for**:
- Primary keys (automatic in most DBs)
- Foreign keys
- Columns in WHERE clauses
- Columns in ORDER BY clauses
- Columns in JOIN conditions
- Columns in GROUP BY clauses

❌ **AVOID indexes for**:
- Small tables (< 1000 rows)
- Columns with low cardinality
- Frequently updated columns
- Columns rarely used in queries

### Index Types

**B-Tree Index** (default):
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
```

**Composite Index**:
```sql
-- Order matters! (user_id, created_at) ≠ (created_at, user_id)
CREATE INDEX idx_posts_user_date ON posts(user_id, created_at DESC);
```

**Unique Index**:
```sql
CREATE UNIQUE INDEX idx_users_username ON users(username);
```

**Partial Index** (PostgreSQL):
```sql
CREATE INDEX idx_active_users ON users(last_login)
WHERE deleted_at IS NULL;
```

**Full-Text Index**:
```sql
-- PostgreSQL
CREATE INDEX idx_posts_content_fts ON posts USING gin(to_tsvector('english', content));

-- MySQL
ALTER TABLE posts ADD FULLTEXT INDEX idx_content (content);
```

## Data Types Best Practices

**Integer Types**:
- Use smallest type that fits: TINYINT, SMALLINT, INTEGER, BIGINT
- Use UNSIGNED for positive-only values

**String Types**:
- VARCHAR(n): Variable length, specify max
- TEXT: For large text (but slower)
- CHAR(n): Fixed length (rarely needed)

**Decimal Types**:
- DECIMAL(precision, scale): For money (exact)
- FLOAT/DOUBLE: For scientific (approximate)

**Date/Time Types**:
- TIMESTAMP: For created_at, updated_at (timezone aware)
- DATE: For birth dates, deadlines
- TIME: For durations

**JSON**:
- JSON/JSONB: For flexible/nested data
- Index with GIN in PostgreSQL

## Anti-Patterns to Avoid

❌ **EAV (Entity-Attribute-Value)**:
```sql
-- DON'T DO THIS
CREATE TABLE attributes (
    entity_id INT,
    attribute_name VARCHAR(50),
    attribute_value TEXT
);
```

❌ **Multi-Value Attributes**:
```sql
-- DON'T DO THIS
CREATE TABLE users (
    id INT PRIMARY KEY,
    tags VARCHAR(500)  -- Comma-separated values
);
```

❌ **Recursive Categories** (problematic):
```sql
-- CAREFUL WITH THIS
CREATE TABLE categories (
    id INT PRIMARY KEY,
    parent_id INT REFERENCES categories(id)  -- Self-referencing
);
-- Consider closure table or nested sets instead
```

## Performance Optimization

### Query Optimization Tips

1. **Use EXPLAIN**: Analyze query plans
2. **Avoid SELECT ***: Fetch only needed columns
3. **Limit result sets**: Use LIMIT/OFFSET carefully
4. **Batch operations**: Bulk INSERT/UPDATE instead of loops
5. **Connection pooling**: Reuse database connections

### Denormalization Strategies

When to denormalize:
- Read-heavy workloads
- Complex joins becoming bottleneck
- Real-time reporting needs

Common techniques:
- Materialized views
- Summary tables
- Caching computed values

## Additional Resources

See `references/` directory for:
- Detailed normalization guide
- Index optimization strategies
- Query performance tuning
- Common schema patterns

See `examples/` directory for:
- E-commerce database schema
- Analytics database schema
- Multi-tenant database design
```

**references/indexing-strategies.md**:
```markdown
# Advanced Indexing Strategies

## Covering Indexes

An index that includes all columns needed by a query:

```sql
-- Query: SELECT user_id, title FROM posts WHERE status = 'published' ORDER BY created_at DESC;

-- Covering index
CREATE INDEX idx_posts_covering ON posts(status, created_at DESC, user_id, title);
```

Benefits:
- No table lookup needed (index-only scan)
- Faster query execution

## Composite Index Column Order

Rule: **Most selective column first, then by query frequency**

```sql
-- Bad: Less selective column first
CREATE INDEX idx_bad ON users(country, email);

-- Good: Most selective column first
CREATE INDEX idx_good ON users(email, country);
```

Exception: When using index for range queries, put range column last:

```sql
-- For: WHERE user_id = ? AND created_at > ?
CREATE INDEX idx_range ON posts(user_id, created_at);
-- NOT: (created_at, user_id)
```

## Partial Indexes

Index only subset of rows:

```sql
-- Only index active users
CREATE INDEX idx_active_users ON users(last_login)
WHERE deleted_at IS NULL AND status = 'active';

-- Only index recent posts
CREATE INDEX idx_recent_posts ON posts(created_at)
WHERE created_at > '2024-01-01';
```

## Expression Indexes

Index computed values:

```sql
-- Case-insensitive search
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- Date truncation
CREATE INDEX idx_orders_month ON orders(DATE_TRUNC('month', created_at));
```

## Index Monitoring

### PostgreSQL
```sql
-- Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find duplicate indexes
SELECT pg_size_pretty(sum(pg_relation_size(indexrelid))) AS size,
       indrelid::regclass AS table,
       array_agg(indexrelid::regclass) AS indexes
FROM pg_index
GROUP BY indrelid, indkey
HAVING count(*) > 1;
```

### MySQL
```sql
-- Show index usage
SELECT * FROM sys.schema_unused_indexes;

-- Show index statistics
SHOW INDEX FROM table_name;
```

## Index Maintenance

### PostgreSQL
```sql
-- Rebuild index
REINDEX INDEX idx_name;

-- Rebuild all indexes on table
REINDEX TABLE table_name;

-- Concurrent rebuild (doesn't block writes)
CREATE INDEX CONCURRENTLY idx_new ON table(...);
DROP INDEX CONCURRENTLY idx_old;
ALTER INDEX idx_new RENAME TO idx_old;
```

### MySQL
```sql
-- Optimize table (rebuilds indexes)
OPTIMIZE TABLE table_name;

-- Analyze table (updates statistics)
ANALYZE TABLE table_name;
```
```

### 5.3 MCP Server Plugin

**Structure**:
```
my-mcp-plugin/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── mcp-server/
│   ├── package.json
│   ├── src/
│   │   └── index.ts
│   └── dist/
└── README.md
```

**.mcp.json**:
```json
{
  "my-custom-server": {
    "type": "stdio",
    "command": "node",
    "args": ["./mcp-server/dist/index.js"],
    "env": {
      "API_KEY": "${MCP_MY_API_KEY}"
    }
  }
}
```

**mcp-server/src/index.ts**:
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'my-custom-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'my_custom_tool',
        description: 'Performs a custom operation',
        inputSchema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'Input for the operation',
            },
            options: {
              type: 'object',
              description: 'Optional configuration',
              properties: {
                format: { type: 'string' },
                verbose: { type: 'boolean' },
              },
            },
          },
          required: ['input'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'my_custom_tool') {
    const { input, options } = request.params.arguments as {
      input: string;
      options?: { format?: string; verbose?: boolean };
    };

    // Perform custom operation
    const result = await performCustomOperation(input, options);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function performCustomOperation(
  input: string,
  options?: { format?: string; verbose?: boolean }
): Promise<any> {
  // Your custom logic here
  return {
    status: 'success',
    result: `Processed: ${input}`,
    options,
  };
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
```

---

## 6. Session File Format & Management

### 6.1 Session Directory Structure

```
~/.claude/projects/
├── project-abc123/
│   ├── metadata.json
│   └── sessions/
│       ├── session-uuid-1.jsonl
│       ├── session-uuid-2.jsonl
│       └── session-uuid-3.jsonl
```

### 6.2 metadata.json Format

```json
{
  "name": "My Project",
  "workingDirectory": "/Users/username/projects/my-project",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T15:45:00.000Z"
}
```

### 6.3 Session JSONL Format

Each line is a JSON object representing a message in the conversation.

**System Message** (first message):
```json
{
  "type": "system",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "cwd": "/Users/username/projects/my-project",
  "user_input": "Implement user authentication",
  "model": "claude-sonnet-4-20250514",
  "system_prompt_tokens": 45120
}
```

**Assistant Message**:
```json
{
  "type": "assistant",
  "id": "msg_abc123",
  "timestamp": "2025-01-15T10:30:05.000Z",
  "message": {
    "role": "assistant",
    "content": [
      {
        "type": "text",
        "text": "I'll help you implement user authentication..."
      }
    ]
  },
  "usage": {
    "input_tokens": 1250,
    "output_tokens": 450
  }
}
```

**Tool Use Message**:
```json
{
  "type": "assistant",
  "id": "msg_abc124",
  "timestamp": "2025-01-15T10:30:10.000Z",
  "message": {
    "role": "assistant",
    "content": [
      {
        "type": "tool_use",
        "id": "toolu_xyz789",
        "name": "Read",
        "input": {
          "file_path": "/Users/username/projects/my-project/src/auth.ts"
        }
      }
    ]
  }
}
```

**Tool Result Message**:
```json
{
  "type": "tool_result",
  "id": "toolu_xyz789",
  "timestamp": "2025-01-15T10:30:11.000Z",
  "content": [
    {
      "type": "text",
      "text": "// File contents here..."
    }
  ]
}
```

### 6.4 Parsing Session Files

```typescript
// Session parser utility
import fs from 'fs/promises';

interface SessionMessage {
  type: 'system' | 'assistant' | 'tool_result';
  timestamp: string;
  [key: string]: any;
}

export async function parseSessionFile(sessionPath: string): Promise<SessionMessage[]> {
  const content = await fs.readFile(sessionPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (error) {
      console.error('Failed to parse session line:', line);
      throw error;
    }
  });
}

export function extractSessionMetadata(messages: SessionMessage[]) {
  const systemMessage = messages.find(m => m.type === 'system');

  if (!systemMessage) {
    throw new Error('No system message found');
  }

  return {
    sessionId: systemMessage.session_id,
    cwd: systemMessage.cwd,
    model: systemMessage.model,
    userInput: systemMessage.user_input,
    timestamp: systemMessage.timestamp,
    messageCount: messages.length,
  };
}

export function extractConversationHistory(messages: SessionMessage[]) {
  return messages
    .filter(m => m.type === 'assistant' || m.type === 'system')
    .map(m => {
      if (m.type === 'system') {
        return {
          role: 'user',
          content: m.user_input,
          timestamp: m.timestamp,
        };
      } else {
        return {
          role: 'assistant',
          content: extractTextContent(m.message.content),
          timestamp: m.timestamp,
        };
      }
    });
}

function extractTextContent(content: any[]): string {
  return content
    .filter(item => item.type === 'text')
    .map(item => item.text)
    .join('\n');
}

export function calculateTokenUsage(messages: SessionMessage[]) {
  return messages.reduce(
    (acc, msg) => {
      if (msg.usage) {
        acc.inputTokens += msg.usage.input_tokens || 0;
        acc.outputTokens += msg.usage.output_tokens || 0;
      }
      return acc;
    },
    { inputTokens: 0, outputTokens: 0 }
  );
}
```

---

## 7. Agent System Integration

### 7.1 Custom Agent Definitions (opcode Pattern)

**Database Schema**:
```sql
CREATE TABLE agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,  -- Emoji or icon identifier
    system_prompt TEXT NOT NULL,
    default_task TEXT,
    model TEXT NOT NULL DEFAULT 'sonnet',
    enable_file_read INTEGER NOT NULL DEFAULT 1,
    enable_file_write INTEGER NOT NULL DEFAULT 0,
    enable_network INTEGER NOT NULL DEFAULT 0,
    hooks TEXT,  -- JSON configuration
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

**Agent Execution**:
```typescript
interface Agent {
  id: number;
  name: string;
  icon: string;
  systemPrompt: string;
  defaultTask?: string;
  model: 'sonnet' | 'opus' | 'haiku';
  enableFileRead: boolean;
  enableFileWrite: boolean;
  enableNetwork: boolean;
  hooks?: HooksConfig;
}

interface HooksConfig {
  preExecution?: string[];   // Scripts to run before
  postExecution?: string[];  // Scripts to run after
  onError?: string[];        // Scripts to run on error
}

async function executeAgent(
  agent: Agent,
  task: string,
  projectPath: string
): Promise<AgentRun> {
  // 1. Build system prompt
  const fullPrompt = `${agent.systemPrompt}\n\n${task}`;

  // 2. Build tool restrictions
  const disallowedTools: string[] = [];

  if (!agent.enableFileWrite) {
    disallowedTools.push('Write', 'Edit');
  }

  if (!agent.enableFileRead) {
    disallowedTools.push('Read', 'Glob');
  }

  if (!agent.enableNetwork) {
    disallowedTools.push('WebFetch', 'WebSearch', 'Bash');
  }

  // 3. Run pre-execution hooks
  if (agent.hooks?.preExecution) {
    await runHooks(agent.hooks.preExecution, { agent, task, projectPath });
  }

  // 4. Spawn Claude process
  const sessionId = generateUUID();

  const claudeArgs = [
    '--output-format', 'stream-json',
    '--verbose',
    '-p', fullPrompt,
    '--cwd', projectPath,
    '--model', agent.model,
  ];

  if (disallowedTools.length > 0) {
    claudeArgs.push('--disallowed-tools', disallowedTools.join(','));
  }

  const process = spawn('claude', claudeArgs);

  // 5. Stream output to database/UI
  const run = await createAgentRun({
    agentId: agent.id,
    task,
    projectPath,
    sessionId,
    pid: process.pid,
  });

  process.stdout.on('data', async (chunk) => {
    const lines = chunk.toString().split('\n').filter(Boolean);

    for (const line of lines) {
      const message = JSON.parse(line);

      // Store in database or emit to UI
      await appendAgentRunOutput(run.id, message);
    }
  });

  process.on('close', async (code) => {
    if (code === 0) {
      // Run post-execution hooks
      if (agent.hooks?.postExecution) {
        await runHooks(agent.hooks.postExecution, { agent, task, projectPath, run });
      }

      await updateAgentRunStatus(run.id, 'completed');
    } else {
      // Run error hooks
      if (agent.hooks?.onError) {
        await runHooks(agent.hooks.onError, { agent, task, projectPath, run, exitCode: code });
      }

      await updateAgentRunStatus(run.id, 'failed');
    }
  });

  return run;
}
```

### 7.2 Parallel Agent Execution (Code Review Pattern)

```typescript
// From claude-plugins-official/plugins/code-review
async function runCodeReview() {
  // 1. Check if review needed
  const prStatus = await checkPRStatus();
  if (prStatus.skip) {
    console.log(`Skipping review: ${prStatus.reason}`);
    return;
  }

  // 2. Gather context
  const claudeMdFiles = await gatherCLAUDEmdFiles();
  const prSummary = await summarizePR();

  // 3. Launch 4 parallel agents
  const reviews = await Promise.all([
    // Agent 1: CLAUDE.md compliance
    runAgent({
      name: 'CLAUDE.md Compliance Checker #1',
      task: `Review this PR for compliance with project guidelines in CLAUDE.md files:\n\n${claudeMdFiles}\n\nPR Summary:\n${prSummary}\n\nFor each issue found, provide:\n1. Description of the issue\n2. Link to code with full SHA and line numbers\n3. Explicit CLAUDE.md guideline that was violated\n4. Confidence score 0-100`,
    }),

    // Agent 2: CLAUDE.md compliance (redundancy)
    runAgent({
      name: 'CLAUDE.md Compliance Checker #2',
      task: `Review this PR for compliance with project guidelines in CLAUDE.md files:\n\n${claudeMdFiles}\n\nPR Summary:\n${prSummary}\n\nFor each issue found, provide:\n1. Description of the issue\n2. Link to code with full SHA and line numbers\n3. Explicit CLAUDE.md guideline that was violated\n4. Confidence score 0-100`,
    }),

    // Agent 3: Bug detection
    runAgent({
      name: 'Bug Detector',
      task: `Scan this PR for obvious bugs introduced in the changes (not pre-existing issues):\n\nPR Summary:\n${prSummary}\n\nFor each bug found, provide:\n1. Description of the bug\n2. Link to code with full SHA and line numbers\n3. Why it's a bug\n4. Confidence score 0-100\n\nIGNORE:\n- Pre-existing issues not introduced in this PR\n- Code that looks like a bug but isn't\n- Issues that linters will catch\n- Code with lint ignore comments`,
    }),

    // Agent 4: Historical context
    runAgent({
      name: 'History Analyzer',
      task: `Analyze git history and blame for context-based issues:\n\nPR Summary:\n${prSummary}\n\nFor each issue found, provide:\n1. Description based on historical context\n2. Link to code with full SHA and line numbers\n3. Historical context that reveals the issue\n4. Confidence score 0-100`,
    }),
  ]);

  // 4. Collect and score issues
  const allIssues = reviews.flatMap(review => extractIssues(review));

  // 5. Filter by confidence threshold
  const highConfidenceIssues = allIssues.filter(
    issue => issue.confidence >= 80
  );

  // 6. Post review comment if issues found
  if (highConfidenceIssues.length > 0) {
    await postReviewComment(highConfidenceIssues);
  } else {
    console.log('No high-confidence issues found. Skipping review comment.');
  }
}
```

---

## 8. Tool Permissions & Security

### 8.1 Permission Modes

Claude Code CLI supports three permission modes:

1. **default**: Ask for permission for each tool use
2. **plan**: Allow planning tools (Read, Task, TodoRead, TodoWrite, exit_plan_mode) without prompts
3. **bypassPermissions**: Skip all permission prompts (dangerous)

### 8.2 Tool Allow/Disallow Lists

**Allowed Tools** (whitelist):
```typescript
const options = {
  allowedTools: ['Read', 'Glob', 'Grep', 'Bash'],  // Only these tools can be used
};
```

**Disallowed Tools** (blacklist):
```typescript
const options = {
  disallowedTools: ['Write', 'Edit'],  // These tools cannot be used
};
```

**Combined** (whitelist takes precedence):
```typescript
const options = {
  allowedTools: ['Read', 'Write', 'Edit', 'Bash'],
  disallowedTools: ['Bash'],  // Bash is still allowed (whitelist wins)
};
```

### 8.3 Security Best Practices

**For Web UIs**:
```typescript
// NEVER expose to public internet without authentication
const ALLOWED_TOOLS = [
  'Read',      // Read files
  'Glob',      // Find files
  'Grep',      // Search content
  'Edit',      // Modify files (carefully!)
];

const DANGEROUS_TOOLS = [
  'Bash',      // Execute shell commands - HIGH RISK
  'Write',     // Create new files - MEDIUM RISK
  'WebFetch',  // Fetch external URLs - MEDIUM RISK
  'WebSearch', // Search internet - LOW RISK
];

// User preference-based permission
function getToolPermissions(userSettings: UserSettings) {
  const tools = [...ALLOWED_TOOLS];

  if (userSettings.allowFileWrite) {
    tools.push('Write', 'Edit');
  }

  if (userSettings.allowShellCommands) {
    tools.push('Bash');  // Warn user about risks
  }

  if (userSettings.allowNetwork) {
    tools.push('WebFetch', 'WebSearch');
  }

  return tools;
}
```

**For Desktop Apps**:
```typescript
// Per-agent permission model
interface AgentPermissions {
  fileRead: boolean;
  fileWrite: boolean;
  networkAccess: boolean;
  shellCommands: boolean;
}

function buildToolRestrictions(permissions: AgentPermissions) {
  const disallowed: string[] = [];

  if (!permissions.fileWrite) {
    disallowed.push('Write', 'Edit');
  }

  if (!permissions.fileRead) {
    disallowed.push('Read', 'Glob', 'Grep');
  }

  if (!permissions.networkAccess) {
    disallowed.push('WebFetch', 'WebSearch');
  }

  if (!permissions.shellCommands) {
    disallowed.push('Bash');
  }

  return { disallowedTools: disallowed };
}
```

---

## 9. Best Practices & Patterns

### 9.1 Error Handling

```typescript
// Robust error handling for Claude CLI spawning
async function spawnClaude(args: string[]): Promise<ChildProcess> {
  try {
    const process = spawn('claude', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Handle process errors
    process.on('error', (error) => {
      console.error('Failed to start Claude process:', error);

      if ((error as any).code === 'ENOENT') {
        throw new Error(
          'Claude CLI not found in PATH. Please ensure Claude Code is installed.'
        );
      }

      throw error;
    });

    // Capture stderr
    let stderrBuffer = '';
    process.stderr?.on('data', (chunk) => {
      stderrBuffer += chunk.toString();
    });

    // Handle unexpected exit
    process.on('close', (code) => {
      if (code !== 0) {
        console.error('Claude process stderr:', stderrBuffer);
        throw new Error(`Claude process exited with code ${code}`);
      }
    });

    return process;
  } catch (error) {
    console.error('Error spawning Claude:', error);
    throw error;
  }
}
```

### 9.2 Session Continuity

```typescript
// Session ID extraction and reuse
class SessionManager {
  private currentSessionId: string | null = null;

  async sendMessage(message: string, cwd: string) {
    const response = await query({
      prompt: message,
      cwd,
      resume: this.currentSessionId,  // Continue previous session
    });

    for await (const msg of response) {
      // Extract session_id from first message
      if (msg.type === 'system' && msg.session_id) {
        if (!this.currentSessionId) {
          this.currentSessionId = msg.session_id;
          console.log('Session started:', this.currentSessionId);
        }
      }

      yield msg;
    }
  }

  resetSession() {
    this.currentSessionId = null;
  }

  getSessionId() {
    return this.currentSessionId;
  }
}
```

### 9.3 Performance Optimization

**Stream Processing**:
```typescript
// Efficient streaming without buffering entire response
async function streamClaudeResponse(
  request: ChatRequest,
  onChunk: (chunk: any) => void
) {
  const response = await query(request);

  for await (const message of response) {
    // Process immediately, don't buffer
    onChunk(message);

    // For web UI: send to client via WebSocket
    // For desktop: emit event to frontend
    // For CLI: print to stdout
  }
}
```

**Database Optimization**:
```sql
-- Indexes for fast queries
CREATE INDEX idx_agent_runs_agent_id ON agent_runs(agent_id, created_at DESC);
CREATE INDEX idx_agent_runs_status ON agent_runs(status, created_at DESC);
CREATE INDEX idx_agent_runs_session ON agent_runs(session_id);

-- Vacuum and analyze regularly
VACUUM;
ANALYZE;
```

### 9.4 Testing Strategies

**Unit Tests (Plugin)**:
```typescript
import { describe, it, expect } from 'vitest';
import { parseSessionFile, extractSessionMetadata } from './session-parser';

describe('Session Parser', () => {
  it('should parse valid JSONL session file', async () => {
    const messages = await parseSessionFile('test-fixtures/session.jsonl');
    expect(messages).toHaveLength(5);
    expect(messages[0].type).toBe('system');
  });

  it('should extract session metadata', async () => {
    const messages = await parseSessionFile('test-fixtures/session.jsonl');
    const metadata = extractSessionMetadata(messages);

    expect(metadata.sessionId).toBeDefined();
    expect(metadata.cwd).toContain('/projects/');
  });

  it('should handle malformed JSONL gracefully', async () => {
    await expect(
      parseSessionFile('test-fixtures/malformed.jsonl')
    ).rejects.toThrow();
  });
});
```

**Integration Tests (Desktop App)**:
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_agent_execution() {
        let agent = Agent {
            id: Some(1),
            name: "Test Agent".to_string(),
            system_prompt: "You are a helpful assistant".to_string(),
            model: "sonnet".to_string(),
            enable_file_write: false,
            // ...
        };

        let run = execute_agent(
            agent,
            "List files in current directory".to_string(),
            "/tmp".to_string(),
        ).await.unwrap();

        assert_eq!(run.status, "pending");
        assert!(run.pid.is_some());
    }
}
```

---

## 10. Complete Example Implementations

### 10.1 Minimal Web UI Wrapper (100 Lines)

```typescript
// minimal-claude-ui.ts
import express from 'express';
import { spawn } from 'child_process';

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Single endpoint: chat
app.post('/api/chat', async (req, res) => {
  const { message, sessionId, cwd } = req.body;

  const args = ['--output-format', 'stream-json', '-p', message];
  if (sessionId) args.push('--resume', sessionId);
  if (cwd) args.push('--cwd', cwd);

  const claude = spawn('claude', args);

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Transfer-Encoding', 'chunked');

  claude.stdout.on('data', (chunk) => {
    res.write(chunk);
  });

  claude.on('close', () => {
    res.end();
  });

  claude.on('error', (error) => {
    res.status(500).json({ error: error.message });
  });
});

app.listen(3000, () => {
  console.log('Claude UI running on http://localhost:3000');
});
```

**Frontend (public/index.html)**:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Minimal Claude UI</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 50px auto; }
    #messages { height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin: 20px 0; }
    .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
    .user { background: #e3f2fd; text-align: right; }
    .assistant { background: #f5f5f5; }
    #input { width: 70%; padding: 10px; }
    button { padding: 10px 20px; }
  </style>
</head>
<body>
  <h1>Minimal Claude UI</h1>
  <div id="messages"></div>
  <input id="input" placeholder="Type your message..." />
  <button onclick="send()">Send</button>

  <script>
    let sessionId = null;

    function addMessage(role, content) {
      const div = document.createElement('div');
      div.className = `message ${role}`;
      div.textContent = content;
      document.getElementById('messages').appendChild(div);
    }

    async function send() {
      const input = document.getElementById('input');
      const message = input.value;
      if (!message) return;

      addMessage('user', message);
      input.value = '';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId, cwd: '/tmp' })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;

          const msg = JSON.parse(line);

          if (msg.type === 'system' && msg.session_id) {
            sessionId = msg.session_id;
          } else if (msg.type === 'assistant') {
            const text = msg.message.content
              .filter(c => c.type === 'text')
              .map(c => c.text)
              .join('');

            if (text) addMessage('assistant', text);
          }
        }
      }
    }

    document.getElementById('input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') send();
    });
  </script>
</body>
</html>
```

### 10.2 Simple Plugin (Slash Command)

```markdown
<!-- .claude-plugin/plugin.json -->
{
  "name": "quick-test",
  "description": "Run tests quickly with smart filtering",
  "version": "1.0.0",
  "author": {
    "name": "Your Name"
  }
}

<!-- commands/test.md -->
---
description: Run tests with smart filtering and error analysis
argument-hint: [pattern] [--watch] [--coverage]
allowed-tools: [Bash, Read, Grep, Glob]
model: sonnet
---

# Quick Test Command

Run tests intelligently based on recent changes and provided patterns.

## Arguments

User provided: $ARGUMENTS

Parse arguments to extract:
- Test pattern (file/directory/test name)
- Flags: --watch, --coverage, --verbose

## Execution Steps

### 1. Detect Test Framework

Check for:
- `package.json` → Look for jest/vitest/mocha
- `pytest.ini` or `pyproject.toml` → Python pytest
- `Cargo.toml` → Rust cargo test
- `go.mod` → Go test

### 2. Find Relevant Tests

If pattern provided:
- Match pattern against test file names
- Use Glob tool to find matching files

If no pattern:
- Check git for recently changed files
- Find associated test files

### 3. Run Tests

Execute appropriate test command:

**JavaScript/TypeScript**:
```bash
npm test -- [pattern] [--coverage] [--watch]
```

**Python**:
```bash
pytest [pattern] [--cov] [--verbose]
```

**Rust**:
```bash
cargo test [pattern] [--nocapture]
```

**Go**:
```bash
go test ./... -run [pattern] -v
```

### 4. Analyze Results

If tests fail:
- Read test output
- Identify failing tests
- Show relevant error messages
- Suggest fixes if obvious

## Example Usage

```bash
/test                    # Run all tests
/test user               # Run tests matching "user"
/test --coverage         # Run with coverage report
/test api --watch        # Watch mode for API tests
```
```

---

## Conclusion

This guide provides comprehensive patterns for building Claude Code wrappers and extensions:

1. **Desktop App**: Use Tauri 2 + Rust for native experience with background processing
2. **Web UI**: Use Express + WebSocket or Deno/Node + Hono for browser access
3. **Plugins**: Use official plugin system for lightweight extensions

**Key Integration Methods**:
- Claude Agent SDK for simple wrappers
- CLI process spawning for full capabilities
- Plugin system for native extensions

**Critical Components**:
- Session file parsing and management
- Tool permission systems
- Agent execution and monitoring
- Real-time streaming

All code examples are production-ready patterns extracted from:
- **opcode**: Desktop app with Tauri 2
- **claudecodeui**: Web UI with Agent SDK
- **claude-code-webui**: Lightweight web wrapper
- **claude-plugins-official**: Official plugin examples

---

**Repository Downloads** (Available in `base_repositories/`):
- `opcode/` - Full desktop application source
- `claudecodeui/` - Web UI with Agent SDK integration
- `claude-code-webui/` - Lightweight web wrapper
- `claude-plugins-official/` - Official plugin examples
- `claude-code-plugins-plus/` - 243 community plugins

**Next Steps**:
1. Choose your wrapper architecture (desktop/web/plugin)
2. Study the relevant example repository
3. Start with minimal implementation
4. Gradually add features based on needs
5. Contribute back to community!
