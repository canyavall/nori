# ccusage - Technology Stack

## Runtime & Build

| Technology | Purpose |
|------------|---------|
| **Bun** | Primary runtime, package manager, script runner |
| **Node.js 18+** | Alternative runtime (compatible) |
| **TypeScript** | Language (100% typed) |

## Core Dependencies

| Technology | Purpose |
|------------|---------|
| **Gunshi** | CLI framework (command routing, argument parsing) |
| **Valibot** | Schema validation for JSONL entries and config (lighter alternative to Zod) |
| **fast-sort** | High-performance array sorting |
| **consola** | Structured logging with log levels |
| **cli-table3** | Terminal table rendering (via @ccusage/terminal) |
| **chalk** | Terminal color output |
| **jq** (external) | Optional JSON filtering (via `--jq` flag) |

## Error Handling

| Technology | Purpose |
|------------|---------|
| **@praha/byethrow** | Functional error handling (Result types, no try/catch) |

## Monorepo Structure

| Package | Purpose |
|---------|---------|
| `apps/ccusage` | Main CLI application |
| `packages/internal` | Shared utilities: pricing, logging, constants |
| `packages/terminal` | Terminal rendering: tables, formatting, responsive layout |

## Pricing Integration

| Technology | Purpose |
|------------|---------|
| **LiteLLM** | Public pricing database for 100+ LLM models |
| Offline cache | Embedded snapshot of Claude model pricing for `--offline` mode |

## Data Sources

| Source | Format | Location |
|--------|--------|----------|
| Claude Code sessions | JSONL | `~/.config/claude/projects/**/*.jsonl` |
| Claude Code sessions (legacy) | JSONL | `~/.claude/projects/**/*.jsonl` |
| Configuration | JSON | `.ccusage/ccusage.json`, `~/.config/claude/ccusage.json` |

## Testing

| Technology | Purpose |
|------------|---------|
| **Bun test** | Native test runner |
| **Valibot** | Schema-based test assertions |

## Documentation

| Technology | Purpose |
|------------|---------|
| **VitePress** | Documentation site (docs/ directory) |
| JSON Schema | Config file schema for IDE autocomplete |
