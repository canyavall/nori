# claude-code-safety-net - Technology Stack

## Runtime & Build

| Technology | Purpose |
|------------|---------|
| **Bun** | Primary runtime, package manager, test runner |
| **Node.js 18+** | Alternative runtime (compatible) |
| **TypeScript** | Language (100% typed) |

## Core Dependencies

| Technology | Version | Purpose |
|------------|---------|---------|
| **shell-quote** | 1.8.3 | Shell command parsing (tokenization without variable expansion) |

## Development Dependencies

| Technology | Purpose |
|------------|---------|
| **Biome** | Linting and formatting |
| **TypeScript** | Type checking |
| **Zod** | Peer dependency (for OpenCode plugin interface) |
| **@ast-grep/cli** | AST-based code search |
| **Knip** | Dead code detection |
| **Husky** | Git hooks (pre-commit) |
| **lint-staged** | Run linters on staged files |

## Testing

| Technology | Purpose |
|------------|---------|
| **Bun test** | Native test runner |
| Custom helpers | `assertBlocked()`, `assertAllowed()`, `runGuard()`, `withEnv()` |

## Platform Integrations

| Platform | Hook Type | Integration Method |
|----------|-----------|-------------------|
| **Claude Code** | PreToolUse | Plugin marketplace (automatic) |
| **OpenCode** | tool.execute.before | Plugin config in opencode.json |
| **Gemini CLI** | BeforeTool | Extension (hook script) |
| **Copilot CLI** | preToolUse | Project-level `.github/hooks/safety-net.json` |

## Data Storage

| Store | Format | Location |
|-------|--------|----------|
| Audit logs | JSONL | `~/.cc-safety-net/logs/<session_id>.jsonl` |
| User config | JSON | `~/.cc-safety-net/config.json` |
| Project config | JSON | `.safety-net.json` (project root) |

## Key Internal Modules

| Module | Purpose |
|--------|---------|
| `shell-quote` wrapper | Proxied parsing that preserves `$VAR` references |
| Command segmenter | Splits on `&&`, `||`, `|`, `;`, `\n` operators |
| Git analyzer | Rule-based analysis per git subcommand |
| Rm analyzer | Path classification (root/home/cwd/temp/outside) |
| Find/xargs/parallel analyzers | Dynamic command expansion analysis |
| Interpreter detector | python/node/ruby/perl `-c`/`-e` code scanning |
| Secret redactor | Regex-based redaction of tokens, passwords, API keys |
