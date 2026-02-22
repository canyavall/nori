# KV - Use Cases

## Primary Use Cases

### 1. Automatic Knowledge Injection on File Access
**Who**: Developers working across a codebase with established patterns and conventions.
**What**: When Claude reads, edits, or writes a file, KV matches the file path against auto-load patterns and injects relevant knowledge packages into context.
**Value**: Claude automatically learns project-specific conventions without the developer having to explain them every session. Reading a React component loads frontend patterns; editing an API route loads backend conventions.

### 2. Semantic Knowledge Matching on Prompts
**Who**: Developers asking Claude questions or requesting features.
**What**: On each user prompt, a smart agent (Claude API call) analyzes the prompt and matches it against the knowledge vault's category tree, injecting relevant packages.
**Value**: Claude receives domain-specific knowledge matched to the developer's intent, not just file patterns. Asking about "auth flow" loads security and auth packages even before touching auth files.

### 3. Role-Based Behavior Shaping
**Who**: Teams wanting consistent Claude behavior across sessions and developers.
**What**: Injects a role template (e.g., "staff_engineer") at session start and brief reminders every 5th prompt, shaping Claude's approach, tone, and priorities.
**Value**: Claude maintains a consistent engineering persona and follows team conventions without drift across long sessions.

### 4. Session-Scoped Knowledge Management
**Who**: Developers running long Claude Code sessions with many file interactions.
**What**: Tracks which knowledge packages have already been loaded per session, preventing duplicate injection and optimizing context window usage.
**Value**: No wasted context tokens on redundant knowledge. Each package is injected at most once per session regardless of how many times the trigger fires.

### 5. Team Knowledge Distribution
**Who**: Teams sharing engineering standards, conventions, and domain knowledge.
**What**: A central workspace repository contains the vault, templates, and configuration. KV syncs from this repository on session start, with vault-aware conflict handling that preserves local customizations.
**Value**: One team member updates a knowledge package, and it flows to all developers on next session. Local vault edits are never overwritten.

## Secondary Use Cases

### 6. Manual Knowledge Loading
Developers can explicitly load specific packages via `/kv-load package1,package2` when they know they need particular context that hasn't been auto-triggered.

### 7. Knowledge Search & Discovery
Search the vault by tags, categories, or text via `/kv-search` to discover available knowledge packages and understand what context is available.

### 8. Knowledge Package Creation
Create new knowledge guides with proper frontmatter scaffolding via `/kv-create` for team-specific conventions, patterns, or domain knowledge.

### 9. Session Preloading
Configure packages that always load on session start (via `vault.preload` in kv.json) for foundational knowledge that every session needs regardless of context.

### 10. Autoload Exception Control
Exclude specific file patterns from triggering auto-loads (via `vault.autoloadExceptions`) to prevent noise from test files, generated code, or other low-signal paths.

## Limitations

- **Claude Code only**: Deeply integrated with Claude Code's hook system; not portable to other AI tools
- **Token overhead**: Knowledge injection consumes context window; mitigated by deduplication and limits (15 auto-load, 10 smart agent)
- **Smart agent latency**: Semantic matching requires a Claude API call (~15s timeout), adding latency to prompts
- **Trivial prompt bypass**: Short/confirmatory prompts skip smart agent, potentially missing relevant context on terse but meaningful prompts
- **Pull-only sync**: No push capability; local changes must be manually committed to the workspace repository
- **Single vault structure**: Knowledge organized by category only; no support for project-specific vault overlays
- **Role templates**: Text-based only; no structured configuration for role behavior beyond template content
