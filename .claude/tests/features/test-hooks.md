# Hooks Feature Tests

**Purpose**: Test Claude Code hooks lifecycle, timing, data format, and reliability

**Status**: Ready for execution

**Critical**: We have active hooks in our system (knowledge-prompt.mjs, session-start-cleanup.mjs). These tests will validate our own hook implementation while testing Claude Code's hook system.

---

## Background

Claude Code supports lifecycle hooks that run at specific events. From our knowledge and settings:

**Hook types documented**:
1. **SessionStart**: When session begins
2. **UserPromptSubmit**: Before prompt reaches Claude
3. **ToolCall**: Before/after tool execution
4. **ToolResult**: After tool returns result
5. **ResponseGeneration**: Before/after response
6. **SessionEnd**: When session ends

**Our active hooks**:
- `knowledge-prompt.mjs` (UserPromptSubmit)
- `session-start-cleanup.mjs` (SessionStart)

**Questions to answer**:
1. Which hook types actually exist and fire?
2. When exactly does each hook fire?
3. What data is available to each hook?
4. How reliable is hook execution?
5. Can hooks modify the data flow?
6. What happens when hooks error?

---

## Test FH-001: SessionStart Hook

**Test ID**: FH-001
**Purpose**: Test when and how SessionStart hooks fire

### Setup
Create `.claude/hooks/test-session-start.mjs`:

```javascript
#!/usr/bin/env node

import { appendFileSync } from 'fs';

const logFile = '.claude/tests/results/hook-logs.txt';
const timestamp = new Date().toISOString();

appendFileSync(logFile, `[${timestamp}] SessionStart hook fired\n`, 'utf-8');

process.exit(0);
```

Update `.claude/settings.json` to add hook:
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/test-session-start.mjs",
            "statusMessage": "Testing SessionStart..."
          }
        ]
      }
    ]
  }
}
```

### Test Steps

**Step 1**: Clear log file
- **Action**: `echo "" > .claude/tests/results/hook-logs.txt`

**Step 2**: Start new session
- **Action**: `claude`
- **Expected**: Hook fires at session start
- **Observe**: Check log file for entry

**Step 3**: Verify timing
- **Action**: Send first prompt immediately: `hello`
- **Action**: Check log file timestamp
- **Expected**: SessionStart logged BEFORE first prompt processed
- **Observe**: Timing order correct?

**Step 4**: Test multiple session starts
- **Action**: Exit and restart 3 times
- **Expected**: 3 log entries, one per session start
- **Observe**: Hook fires every time?

**Step 5**: Test with existing session
- **Action**: In existing session, send multiple prompts
- **Expected**: No new SessionStart logs
- **Observe**: Hook only fires at start, not during session

### Verification

**Success criteria**:
- ✅ Hook fires at session start
- ✅ Hook fires BEFORE first prompt
- ✅ Hook fires only once per session
- ✅ Reliable across multiple sessions

**Result format**:
```markdown
**FH-001 Result**: PASS / FAIL / PARTIAL

**Timing**: BEFORE_FIRST_PROMPT / AFTER_FIRST_PROMPT / UNCLEAR

**Execution count**: [N times in M session starts]

**Findings**:
- [When hook fires exactly]
- [Any timing issues observed]

**Evidence**:
- [Log file contents]
- [Timestamps showing order]

