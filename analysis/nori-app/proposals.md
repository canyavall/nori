# Nori App - 3 Technical Proposals

Based on the analysis of: your nori.txt spec, the KV knowledge vault system, Opcode (Tauri+React), OpenCode (Bun+SolidJS+Hono), ccusage, claude-hud, and safety-net.

---

## Proposal A: Tauri + React (Proven Desktop Stack)

### Philosophy
Classic desktop-first approach. React gives you the largest ecosystem and hiring pool. Tauri gives you small binaries, native performance, and cross-platform distribution. SQLite for all local data. This is the "safe" choice — well-documented, massive community, predictable.

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Desktop Shell** | Tauri 2 (Rust) | ~5MB binaries, native OS integration, auto-update, system tray |
| **Frontend** | React 18 + TypeScript | Largest ecosystem, shadcn/ui components, battle-tested |
| **Styling** | Tailwind CSS v4 | Utility-first, consistent design system, dark/light mode |
| **State** | Zustand | Lightweight, no boilerplate, works well with React |
| **Build** | Vite 6 | Fast HMR, great Tauri integration |
| **Components** | shadcn/ui + Radix | Accessible, customizable, well-maintained |
| **Database** | SQLite (via Tauri plugin) | Local-first, zero config, vault metadata + settings |
| **Markdown** | gray-matter + remark | Parse frontmatter, render knowledge content |
| **Vector Search** | sqlite-vss (or vectra) | Vector embeddings stored in SQLite |
| **Git** | simple-git (JS) | Vault pull/push operations |
| **Package Manager** | pnpm | Fast, disk-efficient |
| **Testing** | Vitest + Playwright | Unit + E2E |
| **Icons** | Lucide React | Consistent, tree-shakeable |

### Folder Architecture

```
nori-app/
├── src-tauri/                    # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs              # Entry point
│   │   ├── lib.rs               # Tauri setup + plugin registration
│   │   ├── commands/            # IPC commands exposed to frontend
│   │   │   ├── mod.rs
│   │   │   ├── app.rs           # Integrity check, auth, autoupdate
│   │   │   ├── vault.rs         # Git pull/push, reconciliation
│   │   │   └── knowledge.rs     # CRUD, audit, DB regeneration
│   │   └── db/
│   │       ├── mod.rs
│   │       └── migrations/      # SQLite schema migrations
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── icons/
├── src/                          # React frontend
│   ├── main.tsx                  # App entry
│   ├── App.tsx                   # Router + layout
│   ├── components/
│   │   ├── ui/                   # shadcn/ui base components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── StatusBar.tsx
│   │   ├── vault/
│   │   │   ├── VaultList.tsx
│   │   │   ├── VaultSettings.tsx
│   │   │   └── VaultSyncStatus.tsx
│   │   ├── knowledge/
│   │   │   ├── KnowledgeEditor.tsx
│   │   │   ├── KnowledgeList.tsx
│   │   │   ├── KnowledgeSearch.tsx
│   │   │   └── FrontmatterForm.tsx
│   │   └── settings/
│   │       ├── AppSettings.tsx
│   │       └── ThemeToggle.tsx
│   ├── hooks/                    # React hooks
│   │   ├── useVault.ts
│   │   ├── useKnowledge.ts
│   │   └── useTauriCommand.ts
│   ├── stores/                   # Zustand stores
│   │   ├── appStore.ts
│   │   ├── vaultStore.ts
│   │   └── knowledgeStore.ts
│   ├── lib/
│   │   ├── tauri.ts             # Tauri IPC wrapper
│   │   ├── markdown.ts          # Frontmatter parsing
│   │   └── validators.ts        # Zod schemas
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── VaultPage.tsx
│   │   ├── KnowledgePage.tsx
│   │   └── SettingsPage.tsx
│   └── styles/
│       └── globals.css           # Tailwind base + theme tokens
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── .gitignore
└── CLAUDE.md
```

### Roadmap

**Phase 1 — Skeleton (Week 1-2)**
- [ ] Tauri + React + Vite scaffold
- [ ] Basic window with sidebar navigation
- [ ] Light/dark theme toggle (Tailwind)
- [ ] SQLite database setup with schema
- [ ] App integrity check (folder validation on start)

