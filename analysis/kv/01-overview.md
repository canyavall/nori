# KV (Knowledge Vault) - Project Overview

## What Is It

**KV** is a knowledge management system for Claude Code that integrates semantic knowledge retrieval, role-based context injection, and workspace synchronization through Claude Code's hook system. It maintains a vault of markdown knowledge packages that are automatically or manually injected into Claude's context based on what the developer is working on.

**Repository**: Private / ext-projects/code/kv
**License**: Proprietary
**Runtime**: Node.js (TypeScript, compiled to .mjs)
**Distribution**: Claude Code hooks + CLI skills

## What It Does

KV intercepts three Claude Code lifecycle events (SessionStart, UserPromptSubmit, PostToolUse) and injects relevant knowledge, role context, and session state to make Claude smarter about the project.

### 1. Session Lifecycle Management
- Creates and archives sessions with unique IDs
- Tracks loaded packages, prompt count, and events
- Produces session status reports on startup
- Auto-repairs broken KV structures

### 2. Knowledge Vault
- Indexes markdown knowledge packages organized by category
- Frontmatter-based metadata (tags, description, dependencies)
- Pattern-based auto-loading when files are read/edited/written
- Semantic smart agent matching via Claude API
- Manual load/search/preload via CLI skills
- Deduplication across injection methods per session

### 3. Role Injection
- Configurable AI role templates (staff_engineer default)
- Full role on session start (prompt 0)
- Brief reminders every 5th prompt (80% reduction)
- Custom role override support

### 4. Workspace Synchronization
- Pull-only sync with a git-based workspace repository
- 3-way merge detection (local/workspace/cache hashes)
- Vault-aware conflict handling: locally-modified vault files are never overwritten
- Two modes: check-only (session start) and full-sync (manual)

### 5. Distribution & Installation
- One-time install flow: clone workspace, copy files, register hooks, build index
- Settings.json hook registration, CLAUDE.md prepending, .gitignore updates
- Metadata tracking (version, SHA, distribution source)

## How It Works (High Level)

```
Claude Code Lifecycle
    │
    ├── SessionStart ──► kv-onStart hook
    │                     │
    │                     ├── Archive previous session
    │                     ├── Create new session
    │                     ├── Check workspace sync (read-only)
    │                     ├── Build knowledge index
    │                     ├── Preload configured packages
    │                     ├── Inject full role template
    │                     └── Output aggregated context
    │
    ├── UserPromptSubmit ──► kv-onPrompt hook
    │                         │
    │                         ├── Increment prompt count
    │                         ├── Check trivial prompt (skip if "yes", "ok", etc.)
    │                         ├── Smart agent: semantic match → packages
    │                         ├── Load matched knowledge content
    │                         ├── Role reminder (every 5th prompt)
    │                         └── Output transformed prompt with injections
    │
    └── PostToolUse ──► kv-onTool hook (Read/Edit/Write only)
                         │
                         ├── Extract file path from tool result
                         ├── Detect direct vault file reads
                         ├── Pattern match → auto-load packages
                         └── Output additionalContext
```
