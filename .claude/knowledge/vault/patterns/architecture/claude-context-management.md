# Claude Context Management

Context management patterns for Claude-based CLI tools. Covers agent isolation vs context continuity tradeoffs, caching strategies, and cost optimization.

## Multi-Agent Pattern (Garbage Collection)

```
Agent 1 → Work → Cleanup (garbage collected)
Agent 2 → Work → Cleanup (garbage collected)
Agent 3 → Work → Cleanup (garbage collected)
```

**Pros**: Clean context (15-25KB per agent), tool restrictions enforced, system prompt cached
**Cons**: Context NOT shared between agents, lower quality

**Cost**: Lower | **Quality**: Lower | **Context**: Controlled

## Single Agent Pattern (Continuous Context)

```
Agent → Work → Keep context → More work → Keep context...
```

**Pros**: Full context sharing, agent remembers everything, higher quality
**Cons**: Context grows (120KB → 540KB+), hits limits faster, higher cost

**Cost**: Higher (2-3x) | **Quality**: Higher | **Context**: Grows

## Prompt Caching Strategy

**System prompt ONLY gets cached** (5 min TTL, 90% discount)

```json
{
  "system": "...",  // ← CACHED ($0.30/M tokens)
  "messages": [...] // ← NEVER CACHED ($3/M tokens)
}
```

**Put knowledge in system prompt, not messages** for maximum cache hits.

## Context Growth Limits

Claude Sonnet 4: 200K tokens (~800KB text)

- Multi-agent: Can run for hours (each agent ~20KB)
- Single-agent: Hits limit after ~10-15 complex turns

## Decision Matrix

**Use Multi-Agent when**: Independent tasks, need tool restrictions, cost is priority

**Use Single-Agent when**: Tasks require deep context, quality is priority, willing to pay 2-3x for better results