**Reliability**: ALWAYS / USUALLY / SOMETIMES / RARELY / NEVER
```

---

## Test FH-002: UserPromptSubmit Hook (Our Knowledge Hook)

**Test ID**: FH-002
**Purpose**: Test our knowledge-prompt.mjs hook behavior

**Note**: This is a meta-test - we're testing the hook that's currently affecting our prompts!

### Setup
Our hook is already active. No setup needed.

### Test Steps

**Step 1**: Verify hook is transforming prompts
- **Action**: Send simple prompt: `hello`
- **Expected**: Hook adds knowledge system instructions before reaching Claude
- **Observe**: Do we see the knowledge system header?

**Step 2**: Test hook data format
- **Action**: Modify knowledge-prompt.mjs temporarily to log input:

```javascript
// Add at start of (async () => { ... })()
const stdinData = await readStdin();
const logFile = '.claude/tests/results/hook-input-logs.txt';
appendFileSync(logFile, `INPUT: ${JSON.stringify(JSON.parse(stdinData), null, 2)}\n---\n`, 'utf-8');
```

- **Action**: Send prompt: `test prompt`
- **Expected**: Log file shows hook input data structure
- **Observe**: What data is available? Format?

**Step 3**: Test prompt transformation
- **Action**: Send prompt: `original text`
- **Expected**: Hook transforms it to include knowledge instructions
- **Observe**: Can we see the transformation in action?

**Step 4**: Test hook execution timing
- **Action**: Send prompt and measure response time
- **Expected**: Hook adds minimal latency (<100ms)
- **Observe**: Performance impact?

**Step 5**: Test hook with special characters
- **Action**: Send prompt with quotes, newlines, unicode: `"test\nюникод"`
- **Expected**: Hook handles special chars correctly
- **Observe**: Any encoding issues?

### Verification

**Success criteria**:
- ✅ Hook fires for every user prompt
- ✅ Hook receives correct data format
- ✅ Hook can transform prompts
- ✅ Minimal performance impact
- ✅ Handles edge cases (special characters)

**Result format**:
```markdown
**FH-002 Result**: PASS / FAIL / PARTIAL

**Input data structure**:
```json
{
  "prompt": "...",
  "other_fields": "..."
}
```

**Transformation**: YES / NO / PARTIAL

**Performance impact**: [X]ms average

**Findings**:
- [What data hooks receive]
- [How transformation works]
- [Any issues with special cases]

**Evidence**:
- [Log files showing input/output]
- [Timing measurements]

**Hook data format**: [Document the structure for future reference]
```

---

## Test FH-003: ToolCall Hooks

**Test ID**: FH-003
**Purpose**: Test if ToolCall hooks fire before/after tool execution

### Setup
Create `.claude/hooks/test-tool-call.mjs`:

```javascript
#!/usr/bin/env node

import { appendFileSync } from 'fs';
import { readFileSync } from 'fs';

const readStdin = () => {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => { resolve(data); });
  });
};

(async () => {
  const stdinData = await readStdin();
  const logFile = '.claude/tests/results/hook-logs.txt';
  const timestamp = new Date().toISOString();

  let hookData = {};
  try {
    hookData = JSON.parse(stdinData);
  } catch (e) {
    hookData = { raw: stdinData };
  }

  appendFileSync(logFile, `[${timestamp}] ToolCall hook fired\nData: ${JSON.stringify(hookData, null, 2)}\n---\n`, 'utf-8');

  // Pass through (don't modify)
  console.log(stdinData);
  process.exit(0);
})();
```

Update `.claude/settings.json`:
```json
{
  "hooks": {
    "ToolCall": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/test-tool-call.mjs",
            "statusMessage": "Logging tool call..."
          }
        ]
      }
    ]
  }
}
```

### Test Steps

**Step 1**: Clear logs
- **Action**: `echo "" > .claude/tests/results/hook-logs.txt`

**Step 2**: Trigger tool call
- **Action**: `claude -p "read the file README.md"`
- **Expected**: Hook fires when Read tool is called
- **Observe**: Check log for ToolCall entry

**Step 3**: Check hook data
- **Action**: Review log file
- **Expected**: Data includes tool name, parameters
- **Observe**: What information is available?

**Step 4**: Test multiple tool calls
- **Action**: `claude -p "list files in current directory and read package.json"`
- **Expected**: Multiple hook invocations (Glob + Read)
- **Observe**: Hook fires for each tool?

**Step 5**: Test before/after distinction
- **Action**: Check if hook data indicates before or after tool execution
- **Expected**: Either separate before/after hooks or single hook with timing info
- **Observe**: Can we detect execution phase?

### Verification

**Success criteria**:
- ✅ Hook fires for tool calls
- ✅ Hook data includes tool info
- ✅ Hook fires for each tool invocation
- ✅ Can detect before/after phase

**Result format**:
```markdown
**FH-003 Result**: PASS / FAIL / PARTIAL