**Phase 2 — Vault Core (Week 3-4)**
- [ ] Vault registration (add git repo URLs)
- [ ] Vault pull/push via simple-git
- [ ] Vault reconciliation (detect conflicts)
- [ ] Link vaults to projects
- [ ] Vault sync status UI

**Phase 3 — Knowledge CRUD (Week 5-6)**
- [ ] List knowledge entries from vault markdown files
- [ ] Create knowledge with frontmatter form + content editor
- [ ] Edit existing knowledge (content + frontmatter)
- [ ] Delete knowledge entries
- [ ] Audit knowledge (validate frontmatter, content quality)

**Phase 4 — DB & Search (Week 7-8)**
- [ ] Regenerate DB from markdown files (index build)
- [ ] Vector embedding system (sqlite-vss or vectra)
- [ ] Knowledge search (text + semantic)
- [ ] Audit vault (full validation pass)

**Phase 5 — Polish (Week 9-10)**
- [ ] Authentication check (Claude Code access validation)
- [ ] Auto-update system (Tauri updater plugin)
- [ ] Cross-platform builds (macOS, Linux, Windows)
- [ ] Error handling, loading states, empty states

### Pros
- Huge React ecosystem, easy to find solutions
- shadcn/ui gives beautiful, accessible UI out of the box
- Tauri is proven for desktop apps (small binaries, native feel)
- Rust backend is fast and safe for file/DB operations

### Cons
- Rust learning curve if you need to extend the backend significantly
- React + Tauri IPC can feel verbose (every backend operation needs a Rust command)
- Heavier dev setup (Rust toolchain + Node)

---

## Proposal B: Tauri + SolidJS (Modern Performance Stack)

### Philosophy
SolidJS gives you React-like DX with genuinely better performance (no virtual DOM, fine-grained reactivity). This is what OpenCode chose for their 106k-star project, and it works. Bun replaces Node for speed. This is the "modern" choice — smaller ecosystem but the right primitives.

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Desktop Shell** | Tauri 2 (Rust) | Same benefits as Proposal A |
| **Frontend** | SolidJS 1.9 + TypeScript | Fine-grained reactivity, no vDOM overhead, smaller bundles |
| **Styling** | Tailwind CSS v4 | Same as A |
| **State** | SolidJS signals (built-in) | No external state library needed — signals are reactive primitives |
| **Build** | Vite 7 | SolidJS has first-class Vite support |
| **Components** | Kobalte (Solid headless UI) | Accessible primitives, like Radix but for SolidJS |
| **Database** | SQLite (via Drizzle ORM + Tauri) | Type-safe queries, schema migrations |
| **Markdown** | gray-matter + unified/remark | Same parsing, Solid rendering |
| **Vector Search** | vectra (TypeScript native) | Pure TS vector store, no native deps |
| **Git** | isomorphic-git | Pure JS git — no system git dependency |
| **Runtime** | Bun | Fast install, fast scripts, built-in SQLite |
| **Testing** | Bun test + Playwright | Built-in test runner + E2E |

### Folder Architecture

