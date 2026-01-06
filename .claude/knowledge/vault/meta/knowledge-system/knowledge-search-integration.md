---
tags:
  - knowledge-system
  - search
  - hooks
  - integration
description: Hook and command integration with knowledge search
category: meta/knowledge-system
required_knowledge: []
---
# Knowledge Search Integration

How knowledge-search.mjs is integrated into hooks and workflows.

## Used by Hooks

**knowledge-prompt.mjs:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags [detected-tags] \
  --agent-name user \
  --agent-id "prompt-$(date +%s)"
```

The hook automatically detects relevant tags from the user's prompt and loads appropriate knowledge packages.

## Use Cases

### Manual Discovery

**Want to see routing knowledge:**
```bash
# List routing tags
node .claude/knowledge/scripts/knowledge-search.mjs --list-tags | grep routing

# Search routing knowledge
node .claude/knowledge/scripts/knowledge-search.mjs --tags routing

# Narrow by category
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags routing \
  --category frontend/routing
```

### Pre-Implementation Research

**Before implementing auth:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags authentication,rbac,access-control \
  --agent-name research \
  --agent-id "research-$(date +%s)"
# Read returned packages
```

### Context-Aware Loading

**Frontend TypeScript file:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags testing,jest \
  --file-path src/components/Button.test.tsx
# Result: Jest + React Testing Library
```

**Backend Java file:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags testing,mocking \
  --file-path src/main/java/UserService.java
# Result: JUnit + Mockito (NOT Jest)
```

### Cross-Cutting Concerns

**Generic patterns:**
```bash
node .claude/knowledge/scripts/knowledge-search.mjs --tags testing
# Result: Standards and cross-cutting (higher priority)
```

## Performance

**Token estimation:**
```json
{"token_estimate": 12500}
```
- Algorithm: chars ÷ 4 (rough estimate)
- Includes all package content + dependencies
- Use for pre-flight check before large loads

**Search performance:**
- Time: 50-100ms
- Reads: knowledge.json (cached)
- Writes: metrics.jsonl (if tracking enabled)
