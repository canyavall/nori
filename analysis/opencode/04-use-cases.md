# OpenCode - Use Cases & Maintenance Decision

## Primary Use Cases

### 1. Local AI Coding Agent (Any Provider)
**Who**: Any developer who wants AI-assisted coding without vendor lock-in.
**What**: Run a full coding agent locally with any LLM provider.
**Value**: Switch between Claude, GPT, Gemini, local models, etc. As prices drop and models improve, you're never locked in.

### 2. Terminal-First Development
**Who**: Neovim users, terminal enthusiasts, SSH-based workflows.
**What**: Full-featured TUI with SolidJS rendered to ANSI terminal at 60fps.
**Value**: No browser or GUI needed. Works over SSH, in tmux, on headless servers.

### 3. Remote/Mobile Access
**Who**: Developers who want to drive coding from a phone or browser.
**What**: Client/server architecture — server runs on your machine, drive it from any client.
**Value**: Start a session on your laptop, continue from your phone on the couch.

### 4. Enterprise Team Collaboration
**Who**: Teams and organizations.
**What**: Cloud-hosted workspace with shared sessions, billing, team management.
**Value**: Centralized cost management, shared agent configurations, compliance.

### 5. Custom Tool/Plugin Development
**Who**: Teams with specific workflows.
**What**: Plugin system for custom tools, auth providers, and integrations.
**Value**: Extend OpenCode for your specific needs without forking.

### 6. IDE Integration (VS Code)
**Who**: VS Code users.
**What**: Native extension with quick launch, context sharing, file references.
**Value**: Seamless integration with existing workflow.

### 7. Code Intelligence via LSP
**Who**: Developers wanting smarter AI assistance.
**What**: Built-in LSP integration feeds type errors, diagnostics to the AI.
**Value**: AI sees your compiler errors in real-time and can fix them more accurately.

### 8. Slack Bot Integration
**Who**: Teams using Slack for development coordination.
**What**: Slack bot that creates OpenCode sessions in threaded conversations.
**Value**: Ask coding questions directly in Slack, get AI-assisted answers.

---

## Maintenance Decision

### License: MIT
**This is the key differentiator from Opcode.** MIT license means:
- Full freedom to use, modify, distribute
- Compatible with proprietary software
- No copyleft obligations
- Can incorporate into any project

### Project Health

| Indicator | Assessment |
|-----------|------------|
| Version | 1.2.6 (mature, 716 releases) |
| Stars | 106k+ |
| Contributors | 752 |
| Commits | 9,346 |
| Downloads | 747k+ |
| Published binaries | Yes (all platforms) |
| Test coverage | Playwright + unit tests |
| Documentation | Full docs site (opencode.ai/docs) |
| Community | Active Discord, vouch system |
| Funding | Enterprise SaaS revenue (Stripe billing) |

**Assessment**: Production-ready, actively maintained, well-funded project.

### What We Could Reuse

| Component | Reusability | License |
|-----------|------------|---------|
| Tool system architecture | Very High | MIT |
| Permission model (ask/allow/deny) | Very High | MIT |
| Multi-provider abstraction | Very High | MIT |
| Event bus pattern | High | MIT |
| Session/message data model | High | MIT |
| Skill system (markdown) | High | MIT |
| Plugin system | High | MIT |
| Agent definitions | High | MIT |
| TUI architecture (SolidJS + OpenTUI) | Medium | MIT |
| SDK generation pattern | Medium | MIT |
| LSP integration | Medium | MIT |

### Recommendations

**If we need an AI coding tool**:
Use OpenCode directly. It's MIT-licensed, production-ready, provider-agnostic, and has all features we'd need.

**If we're building something similar**:
Study and reuse OpenCode's patterns freely (MIT license). Key learnings:
- Client/server split with SSE streaming
- Provider-agnostic via Vercel AI SDK
- Permission system with ask/allow/deny
- Tool registry pattern with Zod validation
- Drizzle ORM + SQLite for local storage
- SolidJS for all UI surfaces (web, desktop, terminal)

**If we want to extend it**:
Use the plugin system. Build custom tools, auth providers, and skills without forking.

**If we need enterprise features**:
Either use their SaaS or build our own on top of the open-source core (MIT allows this).
