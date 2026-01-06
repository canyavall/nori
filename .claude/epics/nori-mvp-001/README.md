# Nori MVP Epic

**Epic ID**: nori-mvp-001
**Status**: Ready for implementation
**Timeline**: 16 weeks (4 months)
**Team**: 2 engineers

---

## Quick Links

- **[requirements.md](requirements.md)** - Business requirements, user stories, success criteria
- **[plan.md](plan.md)** - Implementation plan with 16 tasks
- **[temp/](temp/)** - Supporting documents (architecture, business case, etc.)

---

## Epic Structure

```
.claude/epics/nori-mvp-001/
├── README.md              # This file (navigation guide)
├── requirements.md        # WHAT and WHY we're building
├── plan.md                # HOW we'll build it (16 tasks)
└── temp/                  # Supporting documents
    ├── nori-architecture.md         # Technical architecture (600+ lines)
    ├── nori-business-case.md        # Market analysis, ROI (400+ lines)
    ├── nori-ready-to-build.md       # Quick start summary
    └── repos-update-summary.md      # Reference repo status
```

---

## What is Nori?

**Knowledge-First AI Collaboration Platform for Cross-Functional Teams**

Desktop application (Tauri + React) that enables engineers, PMs, POs, architects, CISO, and SRE teams to work with Claude AI through role-specific personalities and a visual knowledge management system.

---

## MVP Features

1. **Role Switcher** - 5 roles (PO, Architect, Engineer, CISO, SRE)
2. **Knowledge Browser** - Visual tree, search, preview
3. **Knowledge Editor** - CodeMirror 6 for creating/editing packages
4. **Chat Interface** - Claude SDK with streaming responses
5. **Knowledge Visibility** - See loaded packages
6. **Custom Hooks** - Execute hooks in any language

---

## Implementation Phases

**Phase 1: Foundation** (Weeks 1-4)
- Tauri project setup
- Role switcher (frontend + backend)

**Phase 2: Knowledge System** (Weeks 5-8)
- Knowledge indexing
- Browser UI + Editor

**Phase 3: Chat Interface** (Weeks 9-12)
- Claude SDK integration
- Chat UI + Context management

**Phase 4: Hooks & Polish** (Weeks 13-16)
- Hook execution engine
- Packaging + Testing + Documentation

---

## Getting Started

### 1. Review Requirements

Read [requirements.md](requirements.md) to understand:
- Problem we're solving
- Target users (PMs, POs, Architects, not just engineers)
- Success criteria
- Technical constraints

### 2. Review Plan

Read [plan.md](plan.md) to see:
- 16 implementation tasks
- Acceptance criteria per task
- Dependency chain
- Risk management

### 3. Start Implementation

Begin with TASK-001 (Tauri Project Setup):

```bash
cd app/
bunx create-tauri-app . --template react-ts
bun install
bun run tauri dev
```

Follow plan.md for task details.

---

## Supporting Documents

### Architecture (`temp/nori-architecture.md`)

**600+ lines** covering:
- Technology stack (Tauri, React, Rust, SQLite)
- Component diagrams
- File structure
- Response visualization (OpenCode style)
- User profiles
- Development roadmap

### Business Case (`temp/nori-business-case.md`)

**400+ lines** covering:
- Market analysis ($2.4B TAM)
- Revenue model (Freemium → Enterprise)
- Competitive landscape
- Go-to-market strategy
- Risk assessment
- Success metrics

### Ready to Build (`temp/nori-ready-to-build.md`)

**Summary document** with:
- Completed preparation checklist
- Next steps (immediate actions)
- File reference
- Commands to run

---

## Success Metrics

**MVP (Month 4)**:
- 100 active users
- 50%+ using non-engineer roles
- 500+ knowledge packages created
- <2s startup, <100ms search

**V1.0 (Month 8)**:
- 1,000 active users
- 10 paying customers
- $10K MRR

---

## Current Status

**Planning**: ✅ Complete
**Implementation**: 🔜 Ready to start
**Next Task**: TASK-001 (Tauri Project Setup)

---

## Questions?

Refer to:
- [requirements.md](requirements.md) for business questions
- [plan.md](plan.md) for implementation questions
- [temp/nori-architecture.md](temp/nori-architecture.md) for technical questions

---

**Let's build Nori.**