**Hook firing**: PER_TOOL / ONCE / NOT_FIRING

**Data available**:
- Tool name: YES / NO
- Tool parameters: YES / NO
- Execution phase: BEFORE / AFTER / BOTH / UNCLEAR

**Findings**:
- [When ToolCall hooks fire]
- [What data is available]
- [How to detect execution phase]

**Evidence**:
- [Log file showing tool call data]

**Use cases**: [What you could build with ToolCall hooks]
```

---

## Test FH-004: Hook Error Handling

**Test ID**: FH-004
**Purpose**: Test how Claude Code handles hook errors

### Setup
Create `.claude/hooks/test-error-hook.mjs`:

```javascript
#!/usr/bin/env node

// This hook intentionally errors
throw new Error("INTENTIONAL TEST ERROR");
```

Add to settings.json:
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/test-error-hook.mjs",
            "statusMessage": "Testing error handling..."
          }
        ]
      }
    ]
  }
}
```

### Test Steps

**Step 1**: Test hook that throws error
- **Action**: `claude -p "hello"`
- **Expected**: Either error message, graceful fallback, or silent failure
- **Observe**: How is error communicated?

**Step 2**: Test if session continues
- **Expected**: Session doesn't crash, can still send prompts
- **Observe**: Graceful degradation?

**Step 3**: Test hook that exits non-zero
- **Modify hook**: `process.exit(1);`
- **Action**: Send prompt
- **Expected**: Error handling for non-zero exit
- **Observe**: Different from thrown error?

**Step 4**: Test hook that hangs
- **Modify hook**: `setInterval(() => {}, 1000);` (never exits)
- **Action**: Send prompt
- **Expected**: Timeout or indefinite hang
- **Observe**: Is there a timeout mechanism?

**Step 5**: Test hook with invalid output
- **Modify hook**: `console.log("INVALID JSON {{{");`
- **Action**: Send prompt
- **Expected**: Error handling for malformed output
- **Observe**: How is output validated?

### Verification

**Success criteria**:
- ✅ Errors don't crash Claude Code
- ✅ Clear error messages for debugging
- ✅ Graceful fallback behavior
- ✅ Timeouts prevent hangs

**Result format**:
```markdown
**FH-004 Result**: PASS / FAIL / PARTIAL

**Error handling**:
| Error Type | Behavior | Error Message |
|------------|----------|---------------|
| Thrown error | [crash/warn/fallback] | [message] |
| Non-zero exit | [crash/warn/fallback] | [message] |
| Timeout/hang | [crash/warn/fallback] | [message] |
| Invalid output | [crash/warn/fallback] | [message] |

**Findings**:
- [How errors are handled]
- [User experience during hook errors]
- [Debugging capabilities]

**Evidence**:
- [Error messages received]
- [System behavior with broken hooks]

**Error handling quality**: EXCELLENT / GOOD / FAIR / POOR
```

---

## Test FH-005: Hook Matchers

**Test ID**: FH-005
**Purpose**: Test if hook matchers filter when hooks fire

### Setup
Create hooks with different matchers:

