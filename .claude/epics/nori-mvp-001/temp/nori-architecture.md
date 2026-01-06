# Nori Architecture

**Knowledge-First AI Collaboration Platform for Cross-Functional Teams**

**Date**: January 1, 2026
**Status**: Architecture Design
**Target Users**: Engineers, PMs, POs, Architects, CISO, SRE

---

## Product Vision

Nori is a desktop AI collaboration tool that enables cross-functional teams to work with Claude through role-specific personalities and a curated knowledge system. Unlike terminal-focused tools (Claude Code, OpenCode), Nori provides a visual, non-technical-user-friendly interface with advanced knowledge management.

## Core Differentiators

1. **Role-Based Personas**: PO, Architect, Engineer, CISO, Infra/SRE
2. **Visual Knowledge System**: Browse, edit, create knowledge packages
3. **Multi-Window Support**: Separate contexts for different tasks
4. **Jobs Not Agents**: Parallelization without misleading "agent" terminology
5. **Non-Technical Friendly**: PMs and POs can use it effectively
6. **Local + Remote Knowledge**: Sync knowledge across team/devices

## Technology Stack

### Desktop Framework: **Tauri 2.0**

**Why Tauri over Electron**:
- **Bundle size**: ~3MB vs ~100MB (Electron)
- **Security**: Rust backend, sandboxed by default
- **Performance**: Lower memory footprint (~50% of Electron)
- **Cross-platform**: Mac, Windows, Linux from single codebase
- **Modern**: Built for 2025+ development

**Trade-offs**:
- Smaller ecosystem than Electron
- Rust learning curve for backend (mitigated: can use Node.js sidecar)
- Less mature (but 2.0 is stable)

### Frontend

```
React 18 + TypeScript
├─ UI Framework: Tailwind CSS
├─ State: Zustand (lightweight, no boilerplate)
├─ Code Editor: CodeMirror 6
├─ Icons: Lucide React
├─ Dialogs/Modals: Radix UI
└─ Build: Vite
```

### Backend (Tauri/Rust Core)

```
Tauri 2.0 Commands (Rust)
├─ Knowledge System
│  ├─ Package indexer
│  ├─ Search/filter
│  └─ Sync engine
├─ Claude Integration
│  ├─ Anthropic SDK (via HTTP)
│  ├─ Streaming responses
│  └─ Context management
├─ Jobs System
│  ├─ Parallel execution
│  ├─ Job queue
│  └─ Progress tracking
├─ Hooks Engine
│  ├─ Lifecycle events
│  └─ Shell script execution
└─ Storage (SQLite)
   ├─ Sessions
   ├─ User profiles
   └─ Settings
```

### Optional: Node.js Sidecar

For hooks/commands that need Node.js:
- Execute existing `.mjs` hooks
- Compatibility with current knowledge system
- Gradual migration to Rust

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    Nori Desktop App                        │
│                      (Tauri Window)                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Role Switcher│  │   Profile    │  │  Knowledge   │   │
│  │   Dropdown   │  │   Settings   │  │   Indicator  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │          Main Content Area                          │  │
│  │                                                     │  │
│  │  ┌───────────┐  ┌─────────────────────────────┐   │  │
│  │  │ Knowledge │  │   Chat Interface            │   │  │
│  │  │  Browser  │  │  ┌─────────────────────┐    │   │  │
│  │  │           │  │  │ User: message       │    │   │  │
│  │  │ • Core    │  │  └─────────────────────┘    │   │  │
│  │  │ • Patterns│  │  ┌─────────────────────┐    │   │  │
│  │  │ • Business│  │  │ Claude: response    │    │   │  │
│  │  │ • Meta    │  │  │ [code block]        │    │   │  │
│  │  │           │  │  │                     │    │   │  │
│  │  │ [Search]  │  │  │ Knowledge loaded:   │    │   │  │
│  │  │           │  │  │ • package-1         │    │   │  │
│  │  │ [+ Create]│  │  │ • package-2         │    │   │  │
│  │  │           │  │  └─────────────────────┘    │   │  │
│  │  └───────────┘  │                             │   │  │
│  │                 │  ┌─────────────────────┐    │   │  │
│  │                 │  │ [Input field]       │    │   │  │
│  │                 │  └─────────────────────┘    │   │  │
│  │                 └─────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Bottom Bar: Active Jobs | Session | Tokens    │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘

