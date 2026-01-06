# Nori MVP - Requirements

**Epic ID**: nori-mvp-001
**Status**: Planning
**Owner**: Engineering Team
**Timeline**: 16 weeks (4 months)

---

## Business Context

### Problem Statement

Current AI coding tools (Claude Code, OpenCode) are:
- Terminal-based (intimidating for non-engineers)
- Engineer-focused (no differentiation for PMs, POs, Architects)
- Knowledge is hidden (users don't know what AI "knows")
- No knowledge curation (can't browse/edit/create knowledge packages)
- Single-user oriented (no team collaboration primitives)

### Target Users

**Primary**:
- Product Owners (PO)
- Architects (Staff Engineers)
- Engineers (FE/BE)
- CISO (Security)
- Infrastructure/SRE

**Market**: Software product teams (50-500 people)
- 40% engineers
- 60% non-engineers (PMs, POs, Architects, CISO, SRE)

### Value Proposition

**For Individuals**:
"Use Claude AI with role-appropriate personality and visible knowledge system"

**For Teams**:
"Build institutional AI knowledge that compounds over time, accessible to entire product organization"

---

## WHAT We're Building

### Core Features (MVP)

1. **Role Switcher**
   - Dropdown selector for 5 roles
   - Role-specific personalities (PO, Architect, Engineer, CISO, SRE)
   - Visual indicator of active role
   - Personality text loaded from templates
   - Keyboard shortcut support

2. **Knowledge Browser**
   - Visual tree view of knowledge packages
   - Category organization (Core, Patterns, Business, Meta)
   - Real-time search and filtering
   - Package preview on selection
   - "Create Package" button
   - Collapsible sidebar

3. **Knowledge Editor**
   - CodeMirror 6 integration
   - YAML frontmatter editing (tags, category, description)
   - Markdown syntax highlighting
   - Live preview (optional)
   - Save to local `.nori/knowledge/` directory
   - Validation of required fields

4. **Chat Interface**
   - Claude SDK integration (streaming responses)
   - Message history with auto-scroll
   - Code blocks with syntax highlighting
   - Tool call visualization (Read, Write, Bash, etc.)
   - User input field with multiline support
   - Context window tracking (tokens)

5. **Knowledge Visibility**
   - Badge showing count of loaded packages
   - Expandable list of package names
   - Tooltip with package descriptions
   - Updates when role changes

6. **Custom Hooks System**
   - Execute hooks at lifecycle events
   - Support any executable (Node.js, Rust, Python, shell)
   - JSON I/O (stdin/stdout)
   - Events: UserPromptSubmit, PreToolUse, PostToolUse, SessionStart, SessionEnd
   - Hook configuration UI
   - Execution logs and debugging

### Out of Scope (V1.0+)

- ❌ Remote knowledge sync (Git/S3)
- ❌ Multi-window support
- ❌ Jobs/parallelization
- ❌ Team collaboration features
- ❌ Mobile applications
- ❌ Enterprise SSO
- ❌ Plugin marketplace

---

## WHY We're Building This

### Market Opportunity

**TAM** (Total Addressable Market): 10M software professionals globally → $2.4B/year
**SAM** (Serviceable): 1M early adopters → $240M/year
**SOM** (Year 1): 10K users → $2.4M/year

### Competitive Advantage

**Competitors can copy code. They CANNOT copy thousands of curated knowledge packages.**

**Differentiation**:
- Only tool for non-engineers (PMs, POs)
- Visual knowledge management (not hidden)
- Role-based personalities
- Desktop GUI (not terminal)
- Knowledge compounds over time

### Success Metrics

**MVP (Month 4)**:
- 100 active users
- 50%+ using non-engineer roles (PO, Architect, CISO, SRE)
- 500+ knowledge packages created by community
- <2s app startup time
- <100ms knowledge search latency

**V1.0 (Month 8)**:
- 1,000 active users
- 10 paying customers (Pro or Enterprise)
- $10K MRR

**V2.0 (Month 12)**:
- 5,000 active users
- $100K ARR
- 50 enterprise customers

---

## Technical Constraints

### Technology Decisions

**Desktop Framework**: Tauri 2.0
- Why: 3MB bundle vs 100MB Electron, better performance, Rust backend
- Trade-off: Smaller ecosystem, Rust learning curve

**Frontend**: React 18 + TypeScript
- Why: Proven, large ecosystem, team expertise
- Trade-off: Heavier than Solid.js/Svelte

**State Management**: Zustand
- Why: Lightweight, no boilerplate
- Trade-off: Less tooling than Redux

**Code Editor**: CodeMirror 6
- Why: Modern, extensible, good performance
- Trade-off: Learning curve vs Monaco

**Database**: SQLite
- Why: Local-first, simple, no server
- Trade-off: Not suitable for remote sync (V1.0 problem)

**AI**: Anthropic Claude SDK
- Why: Best SWE-bench (72.7%), official SDK
- Trade-off: Locked to Anthropic (multi-LLM is V2.0+)

### Non-Functional Requirements

**Performance**:
- App startup: <2s
- Knowledge search: <100ms
- Chat response latency: <500ms (first token)
- Memory usage: <200MB idle, <500MB active

**Security**:
- API keys encrypted in SQLite
- File path validation (prevent directory traversal)
- Hook execution timeout (30s default)
- Sandboxed by default (Tauri)

**Compatibility**:
- macOS 11+ (Intel + Apple Silicon)
- Windows 10+ (x64)
- Linux (optional for MVP)

**Accessibility**:
- Keyboard navigation for all features
- Screen reader support (basic)
- High contrast theme support

---

## Dependencies

### External

- Anthropic API access (users provide own API key)
- Tauri 2.0 (stable as of Dec 2024)
- CodeMirror 6 (stable)
- Bun runtime (or Node.js 18+)

### Internal

- 43 existing knowledge packages (ready)
- Personality templates (5 roles, ready)
- Hook examples (ready)
- Reference implementations (OpenCode, Claude Code, ClaudeCodeUI)

---

## Risks and Mitigations

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Tauri instability | High | Low | Proven in 2.0, fallback to Electron |
| Claude SDK changes | Medium | Medium | Abstract behind interface layer |
| Performance issues | Medium | Low | Profile early (Week 8), optimize rendering |
| Rust learning curve | Medium | High | Use Node.js sidecar for complex logic initially |

### Market Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Claude Code adds knowledge UI | High | Medium | Nori is open source, multi-LLM future |
| Low adoption by non-engineers | High | Medium | UX testing with PMs/POs (Week 14) |
| Crowded AI tools market | Medium | High | Focus on knowledge moat, not chat UI |

### Execution Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Scope creep | High | High | Strict MVP scope enforcement |
| Team capacity | Medium | Medium | 2 engineers dedicated, no context switching |
| Technical debt | Medium | Medium | 80%+ test coverage requirement |

---

## Acceptance Criteria (MVP)

### Functional

1. ✅ Can switch between 5 roles (PO, Architect, Engineer, CISO, SRE)
2. ✅ Can browse knowledge packages in tree view
3. ✅ Can search knowledge packages by tags or text
4. ✅ Can create new knowledge packages via editor
5. ✅ Can edit existing knowledge packages
6. ✅ Can send messages to Claude and receive streaming responses
7. ✅ Can see which knowledge packages are loaded
8. ✅ Can execute custom hooks at lifecycle events
9. ✅ Sessions persist across app restarts

### Non-Functional

1. ✅ App starts in <2 seconds
2. ✅ Knowledge search returns results in <100ms
3. ✅ No critical bugs (P0)
4. ✅ 80%+ test coverage
5. ✅ Works on macOS and Windows
6. ✅ 3 alpha users test successfully
7. ✅ README with installation and usage instructions

---

## User Stories

### As a Product Owner

> "I want to ask business questions to Claude without getting technical jargon, so I can make informed product decisions quickly."

**Acceptance**:
- Select "PO" role from dropdown
- Ask "What features should we prioritize for Q2?"
- Receive product-focused response (not technical implementation details)

### As an Engineer

> "I want to browse available knowledge packages before starting a task, so I know what patterns and standards to follow."

**Acceptance**:
- Open knowledge browser
- Search for "testing"
- See all testing-related packages
- Preview package contents
- Understand what knowledge AI will use

### As an Architect

> "I want to create reusable knowledge about our architecture decisions, so future team members can leverage our institutional knowledge."

**Acceptance**:
- Click "Create Package" button
- Fill in frontmatter (tags, category, description)
- Write markdown content (architecture decision record)
- Save package
- Package appears in knowledge browser
- AI uses package in future conversations

### As a CISO

> "I want to execute custom security validation hooks before AI modifies code, so I can enforce security policies."

**Acceptance**:
- Write security validation hook (bash/node/python)
- Place in `.nori/hooks/PreToolUse/`
- Hook executes before Write tool
- Hook blocks dangerous operations (e.g., hardcoded credentials)
- See hook execution logs

---

## Open Questions

1. **Knowledge package limit**: Should MVP have a package limit (e.g., 100)? Or unlimited?
   - Decision: Unlimited for MVP (limit in Free tier post-MVP)

2. **API key storage**: Encrypt in SQLite or use OS keychain?
   - Decision: Encrypt in SQLite (simpler, cross-platform)

3. **Hook timeout**: 30s default reasonable? Configurable?
   - Decision: 30s default, configurable in settings UI (V1.0)

4. **Knowledge search**: Full-text search or tag-only?
   - Decision: Both (search descriptions with full-text, filter by tags)

5. **Session storage**: How many messages to keep in history?
   - Decision: Unlimited (user can delete old sessions manually)

---

## Definition of Done

- ✅ All 16 tasks in plan.md completed
- ✅ All acceptance criteria met
- ✅ 80%+ test coverage
- ✅ No P0 bugs
- ✅ Documentation complete (README, ARCHITECTURE, hook guide, knowledge guide)
- ✅ 3 alpha users tested successfully
- ✅ Distributable binaries (macOS DMG, Windows MSI)

---

**Status**: ✅ Requirements approved
**Next**: See plan.md for implementation tasks