```
nori-app/
├── src-tauri/                    # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── app.rs
│   │   │   ├── vault.rs
│   │   │   └── knowledge.rs
│   │   └── db/
│   │       ├── mod.rs
│   │       └── schema.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                          # SolidJS frontend
│   ├── index.tsx                 # Entry point
│   ├── App.tsx                   # Router + providers
│   ├── components/
│   │   ├── ui/                   # Base components (Kobalte-based)
│   │   │   ├── Button.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Shell.tsx         # Main app shell
│   │   │   ├── Sidebar.tsx
│   │   │   └── StatusBar.tsx
│   │   ├── vault/
│   │   │   ├── VaultCard.tsx
│   │   │   ├── VaultRegistration.tsx
│   │   │   ├── VaultSync.tsx
│   │   │   └── ProjectLinker.tsx
│   │   ├── knowledge/
│   │   │   ├── KnowledgeList.tsx
│   │   │   ├── KnowledgeEditor.tsx
│   │   │   ├── KnowledgeViewer.tsx
│   │   │   ├── FrontmatterEditor.tsx
│   │   │   └── AuditBadge.tsx
│   │   └── settings/
│   │       ├── GeneralSettings.tsx
│   │       └── ThemeSwitch.tsx
│   ├── lib/
│   │   ├── tauri.ts             # IPC bridge (typed commands)
│   │   ├── vault.ts             # Vault operations
│   │   ├── knowledge.ts         # Knowledge parsing + validation
│   │   ├── embeddings.ts        # Vector embedding logic
│   │   └── schemas.ts           # Zod schemas for frontmatter
│   ├── stores/
│   │   ├── app.store.ts         # createStore: app state, theme, auth
│   │   ├── vault.store.ts       # createStore: vaults, projects, sync status
│   │   └── knowledge.store.ts   # createStore: entries, search, filters
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Vaults.tsx
│   │   ├── Knowledge.tsx
│   │   └── Settings.tsx
│   └── styles/
│       └── app.css
├── drizzle/                      # DB schema + migrations (shared)
│   ├── schema.ts
│   └── migrations/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── bunfig.toml
└── CLAUDE.md
```

### Roadmap

**Phase 1 — Foundation (Week 1-2)**
- [ ] Tauri + SolidJS + Vite scaffold (using Bun)
- [ ] App shell with @solidjs/router
- [ ] Kobalte component primitives (Button, Dialog, Input, Select)
- [ ] Theme system (signals-based, light/dark)
- [ ] SQLite schema via Drizzle ORM
- [ ] App integrity check on startup

**Phase 2 — Vault System (Week 3-4)**
- [ ] Vault registration form + storage
- [ ] Git operations via isomorphic-git (pull/push)
- [ ] Project-to-vault linking
- [ ] Reconciliation engine (3-way merge detection from KV patterns)
- [ ] Sync status indicators

**Phase 3 — Knowledge Management (Week 5-7)**
- [ ] Parse vault markdown files (gray-matter frontmatter)
- [ ] Knowledge list with filtering by category/tags
- [ ] Create flow: frontmatter form → markdown editor → validation → save
- [ ] Edit flow: load → modify → audit → save
- [ ] Delete with confirmation
- [ ] Audit system (frontmatter validation + content quality check)

