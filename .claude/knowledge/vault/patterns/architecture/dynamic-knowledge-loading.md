# Dynamic Knowledge Loading

Tag-based dynamic knowledge loading architecture for AI CLI tools. Implements selective knowledge injection with system prompt caching.

## The Problem

150+ knowledge files but can't load all at once. Need tag-based selective loading.

## Architecture

```
Orchestration Script
├─ Analyze ticket → tags
├─ Load knowledge based on tags
├─ Write to .opencode/dynamic-knowledge.md
├─ Execute command (OpenCode loads dynamic knowledge)
└─ Reuse same session for next command
```

## Implementation

**Modify OpenCode** (4 lines in `session/system.ts`):

```typescript
const DYNAMIC_KNOWLEDGE = path.join(Instance.directory, ".opencode", "dynamic-knowledge.md")

if (await Bun.file(DYNAMIC_KNOWLEDGE).exists()) {
  paths.add(DYNAMIC_KNOWLEDGE)
}
```

**Knowledge Registry** (`knowledge-map.ts`):

```typescript
export const KNOWLEDGE_MAP = {
  "auth": ["knowledge/domain/auth.md"],
  "payments": ["knowledge/domain/payments.md"],
  "testing": ["knowledge/patterns/testing.md"]
}
```

## System Prompt Composition

```
System Prompt:
├─ Base (Claude identity)
├─ Agent prompt
├─ CLAUDE.md
└─ dynamic-knowledge.md ← Loaded files here
    ├─ core files (always)
    └─ tagged files (selective)

Cached: YES (free after 1st call)
```

## Cost Comparison

- Dynamic loading: $0.67/workflow (44% savings vs multi-agent)
- System prompt cached after first use
- Knowledge always relevant
