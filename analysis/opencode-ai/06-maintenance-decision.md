# OpenCode - Maintenance Decision Analysis

## Context

This document evaluates whether we should adopt, fork, contribute to, or build alternatives to OpenCode for our needs. Critical context: the project is **archived** as of September 2025 and development continues as **Crush** by Charmbracelet.

## Key Factors

### License: MIT

**This is highly favorable.** The MIT License:
- Permits commercial use, modification, distribution, and private use
- Only requires license notice preservation
- Compatible with proprietary software
- No copyleft obligations

**Impact**: We can freely fork, modify, learn from, or integrate patterns from OpenCode without licensing concerns.

### Project Status: Archived

The repository was archived in September 2025 with a clear notice directing users to [Crush](https://github.com/charmbracelet/crush) (same primary author, Charmbracelet team).

**Implications**:
- No future bug fixes or security patches
- No new features or provider updates
- Issues and PRs are frozen
- Model definitions will become outdated over time
- But: the codebase represents a clean snapshot of a working system

### Successor: Crush (charmbracelet/crush)

| Attribute | OpenCode | Crush |
|-----------|----------|-------|
| Stars | ~11k | ~20k |
| License | MIT | "Other" (NOASSERTION on GitHub) |
| Status | Archived | Active development |
| Organization | opencode-ai | Charmbracelet |
| Same author? | Yes (kujtimiihoxha) | Yes |
| Language | Go | Go |

**Key concern**: Crush's license is listed as "Other" (NOASSERTION), which means it needs careful review before any adoption decision.

### Project Maturity

| Indicator | Assessment |
|-----------|------------|
| Version | v0.0.55 (pre-1.0) |
| Releases | 55 releases over ~3 months |
| Stars | ~11,000 (significant adoption) |
| Contributors | ~15 |
| Test coverage | Minimal (4 test files visible) |
| Documentation | Good README, no design docs |
| CI/CD | GitHub Actions (build + release) |
| Distribution | Homebrew, AUR, install script, go install |

**Assessment**: Functional and widely adopted but never reached 1.0 stability.

### Technical Quality

The codebase demonstrates strong Go engineering:
- Clean interfaces and service layer
- Generic pub/sub system
- Multi-provider abstraction
- Well-organized package structure
- Single-binary deployment

### Maintenance Burden

**What maintaining a fork would require**:

1. **Go expertise only**: Single language, no frontend framework (major advantage over Tauri/React tools)
2. **Provider SDK updates**: AI provider SDKs evolve rapidly (Anthropic, OpenAI, Google SDKs)
3. **Model registry updates**: New models released monthly, pricing changes
4. **Bubble Tea ecosystem**: Keep up with Charmbracelet library updates
5. **SQLite schema migrations**: Minimal (only 2 migrations in the original)
6. **Security monitoring**: Tool execution (bash, file writes) requires ongoing review

**Estimated effort to maintain actively**: 1 developer part-time, primarily for provider/model updates.

### What We Could Reuse

| Component | Reusability | Notes |
|-----------|------------|-------|
| Provider abstraction (interface + factory) | **Very High** | Clean Go interface, works for any provider |
| Tool system (BaseTool interface) | **Very High** | Simple, extensible, well-designed |
| PubSub event broker (generic) | **Very High** | Reusable in any Go project |
| Permission service pattern | **High** | Clean request/grant/deny with TUI integration |
| Session/message data model | **High** | SQLite schema + sqlc queries |
| Bubble Tea TUI patterns | **High** | Dialog overlay system, page switching, keybindings |
| Agent loop (stream + tool execution) | **High** | Core agentic pattern, well-implemented |
| System prompts (coder, summarizer) | **High** | Battle-tested prompts for coding assistance |
| Config system (Viper + env vars) | **Medium** | Standard Go config pattern |
| LSP integration | **Medium** | Useful but tightly coupled to their client impl |
| Theme system | **Medium** | Nice collection of terminal themes |
| Custom command system | **Medium** | Markdown files + named arguments is clever |
| Auto-compact (context summarization) | **High** | Critical for long sessions, well-implemented |
| File change tracking | **Medium** | Simple but effective history tracking |

### Alternatives to Consider

1. **Use Crush directly**: If Charmbracelet's license and direction align, Crush is the maintained successor with the same architecture
2. **Fork OpenCode**: MIT license makes this straightforward, but requires ongoing maintenance
3. **Extract patterns**: Study the architecture and build our own tool using the same patterns
4. **Use a different tool**: Claude Code, Aider, Continue, Cline, etc.

---

## Decision Matrix

| Factor | Score (1-5) | Weight | Notes |
|--------|-------------|--------|-------|
| License compatibility | 5 | Critical | MIT - fully compatible |
| Feature fit | 4 | High | Multi-provider, TUI, tools, sessions |
| Project maturity | 3 | High | Pre-1.0 but functional with 11k stars |
| Maintenance cost | 4 | High | Single language (Go), clean code |
| External dependency risk | 3 | Medium | Provider SDKs evolve, but abstraction is clean |
| Code quality | 4 | Medium | Good Go idioms, clean architecture |
| Community/support | 2 | Medium | Archived, no community support |
| Security posture | 3 | Medium | Permission system exists, but bash execution is inherently risky |

## Recommendations

### If we want a multi-provider terminal AI tool:
**Fork OpenCode** or **extract its patterns**. The MIT license, clean Go architecture, and single-binary deployment make it an excellent foundation. The main work would be updating provider SDKs and model definitions.

### If we want the latest features and active maintenance:
**Evaluate Crush** carefully, particularly its license terms. It has the same author, larger community (20k stars), and active development.

### If we're building our own tool:
**Extract architectural patterns from OpenCode.** The most valuable patterns are:
1. Provider interface + factory for multi-LLM support
2. BaseTool interface for extensible tool system
3. Generic PubSub broker for event-driven architecture
4. Agent loop (stream response -> execute tools -> repeat)
5. Permission service for interactive tool approval
6. Auto-compact for context window management

### If we just need multi-provider AI in Go:
**Use the provider abstraction directly.** The `internal/llm/provider/` package is well-designed and could be extracted as a standalone library with minimal modification.

---

## Summary

| Question | Answer |
|----------|--------|
| Should we use OpenCode as-is? | **No** - archived, will become outdated |
| Should we fork and maintain it? | **Maybe** - MIT license makes this viable, moderate effort |
| Should we evaluate Crush instead? | **Yes** - active successor, check license first |
| Should we learn from it? | **Absolutely** - excellent Go architecture for terminal AI tools |
| Should we extract patterns? | **Yes** - provider abstraction, tool system, agent loop, pubsub are all reusable |
| Should we build our own? | **If specific needs differ** - use OpenCode patterns as foundation |
