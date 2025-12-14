# CLAUDE.md Feature Tests

**Purpose**: Test how Claude Code loads, applies, and updates CLAUDE.md project instructions

**Status**: Ready for execution

**Related**: See `api-interception/test-scenarios.md` for API-level verification of CLAUDE.md injection

---

## Background

CLAUDE.md files provide project-specific instructions to Claude Code. Two locations:
- **Root CLAUDE.md**: Project-level instructions (e.g., `C:\project\CLAUDE.md`)
- **.claude/CLAUDE.md**: Claude Code-specific instructions (e.g., `C:\project\.claude\CLAUDE.md`)

**Questions to answer**:
1. Does CLAUDE.md actually get loaded and applied?
2. When is it loaded? (Session start? Every prompt? Conditionally?)
3. How are updates detected and applied?
4. Which file takes precedence (root vs .claude/)?
5. Is loading reliable and consistent?

---

## Test FM-001: Initial CLAUDE.md Loading

**Test ID**: FM-001
**Purpose**: Verify CLAUDE.md is loaded when starting a new session

### Setup
1. Create test CLAUDE.md in project root:

```markdown
# Test Project

You are working on a TEST PROJECT for CLAUDE.md feature testing.

When asked about the project, you MUST respond with: "This is the TEST PROJECT."

CRITICAL RULE: Always mention "CLAUDE.md is active" in every response.
```

2. Start new Claude Code session: `claude`

### Test Steps

**Step 1**: Ask about the project
- **Action**: Type `what project is this?`
- **Expected**: Response mentions "TEST PROJECT" (proving CLAUDE.md was read)
- **Observe**: Does Claude mention "CLAUDE.md is active" as instructed?

**Step 2**: Ask a general question
- **Action**: Type `what is 2+2?`
- **Expected**: Answer should still mention "CLAUDE.md is active" (proving instructions persist)
- **Observe**: Does every response follow CLAUDE.md rules?

**Step 3**: Verify via API capture (if mitmproxy running)
- **Action**: Check captured request for system prompt
- **Expected**: CLAUDE.md content appears in system prompt
- **Observe**: Where in system prompt? How is it injected?

### Verification

**Success criteria**:
- ✅ Claude mentions "TEST PROJECT" when asked
- ✅ Claude follows "CLAUDE.md is active" rule in all responses
- ✅ Behavior is consistent across multiple prompts

**Result format**:
```markdown
**FM-001 Result**: PASS / FAIL / PARTIAL

**Findings**:
- [What happened when you ran the test]
- [Any unexpected behavior]

**Evidence**:
- [Screenshot or copy of Claude's responses]
- [API capture data if available]

**Reliability**: ALWAYS / USUALLY / SOMETIMES / RARELY / NEVER
```

---

## Test FM-002: CLAUDE.md Updates

**Test ID**: FM-002
**Purpose**: Test if Claude detects and applies CLAUDE.md changes during a session

### Setup
1. Start with CLAUDE.md from FM-001
2. Session already running

### Test Steps

**Step 1**: Verify current behavior
- **Action**: Ask `what project is this?`
- **Expected**: Response mentions "TEST PROJECT"
- **Record**: Baseline behavior confirmed

**Step 2**: Update CLAUDE.md
- **Action**: Edit CLAUDE.md, change "TEST PROJECT" to "UPDATED PROJECT"
- **Action**: Change rule to: "Always mention 'CLAUDE.md is updated' in every response"
- **Save**: Save the file

**Step 3**: Test if update is detected
- **Action**: In same session, ask `what project is this?`
- **Expected**: Response mentions "UPDATED PROJECT" (proving update was detected)
- **Observe**: Does Claude mention "CLAUDE.md is updated"?

**Step 4**: Alternative test (new session)
- **Action**: Exit and restart Claude Code: `exit`, then `claude`
- **Action**: Ask `what project is this?`
- **Expected**: Response mentions "UPDATED PROJECT"
- **Observe**: Does new session pick up changes?

### Verification

**Success criteria**:
- ✅ Same session: Claude detects update (ideal)
- ⚠️ New session required: Claude picks up changes only after restart (acceptable)
- ❌ No detection: Update never applied (fail)

