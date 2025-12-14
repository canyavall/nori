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
4. Returns matching packages
5. Logs to tracker/tracker.jsonl
6. Command reads each file

## Profiles

See `knowledge.json` → `command_profiles.[profile].always_load`

Available profiles: `plan`, `implementation`
