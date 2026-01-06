---
tags:
  - hooks
  - lifecycle
  - events
  - shell-scripts
description: >-
  Claude Code hook system architecture: 10 lifecycle events, shell script execution,
  JSON I/O format, and hook data structures
category: patterns/session-management
required_knowledge: []
---
# Hook Lifecycle Events

Claude Code's 10 lifecycle events for shell script hooks with JSON I/O.

## Event Types

### 1. SessionStart
**Trigger**: When Claude Code session begins
**Use cases**: Initialize environment, load knowledge, setup tracking
**Data**: `{ session_id, project_path, timestamp }`

### 2. UserPromptSubmit
**Trigger**: User submits a message
**Use cases**: Inject context, modify prompts, load dynamic knowledge
**Data**: `{ prompt, session_id, timestamp }`
**Can modify**: prompt content via stdout

### 3. PreToolUse
**Trigger**: Before any tool execution
**Use cases**: Validate inputs, block dangerous operations, audit logging
**Data**: `{ tool_name, tool_input, session_id }`
**Can block**: exit code 1 prevents tool execution

### 4. PostToolUse
**Trigger**: After tool execution
**Use cases**: Format output, add metadata, track usage
**Data**: `{ tool_name, tool_input, tool_output, session_id }`
**Can modify**: tool output via stdout

### 5. SubagentStart
**Trigger**: When spawning a sub-agent
**Use cases**: Initialize sub-agent context, track spawning
**Data**: `{ parent_id, subagent_id, subagent_type, task }`

### 6. SubagentStop
**Trigger**: When sub-agent completes
**Use cases**: Aggregate results, cleanup, metrics
**Data**: `{ parent_id, subagent_id, result, duration }`

### 7. LLMRequest
**Trigger**: Before sending to Claude API
**Use cases**: Modify messages, inject system prompts, cache management
**Data**: `{ messages, model, temperature, max_tokens }`
**Can modify**: request parameters

### 8. LLMResponse
**Trigger**: After receiving Claude API response
**Use cases**: Parse responses, extract structured data, metrics
**Data**: `{ request, response, tokens_used, duration }`

### 9. Stop
**Trigger**: User interrupts execution (Ctrl+C)
**Use cases**: Graceful shutdown, save state, cleanup
**Data**: `{ session_id, interrupted_at, reason }`

### 10. SessionEnd
**Trigger**: Session terminates normally
**Use cases**: Final cleanup, export data, session summary
**Data**: `{ session_id, duration, messages_count, tokens_used }`

## Hook Execution Model

```bash
#!/usr/bin/env bash
# Hook receives JSON via stdin
INPUT=$(cat)

# Parse JSON (using jq or similar)
PROMPT=$(echo "$INPUT" | jq -r '.prompt')

# Do work
MODIFIED_PROMPT="${PROMPT}\n\nAdditional context"

# Return JSON via stdout
echo "{\"prompt\": \"$MODIFIED_PROMPT\"}"

# Exit code determines behavior
exit 0  # Success, use modified output
exit 1  # Block operation (PreToolUse only)
exit 2  # Error, pass through original
```

## Hook Chaining

Multiple hooks per event execute sequentially:
1. Hook 1 receives original input
2. Hook 1 outputs modified data
3. Hook 2 receives Hook 1's output
4. Hook 2 outputs final data
5. Claude Code uses final output

## Configuration

In `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",  // Empty = all prompts
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/knowledge-prompt.mjs" },
          { "type": "command", "command": "node .claude/hooks/personality.mjs" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write",  // Only for Write tool
        "hooks": [
          { "type": "command", "command": ".claude/hooks/validate-write.sh" }
        ]
      }
    ]
  }
}
```

## Advanced: LLM-Based Hooks

Some hooks can use LLM for decision-making:
- Hook calls Claude API to analyze context
- LLM decides whether to proceed, modify, or block
- Enables intelligent, context-aware automation

Example: Security hook that uses LLM to detect malicious code patterns

## Source

Extracted from `documentation/hooks-comparison.md` - Claude Code vs OpenCode hook systems