Backend Layer (Tauri/Rust):
┌────────────────────────────────────────────────────────────┐
│  Knowledge System     │  Claude SDK  │  Jobs Engine        │
│  • 41+ packages       │  • Streaming │  • Parallel exec    │
│  • Local index        │  • Context   │  • Progress         │
│  • Remote sync        │  • Models    │  • Results          │
├────────────────────────────────────────────────────────────┤
│  Hooks Engine         │  Storage (SQLite)                  │
│  • 10 lifecycle       │  • Sessions  │  • Profiles         │
│  • Shell scripts      │  • Settings  │  • Knowledge meta   │
└────────────────────────────────────────────────────────────┘
```

---

## Core Features

### 1. Role Switcher

**UI**: Dropdown in top bar

**Roles**:
- Product Owner (PO)
- Architect (Staff Engineer)
- Engineer (FE/BE)
- CISO (Security)
- Infra/SRE

**Implementation**:
- Load role-specific personality template
- Load role-specific knowledge packages (already have this)
- Visual indicator of active role
- Keyboard shortcut: `Cmd/Ctrl + R`

**Backend**:
```rust
#[tauri::command]
async fn switch_role(role: String) -> Result<RoleConfig, String> {
    let personality = load_personality_template(&role)?;
    let packages = load_role_knowledge(&role)?;
    Ok(RoleConfig { personality, packages })
}
```

### 2. Knowledge Browser

**UI**: Left sidebar (collapsible)

**Features**:
- Tree view of categories (Core, Patterns, Business, Meta)
- Search/filter by tags or text
- View package details (description, tags, dependencies)
- Quick preview (first 100 lines)
- "Create new package" button

**Implementation**:
```tsx
const KnowledgeBrowser = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    invoke('search_knowledge', { query: search })
      .then(setPackages);
  }, [search]);

  return (
    <aside className="w-64 border-r">
      <input
        placeholder="Search knowledge..."
        onChange={e => setSearch(e.target.value)}
      />
      <PackageTree packages={packages} />
      <button onClick={() => createPackage()}>
        + Create Package
      </button>
    </aside>
  );
};
```

### 3. Knowledge Editor

**UI**: Opens in new window or tab

**Features**:
- CodeMirror 6 editor with markdown syntax highlighting
- YAML frontmatter editing (tags, category, description)
- Live preview
- Save to local or remote
- Validation (required fields, tag standards)

**Implementation**: Separate Tauri window with editor component

### 4. Multi-Window Support

**Use Cases**:
- Window 1: Chat as Engineer
- Window 2: Knowledge editor
- Window 3: Chat as PO (different context)

**Implementation**:
```rust
#[tauri::command]
async fn create_window(
    app: tauri::AppHandle,
    window_id: String,
    config: WindowConfig
) -> Result<(), String> {
    tauri::WindowBuilder::new(
        &app,
        window_id,
        tauri::WindowUrl::App("index.html".into())
    )
    .title(&config.title)
    .build()?;
    Ok(())
}
```

Each window maintains its own:
- Session state
- Role configuration
- Loaded knowledge
- Chat history

### 5. Jobs System (NOT Agents)

**Terminology**:
- ❌ Agents (misleading, implies autonomy)
- ✅ Jobs (parallel tasks with clear inputs/outputs)

**Use Cases**:
- Job 1: Analyze codebase → returns summary
- Job 2: Generate tests → returns test files
- Job 3: Review PR → returns feedback
- All run in parallel, results aggregate

**UI**: Bottom bar shows active jobs
```
┌─────────────────────────────────────────┐
│ ⚙️ Analyzing codebase... (45%)           │
│ ⚙️ Generating tests... (23%)             │
│ ✓ Reviewing PR (completed)              │
└─────────────────────────────────────────┘
```

**Implementation**:
```rust
struct Job {
    id: String,
    prompt: String,
    status: JobStatus, // Pending, Running, Completed, Failed
    progress: f32,
    result: Option<String>,
}

