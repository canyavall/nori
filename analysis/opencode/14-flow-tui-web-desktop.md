# Flow: TUI, Web & Desktop Surfaces

> How the same application runs across terminal, browser, and native desktop.

---

## Architecture: One Server, Many Clients

```
┌─────────────────────────────────────────────────────────────┐
│                     Shared Code                              │
│                                                              │
│  packages/opencode/  → Server, tools, agents, DB, LLM       │
│  packages/app/       → Shared SolidJS UI components          │
│  packages/ui/        → Component library (Kobalte + Tailwind)│
│  packages/sdk/       → TypeScript SDK (from OpenAPI)         │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │     TUI     │ │   Web App   │ │   Desktop   │
    │  (OpenTUI)  │ │  (Browser)  │ │   (Tauri)   │
    └─────────────┘ └─────────────┘ └─────────────┘
```

---

## TUI (Terminal User Interface)

### Technology
- **Framework**: SolidJS rendered to ANSI terminal via `@opentui/solid`
- **Rendering**: 60fps terminal rendering (not curses-based!)
- **Input**: Raw terminal mode keyboard capture

### Provider Nesting (20+ layers!)
```jsx
<ErrorBoundary>
  <ArgsProvider>
    <ExitProvider>
      <KVProvider>
        <ToastProvider>
          <RouteProvider>
            <SDKProvider>
              <SyncProvider>
                <ThemeProvider>
                  <LocalProvider>
                    <KeybindProvider>
                      <PromptStashProvider>
                        <DialogProvider>
                          <CommandProvider>
                            <FrecencyProvider>
                              <PromptHistoryProvider>
                                <PromptRefProvider>
                                  <App />
```

### Routes
- **Home**: Session list, MCP status, tips, command palette
- **Session**: Full conversation UI (header, sidebar, messages, prompt)

### Terminal-Specific Features
- Auto-detect light/dark background (ANSI 11 query)
- Windows Ctrl+C guard
- Selection mode → clipboard copy
- Console stdout interception during rendering
- Keyboard: vim-like bindings + custom keybindings

### Key Components
| Component | Purpose |
|-----------|---------|
| `Prompt` | Multi-line text editor with history |
| `Spinner` | Loading indicator |
| `Toast` | Notifications |
| `Border` | Box drawing |
| Dialogs | Model/agent/MCP selection |

---

## Web App

### Technology
- **Framework**: SolidJS + Vite 7 + @solidjs/router
- **Components**: @opencode-ai/ui + @kobalte/core
- **Terminal**: ghostty-web (terminal emulator in browser)
- **Communication**: SDK client → HTTP REST + SSE

### Provider Nesting
```jsx
<PlatformProvider>      {/* web platform abstraction */}
  <AppBaseProviders>    {/* theme, font, i18n, error boundary */}
    <ServerProvider>    {/* server connection */}
      <GlobalSDKProvider> {/* SDK client + SSE events */}
        <GlobalSyncProvider> {/* central data store */}
          <Router>
            <AppShell>
              <SettingsProvider>
                <PermissionProvider>
                  <LayoutProvider>
                    <Routes ... />
```

### Pages
- **Home**: Session list (recent, all, archived)
- **Session**: Split layout with:
  - Message timeline (virtualized)
  - File tabs (drag-reorderable)
  - Terminal panel
  - Code/diff viewer

### SDK Communication
```typescript
const client = createOpencodeClient({
  baseUrl: serverUrl,
  headers: { "x-opencode-directory": directory },
})

// Event stream
const events = new EventSource(`${serverUrl}/event`)
events.onmessage = (e) => {
  const event = JSON.parse(e.data)
  batch(() => store.reconcile(event))
}
```

### Event Batching
16ms debounce on SSE events → batch SolidJS store mutations → single render cycle

---

## Desktop App (Tauri 2)

### Technology
- **Shell**: Tauri 2 (Rust + WebView)
- **Frontend**: Same as web app (packages/app)
- **Plugins**: 13+ Tauri plugins for native OS integration

### Tauri Plugins Used
| Plugin | Purpose |
|--------|---------|
| deep-link | `opencode://` protocol handling |
| clipboard-manager | Image paste from clipboard |
| dialog | Native file/directory pickers |
| opener | Open files in default app |
| shell | Execute commands (sidecar) |
| os | Platform detection |
| notification | Native notifications |
| process | Sidecar server management |
| store | Persistent key-value storage |
| updater | Auto-update from GitHub releases |
| http | HTTP client with auth headers |
| window-state | Window position/size persistence |

### Server Lifecycle
```
1. Tauri app launches
2. Starts OpenCode server as sidecar process
3. Server gate waits for backend to be ready
4. Shows splash screen during startup
5. Once ready → loads web UI in WebView
6. On close → kills sidecar server
```

### Platform-Specific
| Platform | Features |
|----------|----------|
| **macOS** | Entitlements for restricted APIs, Apple Silicon + Intel |
| **Windows** | WSL integration (path conversion, native dialogs) |
| **Linux** | Wayland/X11 backend selection, .deb/.rpm/.AppImage |

### Desktop-Only Features
- Native file/directory picker dialogs
- Image paste from system clipboard
- Auto-updates from GitHub releases
- Deep link handling (`opencode://`)
- Window state persistence (size, position)
- Native system notifications with click handling
- Webview zoom level control

---

## Platform Abstraction Layer

### Interface
```typescript
interface Platform {
  pickFile(): Promise<string[]>
  pickDirectory(): Promise<string>
  openExternal(url: string): void
  notifications: NotificationAPI
  clipboard: ClipboardAPI
  storage: PersistentStorage
}
```

### Implementations
```
Web:     Server-backed dialogs, localStorage, browser APIs
Desktop: Tauri plugins (native dialogs, store, clipboard)
TUI:     N/A (no file pickers, terminal clipboard)
```

---

## State Synchronization (All Surfaces)

### Pattern: Server → SSE → Client Store

```
Server publishes event (Bus.publish)
        │
        ▼
SSE endpoint streams to all connected clients
        │
        ├─ TUI: SDKProvider → SyncProvider (SolidJS signals)
        ├─ Web: GlobalSDKProvider → GlobalSyncProvider (SolidJS store)
        └─ Desktop: Same as Web (via Tauri WebView)

All clients use same SDK:
  createOpencodeClient() → fetch + EventSource
```

### What Gets Synced
- Sessions (created, updated, deleted)
- Messages and parts (new content, tool results)
- Permissions (asked, replied)
- MCP server status
- LSP diagnostics
- File changes
- Agent status

---

## VS Code Extension

### Technology: TypeScript extension

### Features
| Shortcut | Action |
|----------|--------|
| `Cmd+Esc` / `Ctrl+Esc` | Open/focus OpenCode in split terminal |
| `Cmd+Shift+Esc` / `Ctrl+Shift+Esc` | New session |
| `Cmd+Option+K` / `Alt+Ctrl+K` | Insert file reference (`@File#L37-42`) |

### Integration
- Auto-shares current selection/tab context
- File references link to VS Code files
- Runs OpenCode in VS Code integrated terminal
