# Nori

**Knowledge-First AI Collaboration Platform for Cross-Functional Teams**

Desktop application (Tauri + React) that enables engineers, PMs, POs, architects, CISO, and SRE teams to work with Claude AI through role-specific personalities and a visual knowledge management system.

---

## Why Nori?

**Problem**: Existing AI coding tools (Claude Code, OpenCode) are terminal-based and engineer-focused. Non-technical team members (PMs, POs) can't use them effectively.

**Solution**: Nori provides:
- 🎭 **Role-based personalities** - Different AI behavior for PO, Architect, Engineer, CISO, SRE
- 📚 **Visual knowledge system** - Browse, search, edit, and create knowledge packages via GUI
- 👁️ **Knowledge visibility** - Always see what knowledge AI is using
- 🖥️ **Desktop GUI** - No terminal required, works on Mac and Windows
- 🔧 **Custom hooks** - Write hooks in any language (Node.js, Rust, Python, shell)

---

## Status

**Current Phase**: Pre-development (Architecture complete)
**Next Milestone**: MVP in 4 months
**Target Users**: Product teams (50-500 people)

---

## Project Structure

```
nori/
├── app/                           # Nori desktop app (Tauri + React)
│   ├── src-tauri/                 # Rust backend
│   └── src/                       # React frontend
│
├── .claude/                       # Claude Code configuration
│   ├── knowledge/                 # Knowledge system (43 packages)
│   │   ├── vault/                 # Knowledge packages
│   │   ├── templates/             # Role personality templates
│   │   ├── hooks/                 # Hook scripts
│   │   └── scripts/               # Knowledge management tools
│   ├── commands/                  # Custom commands
│   └── settings.json              # Claude Code settings
│
├── base_repositories/             # Reference implementations
│   ├── opencode-original/         # OpenCode (latest)
│   ├── claude-code/               # Claude Code official repo
│   └── claudecodeui/              # ClaudeCodeUI for UI patterns
│
├── research/                      # Research and analysis
│   └── archive/                   # 270+ pages of comparison docs
│
├── .claude/temp/                  # Planning documents
│   ├── nori-architecture.md       # Technical architecture
│   ├── nori-business-case.md      # Business case and ROI
│   ├── nori-mvp-epic.md           # Epic with 16 implementation tasks
│   └── repos-update-summary.md    # Reference repo status
│
├── README.md                      # This file
└── LICENSE                        # MIT License
```

---

## Features (MVP)

### ✅ Planned Features

1. **Role Switcher**
   - Product Owner (PO)
   - Architect (Staff Engineer)
   - Engineer (FE/BE)
   - CISO (Security)
   - Infra/SRE

2. **Knowledge System**
   - Visual browser (tree view, search)
   - Knowledge editor (CodeMirror 6)
   - 43+ packages included
   - Create custom packages

3. **Chat Interface**
   - Claude SDK integration
   - Streaming responses
   - Code syntax highlighting
   - Tool call visualization

4. **Knowledge Visibility**
   - See loaded packages
   - Understand AI context
   - Transparent decision-making

5. **Custom Hooks**
   - Execute hooks at lifecycle events
   - Support any language (Node.js, Rust, Python, shell)
   - Modify prompts, validate inputs, transform outputs

### ❌ Not in MVP (V1.0+)

- Remote knowledge sync
- Multi-window support
- Jobs/parallelization
- Team collaboration features
- Mobile apps

---

## Technology Stack

- **Desktop Framework**: Tauri 2.0 (Rust backend)
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Radix UI
- **State**: Zustand
- **Code Editor**: CodeMirror 6
- **Database**: SQLite
- **AI**: Anthropic Claude SDK

---

## Quick Start (Coming Soon)

```bash
# Clone repository
git clone https://github.com/yourorg/nori.git
cd nori

# Install dependencies
bun install

# Run development server
bun run tauri dev

# Build for production
bun run tauri build
```

---

## Development Roadmap

**Phase 1: Foundation** (Weeks 1-4)
- Tauri project setup
- Role switcher
- Basic knowledge browser

**Phase 2: Knowledge System** (Weeks 5-8)
- Knowledge indexing
- Visual browser UI
- Knowledge editor

**Phase 3: Chat Interface** (Weeks 9-12)
- Claude SDK integration
- Chat UI
- Context management

**Phase 4: Hooks & Polish** (Weeks 13-16)
- Hook execution engine
- App packaging
- Testing & documentation

**Total**: 4 months (16 weeks) to MVP

---

## Documentation

- **Epic Folder**: [.claude/epics/nori-mvp-001/](.claude/epics/nori-mvp-001/) - Complete planning documents
  - [Requirements](.claude/epics/nori-mvp-001/requirements.md) - Business requirements and user stories
  - [Plan](.claude/epics/nori-mvp-001/plan.md) - 16 implementation tasks
  - [Status](.claude/epics/nori-mvp-001/STATUS.md) - Current status and next steps
- **Research Archive**: [research/archive/](research/archive/) (270+ pages of OpenCode/Claude Code analysis)

---

## Research Background

This project is built on extensive research:
- 270+ pages of technical comparison (OpenCode vs Claude Code)
- 41 knowledge packages extracted from analysis
- Architecture patterns documented
- Hook systems analyzed
- UI/UX insights from ClaudeCodeUI

All research is preserved in `research/archive/` for reference.

---

## Contributing (Coming Soon)

Once MVP is ready:
- File bugs/features via GitHub Issues
- Submit PRs following CONTRIBUTING.md
- Create custom knowledge packages
- Share custom hooks

---

## License

MIT License - See [LICENSE](LICENSE) for details

---

## Contact

Questions? Reach out via GitHub Issues or Discussions.

---

**Status**: 🚧 Pre-development | 📋 Architecture complete | 🎯 MVP target: Q2 2026
