# Context Growth Patterns

## Multi-Agent (Garbage Collection)

```
Agent 1:
messages: [user, assistant] = 20KB
→ Agent ends, context freed ♻️

Agent 2:
messages: [user, assistant] = 25KB
→ Agent ends, context freed ♻️

Agent 3:
messages: [user, assistant] = 15KB
→ Agent ends, context freed ♻️
```

**Each agent:** Fresh start, ~20KB
**Total max:** 25KB at any time

---

## Single-Agent (No Cleanup)

```
Turn 1:
messages: [user, assistant] = 20KB

Turn 2:
messages: [turn1 + user, assistant] = 45KB

Turn 3:
messages: [turn1 + turn2 + user, assistant] = 75KB

Turn 4:
messages: [turn1 + turn2 + turn3 + user, assistant] = 115KB
```

**Context grows:** 20KB → 115KB+
**No cleanup** until agent ends

---

## With KNOWLEDGE.md

### Multi-Agent
```
Agent 1:
system: [KNOWLEDGE.md] (cached)
messages: [work] = 5KB
Total input: ~5KB paid

Agent 2:
system: [KNOWLEDGE.md] (cached)
messages: [work] = 10KB
Total input: ~10KB paid
```

### Single-Agent
```
Turn 1:
messages: [KNOWLEDGE + work] = 105KB paid

Turn 2:
messages: [KNOWLEDGE + turn1 + work] = 150KB paid

Turn 3:
messages: [KNOWLEDGE + turn1 + turn2 + work] = 205KB paid
```

**KNOWLEDGE.md repeated every turn if in messages!**

---

## Context Limits

Claude Sonnet 4: 200K tokens (~800KB text)

**Multi-agent:** Can run for hours (each agent ~20KB)
**Single-agent:** Hits limit after ~10-15 complex turns

---

## The Tradeoff

**Multi-agent:**
- ✅ Context controlled
- ❌ Context lost between agents
- ❌ Lower quality

**Single-agent:**
- ✅ Full context retained
- ✅ Higher quality
- ❌ Context explodes
- ❌ Hits limits faster

**Your choice:** Quality vs Sustainability
