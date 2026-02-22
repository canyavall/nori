# Opcode - Technology Stack

## Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3 | UI framework |
| **TypeScript** | ~5.6 | Type-safe frontend |
| **Vite** | 6.x | Build tool & dev server |
| **Tailwind CSS** | v4 | Utility-first styling |
| **Zustand** | 5.x | State management (2 stores: session, agent) |
| **Framer Motion** | 12.0-alpha | Animations & transitions |
| **Radix UI** | Various | Accessible UI primitives (dialog, dropdown, tabs, tooltip, etc.) |
| **shadcn/ui** | - | Pre-built component system on top of Radix |
| **Recharts** | 2.14 | Usage analytics charts |
| **React Markdown** | 9.x | Markdown rendering |
| **React Syntax Highlighter** | 15.x | Code highlighting |
| **@uiw/react-md-editor** | 4.x | CLAUDE.md editing |
| **@tanstack/react-virtual** | 3.x | Virtual scrolling for large lists |
| **Lucide React** | 0.468 | Icons |
| **PostHog** | 1.258 | Analytics/telemetry |
| **date-fns** | 3.x | Date formatting |
| **Zod** | 3.x | Schema validation |
| **react-hook-form** | 7.x | Form management |

## Backend (Rust / Tauri)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tauri** | 2.x | Desktop app framework (IPC, window management, system tray) |
| **Tokio** | 1.x | Async runtime |
| **Axum** | 0.8 | Web server mode (REST + WebSocket) |
| **rusqlite** | 0.32 | SQLite database (bundled) |
| **Serde / serde_json** | 1.x | Serialization |
| **reqwest** | 0.12 | HTTP client (for GitHub agent fetching) |
| **chrono** | 0.4 | Date/time handling |
| **zstd** | 0.13 | Compression for checkpoints |
| **sha2** | 0.10 | Content-addressable storage hashing |
| **uuid** | 1.6 | Unique identifiers |
| **walkdir** | 2.x | Directory traversal |
| **clap** | 4.x | CLI argument parsing (web server mode) |
| **tower / tower-http** | 0.5/0.6 | HTTP middleware (CORS, static files) |
| **anyhow** | 1.x | Error handling |
| **regex** | 1.x | Pattern matching |
| **which** | 7.x | Binary discovery |
| **tempfile** | 3.x | Temporary file handling |

### macOS-Specific
| Technology | Purpose |
|------------|---------|
| **window-vibrancy** | macOS vibrancy/translucency effects |
| **cocoa** / **objc** | Native macOS API bindings |

## Tauri Plugins

| Plugin | Purpose |
|--------|---------|
| tauri-plugin-shell | Execute claude CLI binary |
| tauri-plugin-dialog | File open/save dialogs |
| tauri-plugin-fs | File system access (scoped to $HOME) |
| tauri-plugin-process | Process management |
| tauri-plugin-updater | Auto-update support |
| tauri-plugin-notification | Desktop notifications |
| tauri-plugin-clipboard-manager | Clipboard access |
| tauri-plugin-global-shortcut | System-wide shortcuts |
| tauri-plugin-http | HTTP fetch capabilities |

## Build & Dev Tools

| Tool | Purpose |
|------|---------|
| **Bun** | Package manager & script runner |
| **Nix** (shell.nix) | Reproducible dev environment |
| **just** | Task runner (justfile) |
| **GitHub Actions** | CI/CD (multi-platform builds, code signing, notarization) |
| **sharp** | Image processing (dev dependency) |

## Data Storage

| Store | Technology | Location |
|-------|-----------|----------|
| Agent definitions | SQLite | `{app_data}/agents.db` |
| Agent runs/history | SQLite | `{app_data}/agents.db` |
| App settings | SQLite | `{app_data}/agents.db` |
| Session history | JSONL files | `~/.claude/projects/{path}/` |
| Checkpoints | File system | `~/.claude/projects/{path}/.timelines/` |
| Theme/UI prefs | localStorage + SQLite | Browser + backend |

## Platforms Supported

| Platform | Status | Installer Formats |
|----------|--------|-------------------|
| macOS (Intel + Apple Silicon) | Supported | .dmg, .app |
| Linux (x86_64) | Supported | .deb, .AppImage, .rpm |
| Windows | Supported (builds) | .msi, .exe |
| Web (phone/browser) | Experimental | N/A (web server mode) |
