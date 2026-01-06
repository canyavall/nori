# Agent vs Single Context: The Tradeoff

## Multi-Agent Pattern

```
Agent 1 → Work → Cleanup (garbage collected)
Agent 2 → Work → Cleanup (garbage collected)
Agent 3 → Work → Cleanup (garbage collected)
```

**Pros:**
- Clean context (15-25KB per agent)
- Tool restrictions enforced
- System prompt cached (almost free)

**Cons:**
- Context NOT shared between agents
- Each agent starts fresh
- Lower quality (lacks previous context)
- More orchestration overhead

**Cost:** Lower
**Quality:** Lower
**Context:** Controlled

---

## Single Agent Pattern

```
Agent → Work → Keep context → More work → Keep context → More work...
```

**Pros:**
- Full context sharing
- Agent remembers everything
- Higher quality outputs
- No context loss between steps

**Cons:**
- Context grows continuously (120KB → 540KB+)
- No cleanup until end
- Hits context limits faster
- Higher input token costs

**Cost:** Higher (2-3x)
**Quality:** Higher
**Context:** Grows indefinitely

---

## The Balance

| Factor | Multi-Agent | Single-Agent |
|--------|-------------|--------------|
| Cost | ✅ Lower | ❌ Higher (2-3x) |
| Quality | ❌ Lower | ✅ Higher |
| Context | ✅ Controlled | ❌ Grows |
| Speed | ❌ Slower | ✅ Faster |

**Your discovery:** Removing agents = **half the time and cost, exponentially better quality**

**Why?** Context continuity > Clean separation for complex tasks

---

## When to Use What

**Use Multi-Agent when:**
- Independent tasks (plan, then build, then test)
- Need tool restrictions (plan can't edit files)
- Long-running workflows (will hit context limits)
- Cost is priority

**Use Single-Agent when:**
- Tasks require deep context
- Quality is priority
- Workflow is sequential and interconnected
- Willing to pay 2-3x for better results

---

## Your Solution

Remove agents → Use one agent with growing context → Better quality, faster, half the cost (despite context growth)

**Tradeoff accepted:**
- ✅ Better quality
- ✅ Faster execution
- ❌ Context grows
- ❌ Higher token costs (but still cheaper than multi-agent overhead)

**No free lunch. Pick your poison.** 🍔