#[tauri::command]
async fn create_job(prompt: String) -> Result<String, String> {
    let job_id = uuid::Uuid::new_v4().to_string();
    // Spawn async task
    tokio::spawn(execute_job(job_id.clone(), prompt));
    Ok(job_id)
}

#[tauri::command]
async fn get_job_status(job_id: String) -> Result<Job, String> {
    // Fetch from job queue
}
```

### 6. Knowledge Visibility

**Show in UI**:
- Badge showing loaded knowledge count
- Expandable list in chat interface
- Tooltip on hover showing package names

**Example**:
```
┌─────────────────────────────────┐
│ Claude (as Engineer)            │
│ 📚 12 packages loaded           │
│    • typescript-patterns        │
│    • react-hooks                │
│    • testing-core               │
│    ...                          │
└─────────────────────────────────┘
```

### 7. Knowledge Creation Warnings

**Trigger**: After conversation analysis, suggest creating knowledge

**Example**:
```
💡 New knowledge detected
   This conversation contains reusable patterns about
   "WebSocket reconnection strategies"

   [Create Knowledge Package] [Ignore]
```

**Implementation**: LLM-based hook that analyzes conversation for reusable patterns

### 8. Local + Remote Knowledge

**Architecture**:
```
Local Storage (.nori/knowledge/)
     ↕ Sync