`.claude/settings.json`:
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "test",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/log-matched-test.mjs",
            "statusMessage": "Matched: test"
          }
        ]
      },
      {
        "matcher": "read",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/log-matched-read.mjs",
            "statusMessage": "Matched: read"
          }
        ]
      },
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/log-matched-all.mjs",
            "statusMessage": "Matched: all"
          }
        ]
      }
    ]
  }
}
```

Each hook logs which matcher triggered.

### Test Steps

**Step 1**: Test prompt with "test"
- **Action**: `claude -p "this is a test prompt"`
- **Expected**: Both "test" matcher and empty matcher fire
- **Observe**: Log shows which hooks fired

**Step 2**: Test prompt with "read"
- **Action**: `claude -p "read the file"`
- **Expected**: Both "read" matcher and empty matcher fire
- **Observe**: Order of execution?

**Step 3**: Test prompt without matchers
- **Action**: `claude -p "hello world"`
- **Expected**: Only empty matcher fires
- **Observe**: Specific matchers correctly filter

**Step 4**: Test regex matchers (if supported)
- **Modify matcher**: `"matcher": "^read.*"`
- **Action**: `claude -p "read the file"`
- **Expected**: Regex match works
- **Observe**: What pattern syntax is supported?

**Step 5**: Test matcher edge cases
- **Action**: Try prompts with special regex chars: `[test]`, `test?`, `test*`
- **Expected**: Matchers handle special characters
- **Observe**: Are matchers literal or regex?

### Verification

**Success criteria**:
- ✅ Matchers correctly filter hook execution
- ✅ Empty matcher acts as "match all"
- ✅ Multiple matchers can fire for same prompt
- ✅ Understand matcher syntax (literal vs regex)

**Result format**:
```markdown
**FH-005 Result**: PASS / FAIL / PARTIAL

**Matcher behavior**:
- Empty matcher: MATCH_ALL / NO_MATCH / UNCLEAR
- Specific text: LITERAL / REGEX / CONTAINS / UNCLEAR
- Multiple matchers: ALL_FIRE / FIRST_WINS / UNCLEAR

**Matcher syntax**: LITERAL / REGEX / GLOB / MIXED

**Findings**:
- [How matchers work]
- [What patterns are supported]
- [Execution order when multiple match]

**Evidence**:
- [Logs showing which hooks fired for which prompts]

**Use cases**: [When to use matchers vs empty matcher]
```

---

## Aggregate Results Template

After running all FH tests:

```markdown
# Hooks Feature Test Results

**Date**: YYYY-MM-DD
**Tester**: [name]
**Claude Code Version**: [version]

## Summary

**Overall Status**: [X/5 tests passed]

| Test ID | Test Name | Status | Key Finding |
|---------|-----------|--------|-------------|
| FH-001 | SessionStart | PASS/FAIL | [finding] |
| FH-002 | UserPromptSubmit | PASS/FAIL | [finding] |
| FH-003 | ToolCall | PASS/FAIL | [finding] |
| FH-004 | Error Handling | PASS/FAIL | [finding] |
| FH-005 | Matchers | PASS/FAIL | [finding] |

## Hook Lifecycle Map

**Documented hook types and when they fire**:

1. **SessionStart**: [when it fires, what data available]
2. **UserPromptSubmit**: [when it fires, what data available]
3. **ToolCall**: [when it fires, what data available]
4. **ToolResult**: [when it fires, what data available] - if tested
5. **ResponseGeneration**: [when it fires, what data available] - if tested
6. **SessionEnd**: [when it fires, what data available] - if tested

## Hook Data Formats

### SessionStart
```json
{
  // Document actual data structure
}
```

### UserPromptSubmit
```json
{
  "prompt": "user's text",
  // Other fields discovered
}
```

### ToolCall
```json
{
  "tool": "ToolName",
  "params": {},
  // Other fields discovered
}
```

## Best Practices

**When to use hooks**:
1. [Use case 1]
2. [Use case 2]

**How to write reliable hooks**:
1. [Best practice 1]
2. [Best practice 2]

**Common pitfalls**:
1. [Pitfall 1]
2. [Pitfall 2]

## Our Knowledge Hook Performance

**knowledge-prompt.mjs**:
- Execution time: [X]ms average
- Reliability: [score]
- Issues found: [list]

**session-start-cleanup.mjs**:
- Execution time: [X]ms average
- Reliability: [score]
- Issues found: [list]

## Practical Examples

### Example 1: Logging all tool calls
```javascript
// Code for tracking tool usage
```

### Example 2: Prompt transformation
```javascript
// Code for adding context to prompts
```

### Example 3: Session cleanup
```javascript
// Code for cleanup on session start/end
```

## Evidence

[Links to log files, test results, hook implementations]
```

---

## Next Steps

1. Execute all 5 tests
2. Record detailed findings including data formats
3. Document hook lifecycle with exact timing
4. Create practical hook examples based on learnings
5. Proceed to test-compaction.md
