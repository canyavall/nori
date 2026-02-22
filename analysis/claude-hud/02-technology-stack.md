# claude-hud - Technology Stack

## Runtime & Build

| Technology | Purpose |
|------------|---------|
| **Node.js 18+** | Runtime (zero external dependencies) |
| **TypeScript** | Language |

## Dependencies

**Zero npm dependencies.** Everything is implemented with Node.js built-in modules:

| Built-in Module | Purpose |
|-----------------|---------|
| `fs` / `fs/promises` | File reading (config, transcript, cache, credentials) |
| `path` | Path manipulation |
| `child_process` | `execFile` for git commands and extra commands |
| `https` | Anthropic API requests |
| `readline` | Transcript JSONL line-by-line parsing |
| `os` | Home directory, platform detection |

## Data Sources

| Source | Method | Data Provided |
|--------|--------|---------------|
| **stdin JSON** | Piped by Claude Code every ~300ms | Model, tokens, context window, transcript path, cwd |
| **Transcript JSONL** | File read from path in stdin | Tools, agents, todos, session start time |
| **Git CLI** | `execFile` with 1s timeout | Branch, dirty, ahead/behind, file stats |
| **Anthropic OAuth API** | HTTPS GET with Bearer token | 5-hour and 7-day usage percentages, reset times |
| **macOS Keychain** | `security find-generic-password` | OAuth credentials (Claude Code 2.x) |
| **Credentials file** | File read | OAuth credentials (legacy: `~/.claude/.credentials.json`) |
| **Settings files** | File read | MCPs, hooks, rules counts |
| **CLAUDE.md files** | File existence check | Configuration counts |

## Configuration

| Store | Format | Location |
|-------|--------|----------|
| Plugin config | JSON | `~/.claude/plugins/claude-hud/config.json` |
| Usage cache | JSON | `~/.claude/plugins/claude-hud/.usage-cache.json` |
| Speed cache | JSON | `~/.claude/plugins/claude-hud/.speed-cache.json` |
| Keychain backoff | File | `~/.claude/plugins/claude-hud/.keychain-backoff` |

## Rendering

| Technique | Purpose |
|-----------|---------|
| **ANSI escape codes** | Colors (32m green, 33m yellow, 31m red, 36m cyan, 35m magenta, 2m dim) |
| **Block characters** | Progress bars (█ filled, ░ empty) |
| **Unicode symbols** | Indicators (◐ running, ✓ completed, ▸ in-progress, ↑↓ ahead/behind) |

## Architecture Patterns

| Pattern | Purpose |
|---------|---------|
| **Dependency injection** | `main(overrides)` for testability |
| **Graceful degradation** | Null values handled throughout, errors logged to stderr |
| **File-based caching** | Usage API (60s success, 15s failure), speed tracking |
| **Keychain backoff** | Prevents macOS Keychain re-prompting (60s backoff) |

## Claude Code Integration

| Requirement | Detail |
|-------------|--------|
| Minimum version | Claude Code v1.0.80+ |
| Invocation | Statusline command, called every ~300ms |
| Protocol | stdin JSON → stdout ANSI text |
| Registration | `statusLine.command` in `~/.claude/settings.json` |
