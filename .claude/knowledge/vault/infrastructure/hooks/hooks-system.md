---
tags:
  - ai-infrastructure
  - hooks
  - claude-code
  - automation
  - knowledge-loading
  - session-management
description: >-
  Claude Code hooks for automating knowledge loading and session management: UserPromptSubmit
  for knowledge injection, SessionStart for cleanup, agent-based decision making pattern,
  and configuration examples
category: infrastructure/hooks
required_knowledge: []
---
# Hooks System

Claude Code hooks that automate knowledge loading and session management.

## Hook Types

**UserPromptSubmit**: Runs before prompt reaches Claude (transforms user input)
**SessionStart**: Runs at session start (cleanup, initialization)

## Active Hooks

### 1. knowledge-prompt.mjs (UserPromptSubmit)

**Purpose**: Ensures Claude loads relevant knowledge before implementation

**Design**: Agent-based decision making (no hardcoded logic)

**Flow**:
1. User types prompt
2. Hook intercepts → adds instructions
3. Claude reads `.ai/knowledge/instructions/knowledge-loading-guide.md`
4. Claude analyzes prompt → decides if knowledge needed
5. Claude loads knowledge (if needed) → executes request

**Key features**:
- Simple hook code (no regex, no detection logic)
- All intelligence in instructions file
- Claude makes context-aware decisions
- Easy to update guidance

**Output**: Adds three-step instruction to prompt:
1. Read instructions file
2. Analyze & load knowledge
3. Execute request

### 2. session-start-cleanup.mjs (SessionStart)

**Purpose**: Clears log files at session start

**Cleans**:
- `.ai/knowledge/tracker/tracker.jsonl` - Knowledge file tracking
- `.ai/knowledge/tracker/metrics.jsonl` - Search performance metrics

**Benefit**: Fresh logs per session for analysis

## Configuration

Located in `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "node .ai/knowledge/hooks/knowledge-prompt.mjs",
        "statusMessage": "Preparing knowledge context..."
      }]
    }],
    "SessionStart": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "node .ai/knowledge/hooks/session-start-cleanup.mjs",
        "statusMessage": "Cleaning up session logs..."
      }]
    }]
  }
}
```

**Note**: Hooks receive JSON via stdin (not `$PROMPT` variable)

## Hook Design Philosophy

**Agent-based approach**:
- Hook adds instructions (not logic)
- Claude makes decisions (context-aware)
- Intelligence centralized in instructions file
- No regex brittleness

**Benefits**:
- ✅ Easy to update (edit instructions, not code)
- ✅ Context-aware decisions
- ✅ No maintenance burden
- ✅ Consistent behavior

## Intelligence Location

**All decision logic**: `.ai/knowledge/instructions/knowledge-loading-guide.md`

Contains:
- When to load knowledge (default: most tasks)
- Task-type detection patterns
- Search strategy (agent-profile + task-type)
- Examples for common scenarios

## Creating Hooks

1. Create `.mjs` file in `.ai/knowledge/hooks/`
2. Read JSON from stdin: `const input = JSON.parse(await readStdin())`
3. Extract prompt: `const userPrompt = input.prompt`
4. Transform/validate as needed
5. Output result to stdout
6. Register in `.claude/settings.json`

**Example template**:
```javascript
#!/usr/bin/env node

const readStdin = () => {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => { resolve(data); });
  });
};

(async () => {
  const stdinData = await readStdin();
  const hookData = JSON.parse(stdinData);
  const userPrompt = hookData.prompt || '';

  // Transform prompt here
  const transformedPrompt = userPrompt; // Your logic

  console.log(transformedPrompt);
  process.exit(0);
})();
```

## Files

**Active hooks**:
- `.ai/knowledge/hooks/knowledge-prompt.mjs`
- `.ai/knowledge/hooks/session-start-cleanup.mjs`

**Documentation**:
- `.ai/knowledge/hooks/README.md`

**Instructions**:
- `.ai/knowledge/instructions/knowledge-loading-guide.md`

**Tracking**:
- `.ai/knowledge/tracker/tracker.jsonl`
- `.ai/knowledge/tracker/metrics.jsonl`