Remote Storage (S3, Git, or Custom API)
```

**Sync Strategies**:
- **Git-based**: Knowledge as Git repo (simple, version control)
- **S3-based**: Files in S3 bucket (fast, cheap)
- **API-based**: Custom knowledge server (enterprise)

**UI**:
```
Settings > Knowledge > Storage
○ Local only
● Local + Git sync (github.com/company/knowledge)
○ Local + S3 sync (s3://bucket/knowledge)
```

---

## Response Visualization (OpenCode Style)

**Claude Code style** (compact, minimal):
```
> User: Fix the auth bug
Analyzing... [thinking]
I'll fix the authentication issue.

[code changes]
```

**OpenCode style** (detailed, structured):
```
╭─ User ──────────────────────────────────╮
│ Fix the auth bug                        │
╰─────────────────────────────────────────╯

╭─ Claude (Engineer) ─────────────────────╮
│ I'll analyze the authentication code    │
│ and fix the token validation issue.     │
│                                          │
│ Steps:                                   │
│ 1. Check token expiry logic             │
│ 2. Fix validation in middleware          │
│ 3. Add tests                             │
│                                          │
│ 📚 Knowledge loaded:                     │
│    • auth-patterns                       │
│    • security-best-practices             │
╰─────────────────────────────────────────╯

╭─ Tool: Read ────────────────────────────╮
│ File: src/middleware/auth.ts            │
│ Lines: 45                                │
╰─────────────────────────────────────────╯

[code block with syntax highlighting]
```

**Nori style**: Like OpenCode but more visual, better formatted

---

## User Profiles

**Storage**: SQLite database

**Profile Schema**:
```typescript
interface UserProfile {
  id: string;
  name: string;
  defaultRole: RoleType;
  theme: 'light' | 'dark' | 'auto';
  knowledgeStorage: 'local' | 'git' | 's3';
  knowledgeRemote?: string; // Git URL or S3 path
  apiKey: string; // Encrypted
  preferences: {
    autoLoadKnowledge: boolean;
    suggestKnowledgeCreation: boolean;
    windowLayout: 'single' | 'split';
  };
}
```

**UI**: Settings panel for profile management

---

## File Structure

```
nori/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Tauri entry point
│   │   ├── knowledge.rs    # Knowledge system
│   │   ├── claude.rs       # Claude SDK integration
│   │   ├── jobs.rs         # Jobs engine
│   │   ├── hooks.rs        # Hooks execution
│   │   └── storage.rs      # SQLite operations
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                    # React frontend
│   ├── components/
│   │   ├── RoleSwitcher.tsx
│   │   ├── KnowledgeBrowser.tsx
│   │   ├── KnowledgeEditor.tsx
│   │   ├── ChatInterface.tsx
│   │   ├── JobsPanel.tsx
│   │   └── ProfileSettings.tsx
│   ├── hooks/
│   │   ├── useKnowledge.ts
│   │   ├── useJobs.ts
│   │   └── useProfile.ts
│   ├── store/              # Zustand stores
│   │   ├── knowledge.ts
│   │   ├── chat.ts
│   │   └── profile.ts
│   ├── App.tsx
│   └── main.tsx
│
├── .nori/                  # User data directory
│   ├── knowledge/          # Local knowledge packages
│   ├── profiles/           # User profiles
│   ├── sessions/           # Chat sessions
│   └── nori.db            # SQLite database
│
└── package.json
```

---

## Development Roadmap

### Phase 1: Foundation (4 weeks)
- ✅ Set up Tauri 2.0 project
- ✅ Basic React UI with Tailwind
- ✅ Role switcher component
- ✅ Knowledge browser (read-only)
- ✅ Chat interface with Claude SDK
- ✅ SQLite storage setup

### Phase 2: Core Features (6 weeks)
- ✅ Knowledge editor (CodeMirror)
- ✅ Multi-window support
- ✅ Jobs system (parallel execution)
- ✅ Hooks engine integration
- ✅ Knowledge visibility UI
- ✅ Profile management

### Phase 3: Advanced Features (4 weeks)
- ✅ Remote knowledge sync (Git)
- ✅ Knowledge creation suggestions
- ✅ Better response visualization
- ✅ Search/filter improvements
- ✅ Keyboard shortcuts

### Phase 4: Polish (2 weeks)
- ✅ UI/UX refinement
- ✅ Performance optimization
- ✅ Error handling
- ✅ Documentation
- ✅ Beta release

**Total**: ~4 months (16 weeks)

---

## Risk Assessment

### Technical Risks

1. **Tauri Learning Curve** (Medium)
   - Mitigation: Use Node.js sidecar for complex logic initially
   - Gradual migration to Rust

2. **Multi-Window State Management** (Medium)
   - Mitigation: Clear window-to-state ownership model
   - Use Tauri events for cross-window communication

3. **Claude SDK Streaming** (Low)
   - Already proven in ClaudeCodeUI
   - Use same patterns

4. **Knowledge Sync Conflicts** (Medium)
   - Mitigation: Last-write-wins for MVP, CRDTs later
   - Git-based sync has built-in conflict resolution

### User Experience Risks

1. **Non-Technical Users** (High)
   - Mitigation: Extensive UX testing with PMs/POs
   - Simplified mode that hides advanced features

2. **Performance with Large Knowledge** (Medium)
   - Mitigation: Virtual scrolling, lazy loading
   - Index-based search (not file scanning)

---

## Success Metrics

**Adoption**:
- 50 active users (engineers + non-engineers) in 3 months
- 10 companies using for team collaboration

**Engagement**:
- 500+ knowledge packages created by community
- Average 5 windows per user per day
- 70%+ using non-engineer roles (PO, Architect)

**Quality**:
- 90%+ knowledge creation suggestions accepted
- <100ms knowledge search latency
- <2s app startup time

---

## Competitive Positioning

| Feature | Claude Code | OpenCode | Nori |
|---------|-------------|----------|------|
| **Target Users** | Engineers | Engineers | Engineers + PMs + POs |
| **Interface** | Terminal | Terminal | Desktop GUI |
| **Role System** | None | None | ✅ 5 roles |
| **Knowledge UI** | None | None | ✅ Browser + Editor |
| **Multi-Window** | No | No | ✅ Yes |
| **Non-Tech Friendly** | No | No | ✅ Yes |
| **Knowledge Sync** | None | None | ✅ Git/S3 |
| **Parallelization** | Agents | Agents | ✅ Jobs |

**Nori's Moat**: Knowledge management + cross-functional usability

---

## Next Steps

1. **Validate with stakeholders**: Show this doc to potential users (PMs, POs)
2. **Set up Tauri project**: Initialize boilerplate
3. **Port knowledge system**: Adapt existing 41 packages to Nori format
4. **Build MVP**: Role switcher + Knowledge browser + Basic chat
5. **Alpha test**: Internal team testing

---

**Status**: Ready for implementation
**Decision needed**: Tauri vs Electron (recommend Tauri)
**Estimated cost**: $0 (open source stack)
**Timeline**: 4 months to beta