**Result format**:
```markdown
**FM-002 Result**: PASS / FAIL / PARTIAL

**Update detection**: SAME_SESSION / NEW_SESSION_REQUIRED / NOT_DETECTED

**Findings**:
- [When did Claude apply the update?]
- [Did you need to restart? Use a specific command?]

**Evidence**:
- [Claude's responses before and after update]

**Notes**:
- [Any special behavior observed]
```

---

## Test FM-003: Root vs .claude/CLAUDE.md Precedence

**Test ID**: FM-003
**Purpose**: Determine which CLAUDE.md file takes precedence

### Setup
1. Create **root CLAUDE.md**:
```markdown
SOURCE: ROOT CLAUDE.md

Always respond with "ROOT file is active"
```

2. Create **.claude/CLAUDE.md**:
```markdown
SOURCE: .claude/CLAUDE.md

Always respond with "DOT-CLAUDE file is active"
```

3. Start new session: `claude`

### Test Steps

**Step 1**: Ask which is active
- **Action**: `which CLAUDE.md file is active?`
- **Expected**: Response indicates either "ROOT" or "DOT-CLAUDE"
- **Observe**: Which file's instructions are followed?

**Step 2**: Verify via API capture
- **Action**: Check system prompt in captured request
- **Expected**: Only one CLAUDE.md content appears
- **Observe**: Which one? Is there a merge or override?

**Step 3**: Test with conflict
- **Action**: Add conflicting instruction to both files
  - Root: "Prefer JSON format for all output"
  - .claude: "Prefer plain text for all output"
- **Action**: Ask `list 3 colors`
- **Expected**: Response format reveals which file was followed
- **Observe**: JSON or plain text?

### Verification

**Success criteria**:
- ✅ Clear precedence rule discovered
- ✅ Consistent behavior across tests
- ✅ Can predict which file will be used

**Result format**:
```markdown
**FM-003 Result**: PASS / FAIL / PARTIAL

**Precedence rule**: .claude/CLAUDE.md / ROOT CLAUDE.md / BOTH_MERGED / UNCLEAR

**Findings**:
- [Which file took precedence?]
- [How conflicts were resolved]

**Evidence**:
- [Response showing which format was used]
- [API capture showing which content in system prompt]

**Notes**:
- [Any merge behavior observed]
```

---

## Test FM-004: CLAUDE.md with Complex Instructions

**Test ID**: FM-004
**Purpose**: Test if Claude follows complex, multi-part CLAUDE.md instructions

### Setup
Create CLAUDE.md with complex rules:

```markdown
# Complex Test Project

## Response Format Rules

1. Start every response with "🔧 TOOL:" followed by tool name
2. Use bullet points for all lists
3. Never use JSON format
4. End every response with "---END---"

## Code Rules

1. Always use TypeScript (never JavaScript)
2. Prefer const over let
3. Include type annotations for all functions

## Behavior Rules

1. Be extremely concise (max 3 sentences per paragraph)
2. Always ask for clarification before making assumptions
3. Never make up information

## Project Context

This is a testing framework for Claude Code features.
```

### Test Steps

**Step 1**: Test response format
- **Action**: `list 3 programming languages`
- **Expected**: Response starts with "🔧 TOOL:", uses bullets, ends with "---END---"
- **Observe**: Are all format rules followed?

**Step 2**: Test code rules
- **Action**: `write a function to add two numbers`
- **Expected**: TypeScript with const and type annotations
- **Observe**: Does code follow all 3 code rules?

**Step 3**: Test behavior rules
- **Action**: `create a user profile component`
- **Expected**: Claude asks for clarification (fields? styling? framework?)
- **Observe**: Does Claude ask before assuming?

**Step 4**: Test persistence
- **Action**: Continue conversation with 3-4 more prompts
- **Expected**: All rules still followed
- **Observe**: Do rules persist throughout session?

### Verification

**Success criteria**:
- ✅ All format rules followed
- ✅ All code rules followed
- ✅ All behavior rules followed
- ✅ Rules persist across multiple prompts