**Phase 4 — Intelligence Layer (Week 8-9)**
- [ ] Regenerate DB: scan all markdown → build index (like KV's knowledge.json)
- [ ] Vector embeddings via vectra
- [ ] Semantic search across knowledge entries
- [ ] Full vault audit command

**Phase 5 — Production (Week 10-11)**
- [ ] Authentication check integration
- [ ] Auto-updater (Tauri plugin)
- [ ] Multi-platform packaging (DMG, AppImage, MSI)
- [ ] Keyboard shortcuts, accessibility pass

### Pros
- SolidJS signals = no re-render bugs, truly reactive state
- Bun is significantly faster than Node for install/build/test
- Drizzle ORM gives type-safe database access with zero runtime overhead
- isomorphic-git means no system git dependency (works everywhere)
- Closer to what OpenCode (most successful project analyzed) chose

### Cons
- Smaller SolidJS ecosystem (fewer ready-made components than React)
- Kobalte is less mature than Radix
- Team familiarity may be lower with SolidJS

---

## Proposal C: Electron + React + Local Server (Full-Stack TypeScript)

### Philosophy
Skip Rust entirely. Use Electron for the desktop shell and a local Hono/Bun server for the backend — 100% TypeScript from top to bottom. This removes the Rust learning curve and lets you move fastest. The trade-off is larger binaries (~80MB vs ~5MB) and more memory usage, but for a knowledge management app this is perfectly acceptable.

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Desktop Shell** | Electron 34 | Mature, full Node.js access, no IPC serialization needed |
| **Frontend** | React 18 + TypeScript | Same ecosystem benefits as Proposal A |
| **Backend** | Hono + Bun (local server) | Type-safe routes, runs inside Electron's main process |
| **Styling** | Tailwind CSS v4 | Same as above |
| **State** | Zustand + TanStack Query | Zustand for UI state, TanStack Query for server state |
| **Build** | Vite + electron-vite | Optimized Electron build pipeline |
| **Components** | shadcn/ui + Radix | Same as Proposal A |
| **Database** | better-sqlite3 + Drizzle ORM | Synchronous SQLite, type-safe, runs in main process |
| **Markdown** | gray-matter + MDXEditor | Rich editing with frontmatter support |
| **Vector Search** | vectra | Pure TypeScript vector store |
| **Git** | simple-git | Mature, well-maintained git wrapper |
| **Testing** | Vitest + Playwright | Unit + E2E |

### Folder Architecture

```
nori-app/
├── electron/                     # Electron main process
│   ├── main.ts                   # Entry: create window, start server
│   ├── preload.ts                # Context bridge for renderer
│   ├── server/                   # Local Hono API server
│   │   ├── index.ts             # Hono app setup
│   │   ├── routes/
│   │   │   ├── app.routes.ts    # /api/app — integrity, auth, update
│   │   │   ├── vault.routes.ts  # /api/vault — CRUD, sync, reconcile
│   │   │   └── knowledge.routes.ts  # /api/knowledge — CRUD, audit, search
│   │   ├── services/
│   │   │   ├── app.service.ts    # Integrity checks, auth validation
│   │   │   ├── vault.service.ts  # Git operations, reconciliation
│   │   │   ├── knowledge.service.ts  # CRUD, frontmatter, audit
│   │   │   └── embedding.service.ts  # Vector embeddings
│   │   └── db/
│   │       ├── client.ts         # better-sqlite3 + Drizzle setup
│   │       ├── schema.ts         # Table definitions
│   │       └── migrations/
│   └── utils/
│       ├── paths.ts              # Resolve vault/config/data paths
│       └── git.ts                # simple-git wrapper
├── src/                          # React renderer process
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── ui/                   # shadcn/ui
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── StatusBar.tsx
│   │   ├── vault/
│   │   │   ├── VaultManager.tsx
│   │   │   ├── VaultForm.tsx
│   │   │   ├── VaultSync.tsx
│   │   │   ├── ProjectLinker.tsx
│   │   │   └── ConflictResolver.tsx
│   │   ├── knowledge/
│   │   │   ├── KnowledgeExplorer.tsx  # Tree/grid view of entries
│   │   │   ├── KnowledgeEditor.tsx    # MDX editor with preview
│   │   │   ├── FrontmatterPanel.tsx   # Side panel for metadata
│   │   │   ├── AuditResults.tsx       # Validation results display
│   │   │   └── SearchPanel.tsx        # Text + semantic search
│   │   └── settings/
│   │       ├── AppSettings.tsx
│   │       └── ThemeToggle.tsx
│   ├── hooks/
│   │   ├── useApi.ts             # TanStack Query + fetch to local server
│   │   ├── useVaults.ts
│   │   ├── useKnowledge.ts
│   │   └── useTheme.ts
│   ├── stores/
│   │   ├── ui.store.ts           # Sidebar state, modals, theme
│   │   └── selection.store.ts    # Currently selected vault/entry
│   ├── lib/
│   │   ├── api.ts               # Typed API client (fetch → localhost)
│   │   └── schemas.ts           # Zod schemas
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Vaults.tsx
│   │   ├── Knowledge.tsx
│   │   └── Settings.tsx
│   └── styles/
│       └── globals.css
├── shared/                       # Shared types between main + renderer
│   ├── types.ts                  # Vault, Knowledge, AppConfig types
│   └── constants.ts              # Shared constants
├── package.json
├── tsconfig.json
├── electron-vite.config.ts
├── tailwind.config.ts
└── CLAUDE.md
```

### Roadmap

**Phase 1 — Bootstrap (Week 1-2)**
- [ ] electron-vite + React scaffold
- [ ] Hono local server in main process
- [ ] SQLite + Drizzle schema (vaults, knowledge_entries, settings)
- [ ] App shell with sidebar + router
- [ ] Theme toggle (light/dark)
- [ ] Integrity check on app start (validate paths, self-heal)

**Phase 2 — Vault Engine (Week 3-4)**
- [ ] `POST /api/vault` — register vault (git URL + local path)
- [ ] `POST /api/vault/:id/pull` — git pull via simple-git
- [ ] `POST /api/vault/:id/push` — git push
- [ ] `POST /api/vault/:id/reconcile` — 3-way merge detection
- [ ] `POST /api/vault/:id/link` — link to project
- [ ] Frontend: vault manager, sync buttons, conflict display

**Phase 3 — Knowledge CRUD (Week 5-6)**
- [ ] `GET /api/knowledge` — list entries (parsed from vault .md files)
- [ ] `POST /api/knowledge` — create new .md file with frontmatter
- [ ] `PUT /api/knowledge/:id` — edit content + frontmatter
- [ ] `DELETE /api/knowledge/:id` — remove .md file
- [ ] `POST /api/knowledge/:id/audit` — validate quality
- [ ] Frontend: explorer, MDX editor, frontmatter panel, audit badges

**Phase 4 — Search & Intelligence (Week 7-8)**
- [ ] `POST /api/vault/:id/regenerate-db` — scan markdown → rebuild index
- [ ] `POST /api/vault/:id/embed` — generate vector embeddings (vectra)
- [ ] `GET /api/knowledge/search?q=...` — text + semantic search
- [ ] `POST /api/vault/:id/audit` — full vault validation
- [ ] Frontend: search panel with results ranking

**Phase 5 — Ship It (Week 9-10)**
- [ ] Authentication check (Claude Code access)
- [ ] Auto-updater (electron-updater)
- [ ] Packaging: DMG (macOS), AppImage/deb (Linux), NSIS (Windows)
- [ ] Tray icon with sync status
- [ ] Keyboard shortcuts

### Pros
- 100% TypeScript — one language for everything, fastest development speed
- No Rust toolchain needed — lower barrier for contributors
- Electron is the most mature desktop framework (VS Code, Slack, Discord use it)
- Local Hono server means clean REST API — easy to test, easy to extend
- TanStack Query handles caching, loading states, and refetching automatically
- Direct filesystem access in main process — no IPC serialization overhead
- MDXEditor gives a rich markdown editing experience

### Cons
- Larger binary size (~80-150MB vs Tauri's ~5-15MB)
- Higher memory usage (~100-200MB baseline)
- Electron has a "bloated" reputation (though for a knowledge app, this is fine)
- electron-updater is more complex to configure than Tauri's updater

---

## Comparison Matrix

| Criterion | A: Tauri+React | B: Tauri+SolidJS | C: Electron+React |
|-----------|---------------|-----------------|-------------------|
| **Dev Speed** | Medium | Medium | **Fastest** |
| **Binary Size** | **~5-15MB** | **~5-15MB** | ~80-150MB |
| **Memory Usage** | **~30-60MB** | **~30-60MB** | ~100-200MB |
| **Ecosystem Size** | **Large** | Small-Medium | **Large** |
| **Learning Curve** | Medium (Rust) | Medium-High (Rust+Solid) | **Low** |
| **Performance** | High | **Highest** | Good |
| **All-TypeScript** | No (Rust backend) | No (Rust backend) | **Yes** |
| **Component Library** | **shadcn/ui** | Kobalte (less mature) | **shadcn/ui** |
| **Cross-Platform** | **Native feel** | **Native feel** | Good (WebView) |
| **Updater** | **Built-in (Tauri)** | **Built-in (Tauri)** | electron-updater |
| **Future-proof** | High (Tauri growing) | High (Solid growing) | Stable (mature) |

## My Recommendation

**For fastest time to a working product**: Proposal C (Electron + React). You can focus entirely on TypeScript, move fast, and ship. The binary size trade-off is irrelevant for a desktop knowledge app.

**For the best long-term technical foundation**: Proposal B (Tauri + SolidJS). This is what the most successful project in your analysis (OpenCode, 106k stars) chose. SolidJS signals are a better primitive than React hooks for reactive desktop apps. Tauri gives you native performance and tiny binaries.

**For the safest bet**: Proposal A (Tauri + React). Largest ecosystem, most documentation, easiest to hire for. If in doubt, this won't be wrong.
