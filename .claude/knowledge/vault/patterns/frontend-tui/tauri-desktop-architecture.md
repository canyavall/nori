---
tags:
  - tauri
  - desktop
  - architecture
  - rust
  - react
  - ipc
  - deprecated
description: >-
  [DEPRECATED - Migrated to Electron] Tauri 2.0 desktop application architecture patterns: Rust backend with Tauri commands,
  React frontend with TypeScript, IPC communication, SQLite storage, and custom hooks execution
category: patterns/frontend-tui
required_knowledge: []
deprecated: true
replacement: "Project migrated from Tauri/Rust to Electron/Node.js. See app/MIGRATION.md for details."
---
# Tauri Desktop Architecture (DEPRECATED)

**⚠️ DEPRECATED**: This knowledge is outdated. The Nori project migrated from Tauri/Rust to Electron/Node.js.

**See**: `app/MIGRATION.md` for migration details and current architecture.

Architecture patterns for building desktop applications with Tauri 2.0 (Rust backend + React frontend).

## Why Tauri over Electron

**Bundle size:**
- Tauri: ~3MB (uses system webview)
- Electron: ~100MB (bundles Chromium)

**Performance:**
- Tauri: Lower memory footprint (~50% of Electron)
- Electron: Higher resource usage

**Security:**
- Tauri: Rust backend, sandboxed by default
- Electron: Node.js backend, requires manual sandboxing

**Cross-platform:**
- Both support Mac, Windows, Linux
- Tauri has native system integration

**Trade-offs:**
- Tauri: Smaller ecosystem, Rust learning curve
- Electron: Mature ecosystem, all JavaScript

## Architecture Overview

```
┌────────────────────────────────────────────┐
│         Tauri Window (Webview)             │
│  ┌──────────────────────────────────────┐  │
│  │   React Frontend (TypeScript)        │  │
│  │   • Components (UI)                  │  │
│  │   • Stores (Zustand/Redux)           │  │
│  │   • Hooks (React Query)              │  │
│  └──────────────────────────────────────┘  │
│              ↕ IPC (invoke)                │
│  ┌──────────────────────────────────────┐  │
│  │   Rust Backend (Tauri Commands)     │  │
│  │   • Business logic                   │  │
│  │   • File system access               │  │
│  │   • Database (SQLite)                │  │
│  │   • External API calls               │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

## Tauri Commands (Rust → JS)

**Pattern**: Expose Rust functions to frontend via `#[tauri::command]`

```rust
// src-tauri/src/main.rs
#[tauri::command]
async fn greet(name: String) -> Result<String, String> {
    Ok(format!("Hello, {}!", name))
}

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path)
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, read_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Frontend usage:**

```typescript
import { invoke } from '@tauri-apps/api/tauri';

const greeting = await invoke<string>('greet', { name: 'Alice' });
const content = await invoke<string>('read_file', { path: '/path/to/file' });
```

## State Management

**Frontend state (Zustand):**

```typescript
import { create } from 'zustand';

interface AppStore {
  role: string;
  setRole: (role: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  role: 'engineer',
  setRole: (role) => set({ role }),
}));
```

**Backend state (in-memory or SQLite):**

```rust
use std::sync::Mutex;
use tauri::State;

struct AppState {
    active_role: Mutex<String>,
}

#[tauri::command]
fn get_role(state: State<AppState>) -> Result<String, String> {
    let role = state.active_role.lock()
        .map_err(|e| e.to_string())?;
    Ok(role.clone())
}

#[tauri::command]
fn set_role(state: State<AppState>, role: String) -> Result<(), String> {
    let mut active = state.active_role.lock()
        .map_err(|e| e.to_string())?;
    *active = role;
    Ok(())
}
```

## Single-Window vs Multi-Window Architecture

**Single-window with browser-style tabs** (Nori pattern):
- One Tauri window
- Multiple React "tabs" within same window
- All tabs share same React instance and Zustand stores
- State updates are synchronous (direct in-process mutation)
- Cross-tab communication: Direct store updates

```typescript
// Tabs share same store instance
const useTabStore = create<TabsState>((set) => ({
  tabs: [],
  updateTabWorkspace: (tabId, workspace) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, workspace } : tab
      ),
    }));
  },
}));

// Update in tab 1 immediately visible in tab 2
updateTabWorkspace(tab1.id, newWorkspace); // All tabs re-render
```

**Multi-window** (separate Tauri windows):
- Multiple Tauri windows
- Each window has separate React instance
- Each window has separate Zustand store
- State sync requires IPC or shared storage
- Cross-window communication: Events or database

```rust
// Would need IPC events for multi-window
#[tauri::command]
async fn update_workspace(app: tauri::AppHandle, workspace: Workspace) {
    app.emit_all("workspace-updated", workspace).unwrap();
}
```

**When to use single-window**:
- Browser-like tabbed interface
- Fast cross-tab state sync needed
- Simpler state management
- Lower memory footprint

**When to use multi-window**:
- Multi-monitor workflows
- Independent window positioning
- OS-level window management
- Truly isolated contexts

## File System Access

**Rust backend has full file system access:**

```rust
use std::fs;
use std::path::PathBuf;

#[tauri::command]
async fn list_directory(path: String) -> Result<Vec<String>, String> {
    let dir = fs::read_dir(path).map_err(|e| e.to_string())?;

    let mut files = Vec::new();
    for entry in dir {
        let entry = entry.map_err(|e| e.to_string())?;
        files.push(entry.file_name().to_string_lossy().to_string());
    }

    Ok(files)
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(path, content).map_err(|e| e.to_string())
}
```

## SQLite Integration

**Pattern**: Use `rusqlite` for local database

```rust
use rusqlite::{Connection, Result};
use std::sync::Mutex;
use tauri::State;

struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    fn new(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;
        Ok(Self { conn: Mutex::new(conn) })
    }
}

#[tauri::command]
fn save_session(
    db: State<Database>,
    session_id: String,
    data: String
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO sessions (id, data) VALUES (?1, ?2)",
        &[&session_id, &data],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

// Initialize in main
fn main() {
    let db = Database::new(".nori/nori.db").unwrap();

    tauri::Builder::default()
        .manage(db)
        .invoke_handler(tauri::generate_handler![save_session])
        .run(tauri::generate_context!())
        .unwrap();
}
```

## Events (Backend → Frontend)

**Pattern**: Emit events from Rust to frontend listeners

```rust
use tauri::Manager;

#[tauri::command]
async fn process_task(app: tauri::AppHandle) -> Result<(), String> {
    // Do work
    app.emit_all("task-progress", 50).map_err(|e| e.to_string())?;

    // More work
    app.emit_all("task-progress", 100).map_err(|e| e.to_string())?;

    Ok(())
}
```

**Frontend listener:**

```typescript
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen<number>('task-progress', (event) => {
  console.log('Progress:', event.payload);
});

// Cleanup
unlisten();
```

## Multi-Window Support

**Pattern**: Create additional windows programmatically

```rust
use tauri::Manager;

#[tauri::command]
async fn create_editor_window(app: tauri::AppHandle) -> Result<(), String> {
    tauri::WindowBuilder::new(
        &app,
        "editor",
        tauri::WindowUrl::App("editor.html".into())
    )
    .title("Knowledge Editor")
    .inner_size(800.0, 600.0)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}
```

## Custom Hook Execution

**Pattern**: Execute shell scripts/binaries from Rust

```rust
use std::process::Command;

#[tauri::command]
async fn execute_hook(
    hook_path: String,
    input_json: String
) -> Result<String, String> {
    let output = Command::new(&hook_path)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?
        .stdin
        .as_mut()
        .unwrap()
        .write_all(input_json.as_bytes())
        .map_err(|e| e.to_string())?;

    let output = output.wait_with_output()
        .map_err(|e| e.to_string())?;

    String::from_utf8(output.stdout)
        .map_err(|e| e.to_string())
}
```

## Performance Patterns

**1. Debounce expensive operations:**

```typescript
import { debounce } from 'lodash';

const searchKnowledge = debounce(async (query: string) => {
  const results = await invoke<Package[]>('search_knowledge', { query });
  setResults(results);
}, 300);
```

**2. Cache Tauri command results:**

```typescript
import { useQuery } from '@tanstack/react-query';

const useKnowledgePackages = () => {
  return useQuery({
    queryKey: ['knowledge', 'packages'],
    queryFn: () => invoke<Package[]>('list_packages'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

**3. Virtual scrolling for large lists:**

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualPackageList = ({ packages }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: packages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map((item) => (
        <div key={item.key} style={{ height: item.size }}>
          {packages[item.index].name}
        </div>
      ))}
    </div>
  );
};
```

## Security Patterns

**1. Validate file paths (prevent directory traversal):**

```rust
use std::path::Path;

fn is_safe_path(path: &str, allowed_dir: &str) -> bool {
    let abs_path = Path::new(path).canonicalize().ok();
    let allowed = Path::new(allowed_dir).canonicalize().ok();

    match (abs_path, allowed) {
        (Some(abs), Some(allow)) => abs.starts_with(allow),
        _ => false,
    }
}

#[tauri::command]
async fn read_knowledge_file(path: String) -> Result<String, String> {
    if !is_safe_path(&path, ".nori/knowledge") {
        return Err("Access denied".to_string());
    }

    std::fs::read_to_string(path).map_err(|e| e.to_string())
}
```

**2. Sanitize user input:**

```rust
fn sanitize_package_name(name: &str) -> String {
    name.chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect()
}
```

## Error Handling

**Pattern**: Return `Result<T, String>` from commands

```rust
#[tauri::command]
async fn risky_operation() -> Result<String, String> {
    let data = std::fs::read_to_string("file.txt")
        .map_err(|e| format!("Failed to read file: {}", e))?;

    Ok(data)
}
```

**Frontend handling:**

```typescript
try {
  const data = await invoke<string>('risky_operation');
  console.log(data);
} catch (error) {
  console.error('Error:', error);
  toast.error(error as string);
}
```

## Project Structure

```
app/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Entry point, command registration
│   │   ├── knowledge.rs    # Knowledge system logic
│   │   ├── claude.rs       # Claude SDK integration
│   │   ├── hooks.rs        # Hook execution
│   │   └── storage.rs      # SQLite operations
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
│
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   ├── types/              # TypeScript types
│   ├── App.tsx
│   └── main.tsx
│
└── package.json            # Node dependencies
```

## Build & Development

**Development:**
```bash
bun run tauri dev
```

**Production build:**
```bash
bun run tauri build
```

**Outputs:**
- Mac: `.app` bundle, `.dmg` installer
- Windows: `.exe`, `.msi` installer
- Linux: `.AppImage`, `.deb`, `.rpm`

## Nori Application

For Nori specifically:
- Use Tauri for desktop app framework
- React + TypeScript for UI
- Rust for knowledge indexing, Claude SDK integration, hooks
- SQLite for sessions, settings, profiles
- No Electron needed (Tauri is lighter, faster)

## Source

Extracted from Nori architecture document and Tauri 2.0 best practices (January 2026)
