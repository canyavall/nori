# Command Orchestration

Orchestration patterns for multi-step CLI workflows. Covers Task tool usage, subtask isolation, and context growth management.

## Commands Can't Call Commands

```markdown
❌ This doesn't work:
/plan $ARGUMENTS
/build $ARGUMENTS
```

Claude sees this as text, not executable commands.

## Pattern 1: Task Tool Orchestration

```markdown
Execute for: $ARGUMENTS

1. Use Task tool (subagent: plan)
2. Use Task tool (subagent: build)
3. Use Task tool (subagent: test)

Wait for each to complete.
```

**Sub-agents**: Cleaned ✅
**Orchestrator**: Grows ❌

## Pattern 2: Subtask Flag

```markdown
---
description: "Full workflow"
agent: "orchestrator"
subtask: true  ← Isolates orchestrator too
---
```

Creates isolated orchestrator that gets cleaned up after completion.

## Context Growth in Orchestration

Even with Task tool, orchestrator grows:

```
Orchestrator messages:
1. User: "Full workflow"           5KB
2. Assistant: Task(plan)           1KB
3. Tool Result: "Plan output"      15KB
4. Assistant: Task(build)          1KB
5. Tool Result: "Build output"     30KB
Total: ~73KB in orchestrator
```

## Solutions to Growth

**Summarization**: Extract key decisions only, use summary for next step

**Checkpointing**: Write to file, spawn new orchestrator, read file

**Nested Orchestrators**: Each sub-orchestrator is isolated and cleaned
