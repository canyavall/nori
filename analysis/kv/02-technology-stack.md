# KV - Technology Stack

## Runtime & Build

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime |
| **TypeScript** | Language (compiled to .mjs ES modules) |

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `minimatch` | Glob pattern matching for auto-load rules |
| `child_process` | Flow execution, smart agent invocation, git operations |
| `fs` / `fs/promises` | File I/O (state, config, vault, index) |
| `path` | Path manipulation |
| `crypto` | SHA-256 hashing for sync state |
| `claude` CLI | Smart agent semantic matching (`claude --print`) |

## Data Sources

| Source | Method | Data Provided |
|--------|--------|---------------|
| **Claude Code hooks** | stdin JSON (SessionStart, UserPromptSubmit, PostToolUse) | Session ID, transcript path, user prompt, tool results |
| **Vault markdown files** | File read from `.claude/kv/vault/` | Knowledge content organized by category |
| **Knowledge index** | `knowledge.json` (generated) | Package metadata, tags, categories, auto_load flags |
| **Session state** | JSON file in `sessions/` | Loaded packages, prompt count, session ID |
| **kv.json config** | File read from `.claude/kv.json` | Git origin, preload list, role config, autoload exceptions |
| **Git repository** | Clone/pull operations | Workspace files for sync |
| **Claude API** | `claude --print` invocation | Smart agent semantic matching results |

## Configuration

| Store | Format | Location |
|-------|--------|----------|
| KV config | JSON | `.claude/kv.json` |
| Knowledge index | JSON (generated) | `.claude/kv/knowledge.json` |
| Session state | JSON | `.claude/kv/sessions/{id}-state.json` |
| Session events | JSONL | `.claude/kv/sessions/{id}-events.jsonl` |
| Sync state | JSON | `.claude/kv/.cache/sync-state.json` |
| Vault pull state | JSON | `.claude/kv/.cache/vault-pull-state.json` |
| System metadata | JSON | `.claude/kv/system/metadata.json` |
| Role templates | TXT | `features/role/inject/templates/*.txt` |

## Integration Points

| Integration | Protocol | Direction |
|-------------|----------|-----------|
| **SessionStart hook** | stdin JSON → stdout context | Bidirectional |
| **UserPromptSubmit hook** | stdin JSON → stdout transformed prompt | Bidirectional |
| **PostToolUse hook** | stdin JSON → stdout additionalContext | Bidirectional |
| **CLI skills** | `/kv-install`, `/kv-search`, `/kv-load`, `/kv-preload`, `/kv-create` | User-initiated |
| **settings.json** | Hook registration | Write on install |
| **CLAUDE.md** | KV documentation prepended | Write on install |
| **.gitignore** | KV patterns added | Write on install |

## Architecture Patterns

| Pattern | Purpose |
|---------|---------|
| **Feature-based modules** | Each feature (session, knowledge, role, distribution) self-contained |
| **Hook → Flow → Action** | Entry points delegate to orchestrators, which call atomic actions |
| **Fail-open degradation** | Errors never block Claude Code; hooks exit 0 always |
| **Atomic file writes** | Temp file + rename for state and metadata |
| **Session-scoped deduplication** | `loaded_packages` prevents re-injection per session |
| **Child flow execution** | Features invoke each other via `executeFlow()` subprocess spawning |
| **Mtime-based fast paths** | Knowledge index rebuild skipped if vault unchanged |
