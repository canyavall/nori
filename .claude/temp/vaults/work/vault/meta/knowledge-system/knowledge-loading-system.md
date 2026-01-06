# Knowledge Loading System

How commands load knowledge using knowledge-search.mjs and task-type tags.

## Two-Step Loading

1. **Always-load**: Core knowledge (nx-commands, react-components, testing-core)
2. **Task-specific**: Domain knowledge by task type (routing, testing, forms)

## Usage

**Basic load:**
```bash
node .ai/knowledge/scripts/knowledge-search.mjs \
  --command-profile plan \
  --agent-name plan-command \
  --agent-id "plan-123"
```

**With task type:**
```bash
node .ai/knowledge/scripts/knowledge-search.mjs \
  --command-profile plan \
  --task-type routing_implementation \
  --agent-name plan-command \
  --agent-id "plan-123"
```

Returns JSON with packages to read.

## Configuration (knowledge.json)

**Command profile:**
```json
"plan": {
  "always_load": ["nx-commands", "typescript-types", "react-components", "testing-core", "code-conventions"],
  "description": "/plan command creates planning documents."
}
```

**Knowledge package:**
```json
"react-router-v7-basics": {
  "tags": ["routing", "react-router"]
}
```

## Flow

1. Command calls script with profile + task-type (optional)
2. Script loads always_load packages
3. If tags provided: searches by tags
4. Returns matching packages (up to 15 by default)
5. Logs to tracker/tracker.jsonl
6. Command reads each file

## Loading Strategy

**Be liberal:** Load ALL packages with relevance_score >= 0.3
- Range: 8-15 packages (complex), 4-8 packages (simple)
- Better to load extra knowledge than miss critical context
- Reading is cheap (~2-3k tokens), missing patterns is expensive

## Domain and Language Filtering

### Domain Filtering
- **Wrong domain = score 0** (hard reject)
- Frontend/Backend/Infrastructure: NEVER load cross-domain packages
- Cross-cutting (standards/tooling): Allowed all domains, lower priority (0.7x)

### Language Filtering
- Detects from extension: `.ts`→typescript, `.java`→java, `.py`→python
- Rejects language-specific standards for wrong language
- Generic standards (testing, mocks) apply to all
- Supported: TypeScript, JavaScript, Java, Python, Go, Terraform, Rust, C#

### Example Filtering

**Frontend TS** (`Button.tsx`): Loads frontend/react, standards/testing. Rejects backend, infrastructure.
**Backend Java** (`UserService.java`): Loads backend/spring, standards/java. Rejects frontend, infra.
**No file path**: Prefers standards/tooling (0.8x), allows domain-specific (0.5x), no language filter.

## Profiles

See `knowledge.json` → `command_profiles.[profile].always_load`

Available profiles: `plan`, `implementation`
