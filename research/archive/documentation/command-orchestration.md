# Command Orchestration

## Commands Can't Call Commands

```markdown
❌ This doesn't work:
/plan $ARGUMENTS
/build $ARGUMENTS
/test $ARGUMENTS
```

Claude sees this as **text**, not executable commands.

---

## Pattern 1: Task Tool Orchestration

```markdown
---
description: "Full workflow"
agent: "orchestrator"
---

Execute for: $ARGUMENTS

1. Use Task tool (subagent: plan)
2. Use Task tool (subagent: build)
3. Use Task tool (subagent: test)

Wait for each to complete.
```

**What happens:**

```
Orchestrator spawns:
├─ Plan agent (works, then cleaned up)
├─ Build agent (works, then cleaned up)
└─ QA agent (works, then cleaned up)

Orchestrator context:
[user command] + [plan result] + [build result] + [qa result]
= Context grows with each result
```

**Sub-agents:** Cleaned ✅
**Orchestrator:** Grows ❌

---

## Pattern 2: Subtask Flag

```markdown
---
description: "Full workflow"
agent: "orchestrator"
subtask: true  ← Isolates orchestrator too
---

Full workflow for: $ARGUMENTS
```

**Creates:**

```
Parent Session
└─ Orchestrator (isolated, will be cleaned)
   ├─ Plan agent (cleaned)
   ├─ Build agent (cleaned)
   └─ QA agent (cleaned)
```

**Better:** Orchestrator is also isolated

---

## Pattern 3: Manual Execution

```bash
/plan feature X
# Review output

/build feature X
# Review output

/test feature X
```

**Pros:**
- Full control
- Human review at each step
- Complete cleanup between steps

**Cons:**
- Manual
- Slower
- No automation

---

## Context Growth in Orchestration

Even with Task tool, orchestrator grows:

```
Orchestrator messages:
1. User: "Full workflow"           5KB
2. Assistant: Task(plan)           1KB
3. Tool Result: "Plan output"      15KB
4. Assistant: Task(build)          1KB
5. Tool Result: "Build output"     30KB
6. Assistant: Task(test)           1KB
7. Tool Result: "Test output"      20KB

Total: ~73KB in orchestrator
```

**No free lunch.**

---

## Solutions to Orchestrator Growth

### Summarization
```markdown
After each Task result:
- Extract key decisions only
- Summarize in 2-3 sentences
- Use summary for next step
```

### Checkpointing
```markdown
After plan:
- Write to PLAN.md
- Spawn new orchestrator
- New one reads PLAN.md
```

### Nested Orchestrators
```
Main (coordination)
├─ Planning Orchestrator (subtask)
├─ Build Orchestrator (subtask)
└─ QA Orchestrator (subtask)
```

Each sub-orchestrator is isolated.

---

## Your Discovery

**Removed all agents** → Use one agent for everything

**Result:**
- ✅ Half the cost
- ✅ Half the time
- ✅ Exponentially better quality
- ❌ Context grows

**Worth it for your use case.**
