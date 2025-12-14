# Prompt Caching

## What Gets Cached

**System prompt ONLY** (not messages)

```json
{
  "system": "...",  // ← CACHED (5 min TTL)
  "messages": [...] // ← NEVER CACHED
}
```

**Cost:**
- First use: $3/M tokens
- Cached: $0.30/M tokens (90% discount)
- Messages: $3/M tokens (always)

---

## Multi-Agent Caching

```
Agent 1:
system: [Base + KNOWLEDGE.md] → $X (first time)

Agent 2:
system: [Base + KNOWLEDGE.md] → $0 (cache hit!)

Agent 3:
system: [Base + KNOWLEDGE.md] → $0 (cache hit!)
```

**Total:** Pay once, free for 5 minutes

---

## Single-Agent Problem

```
Turn 1:
system: [Base]
messages: [KNOWLEDGE.md + prompt] → Pay $X

Turn 2:
system: [Base]
messages: [KNOWLEDGE.md + prompt + response + new prompt] → Pay $Y (more)

Turn 3:
system: [Base]
messages: [Everything above + more] → Pay $Z (even more)
```

**Total:** Pay every turn, context grows

---

## Solution

**Put knowledge in system prompt, not messages**

```
✅ Good:
system: [Base + KNOWLEDGE.md]  // Cached
messages: ["Do the task"]

❌ Bad:
system: [Base]
messages: ["KNOWLEDGE.md + Do the task"]  // Paid every turn
```

---

## Where to Put Knowledge

**File:** `CLAUDE.md` or `KNOWLEDGE.md` in project root

**OpenCode automatically loads it into system prompt**

**Result:** Cached across all agents, free after first use

---

## Cache Lifespan

- **5 minutes** from last use
- Resets on each request with same system prompt
- Per-user, per-model
- Exact string match required

**Tip:** Keep system prompt stable for maximum cache hits
