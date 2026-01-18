# Nori Codebase Structure

## Repository Layout

```
nori/
├── app/                        # THE active codebase (Electron app)
│   ├── src/                    # Source code
│   ├── dist/                   # Compiled output
│   ├── package.json            # Dependencies
│   └── tsconfig.json           # TypeScript config
│
├── .claude/                    # Claude Code configuration
│   ├── CLAUDE.md              # Project documentation
│   ├── knowledge/             # Knowledge vault
│   ├── commands/              # Custom commands
│   └── settings.json          # Settings
│
├── base_repositories/          # Research (OpenCode, Claude Code plugins)
├── research/                   # Architecture analysis docs
└── requests_tracker/           # Feature tracking
```

## Main Codebase (app/src/)

### Main Process (app/src/main/)
- **index.ts** - Electron main process entry point
- Window management
- Server lifecycle

### Preload (app/src/preload/)
- **index.ts** - Context bridge for secure IPC
- Exposes safe APIs to renderer

### Renderer (app/src/renderer/)
React frontend - Vite dev server with hot reload

**Components**:
- `components/chat/` - Chat UI (ChatInput, ChatMessage, ChatInterface, SessionStatus)
- `components/knowledge/` - Knowledge browser (KnowledgeBrowser, KnowledgeEditor, PackageTree, etc.)
- `components/projects/` - Project management (ProjectList, CreateProjectModal)
- `components/settings/` - Settings UI (OAuthFlow, HookSettings, HookCard, etc.)
- `components/tabs/` - Tab system (Tab, TabBar, TabContent)
- `components/vault/` - Vault management (VaultSwitchModal)

**Hooks**:
- `hooks/useChat.ts` - Chat state management
- `hooks/useKnowledge.ts` - Knowledge operations
- `hooks/useRole.ts` - Role management
- `hooks/useHooks.ts` - Hook system integration

**Stores** (Zustand):
- `stores/projectStore.ts` - Project state
- `stores/roleStore.ts` - Role state
- `stores/tabStore.ts` - Tab state
- `stores/vaultStore.ts` - Vault state

**Types**:
- `types/chat.ts`, `types/knowledge.ts`, `types/project.ts`, etc.
- Centralized TypeScript type definitions

**Pages**:
- `pages/Homepage.tsx` - Main application page

### Server (app/src/server/)
Express backend with WebSocket

**Auth** (`auth/`):
- OAuth flow (Anthropic)
- PKCE implementation
- Token storage

**Claude** (`claude/`):
- WebSocket integration
- Token management
- Streaming responses

**Database** (`db/`):
- SQLite operations
- Tables: auth, roles, sessions, workspaces
- CRUD utilities

**Routes**:
- `auth/routes.ts` - Authentication endpoints
- `claude/websocket.ts` - WebSocket chat server
- `hooks/routes.ts` - Hook system endpoints
- `knowledge/routes.ts` - Knowledge management endpoints
- `roles/routes.ts` - Role management endpoints
- `sessions/routes.ts` - Session management endpoints
- `workspaces/routes.ts` - Workspace management endpoints

## Build Artifacts

- **dist/** - Compiled TypeScript (main + preload)
- **dist/renderer/** - Vite build output (frontend)
- **release/** - electron-builder output (packaged app)

## Configuration Files

- **package.json** - Dependencies, scripts, electron-builder config
- **tsconfig.json** - Base TypeScript config (references sub-configs)
- **tsconfig.main.json** - Main process TypeScript config
- **tsconfig.renderer.json** - Renderer process TypeScript config
- **eslint.config.js** - ESLint configuration
- **vite.config.ts** - Vite configuration
- **vitest.config.ts** - Vitest configuration

## External Data

- **~/.nori/nori.db** - SQLite database (auto-created on first run)
- **~/.nori/auth.json** - OAuth tokens
- **~/.nori/config.json** - Global vault registry