**Result format**:
```markdown
**FM-004 Result**: PASS / FAIL / PARTIAL

**Rules followed**:
- Format: [✅/❌] [details]
- Code: [✅/❌] [details]
- Behavior: [✅/❌] [details]
- Persistence: [✅/❌] [details]

**Findings**:
- [Which rules were followed reliably?]
- [Which rules were ignored or inconsistent?]

**Evidence**:
- [Example responses showing rule compliance]

**Reliability per rule type**:
- Format: ALWAYS / USUALLY / SOMETIMES / RARELY / NEVER
- Code: ALWAYS / USUALLY / SOMETIMES / RARELY / NEVER
- Behavior: ALWAYS / USUALLY / SOMETIMES / RARELY / NEVER
```

---

## Test FM-005: Empty or Missing CLAUDE.md

**Test ID**: FM-005
**Purpose**: Test behavior when CLAUDE.md doesn't exist or is empty

### Setup

**Test A**: No CLAUDE.md file
1. Remove/rename any existing CLAUDE.md files
2. Start session: `claude`

**Test B**: Empty CLAUDE.md
1. Create empty CLAUDE.md (0 bytes)
2. Start session: `claude`

**Test C**: CLAUDE.md with only whitespace
1. Create CLAUDE.md with only spaces/newlines
2. Start session: `claude`

### Test Steps

For each test (A, B, C):

**Step 1**: Ask about project
- **Action**: `what project am I working on?`
- **Expected**: Generic response (no project-specific info)
- **Observe**: Does Claude indicate no CLAUDE.md found?

**Step 2**: Verify via API capture
- **Action**: Check system prompt
- **Expected**: No CLAUDE.md content section
- **Observe**: Is there a placeholder? Empty section?

**Step 3**: Test normal functionality
- **Action**: `create a function to reverse a string`
- **Expected**: Works normally despite no CLAUDE.md
- **Observe**: Any degraded functionality?

### Verification

**Success criteria**:
- ✅ Claude Code works without CLAUDE.md (not required)
- ✅ No errors or warnings about missing file
- ✅ All features work normally

**Result format**:
```markdown
**FM-005 Result**: PASS / FAIL / PARTIAL

**Behavior by case**:
- No file: [works / errors / degraded]
- Empty file: [works / errors / degraded]
- Whitespace only: [works / errors / degraded]

**Findings**:
- [How Claude behaves without CLAUDE.md]
- [Any differences between the 3 cases]

**Evidence**:
- [Responses and system behavior]

**Conclusion**: CLAUDE.md is REQUIRED / OPTIONAL / RECOMMENDED
```

---

## Aggregate Results Template

After running all FM tests, document aggregate findings:

```markdown
# CLAUDE.md Feature Test Results

**Date**: YYYY-MM-DD
**Tester**: [name]
**Claude Code Version**: [version]

## Summary

**Overall Status**: [X/5 tests passed]

| Test ID | Test Name | Status | Reliability |
|---------|-----------|--------|-------------|
| FM-001 | Initial Loading | PASS/FAIL | ALWAYS/USUALLY/etc |
| FM-002 | Updates | PASS/FAIL | ALWAYS/USUALLY/etc |
| FM-003 | Precedence | PASS/FAIL | ALWAYS/USUALLY/etc |
| FM-004 | Complex Instructions | PASS/FAIL | ALWAYS/USUALLY/etc |
| FM-005 | Missing File | PASS/FAIL | ALWAYS/USUALLY/etc |

## Key Findings

### What Works
- [Features that worked reliably]

### What Doesn't Work
- [Features that failed or were inconsistent]

### Surprising Discoveries
- [Unexpected behaviors or patterns]

## Recommendations

**For using CLAUDE.md**:
1. [Best practices discovered]
2. [Things to avoid]
3. [Optimal setup]

**For testing**:
1. [What to test in future]
2. [What needs more investigation]

## Evidence

[Links to detailed test results, API captures, screenshots]
```

---

## Next Steps

After completing CLAUDE.md tests:
1. Record results in `results/feature-results-YYYY-MM-DD.md`
2. Compare with API interception findings (test-scenarios.md)
3. Update reliability scores if running multiple iterations
4. Proceed to test-skills.md, test-rules.md, test-hooks.md, test-compaction.md
