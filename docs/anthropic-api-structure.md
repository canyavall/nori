# Anthropic API Request Structure

## What Actually Gets Sent

```json
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 32000,
  "system": "...",
  "messages": [...],
  "tools": [...],
  "temperature": 0.7
}
```

**That's it. No "agent" field. No "command" field.**

---

## Where Agents Go

**Agents → System Prompt**

```typescript
Agent = {
  name: "implement-agent",
  prompt: "You are a senior FE developer..."
}

// Becomes:
{
  "system": "You are a senior FE developer..."
}
```

---

## Where Commands Go

**Commands → User Message**

```markdown
Command template: "Fix the issue in: $ARGUMENTS"
User input: "/fix tests in x.spec.ts"

// Becomes:
{
  "messages": [
    {
      "role": "user",
      "content": "Fix the issue in: tests in x.spec.ts"
    }
  ]
}
```

---

## System Prompt Composition

Built in this order:

1. **Base prompt** (Claude Code identity)
2. **Agent prompt** (persona/expertise)
3. **Environment** (directory, git status, file tree)
4. **CLAUDE.md** (project-specific guidelines)

```
system = [
  "You are Claude Code...",  // Base
  agent.prompt,              // Agent
  environment_info,          // Environment
  CLAUDE.md_content          // Guidelines
]
```

All combined into `system` field.

---

## Key Insight

**Agents and Commands are CLIENT-SIDE abstractions.**

They don't exist in the API. They're just:
- Agent → Part of system prompt
- Command → User message content

Anthropic doesn't know or care about them.
