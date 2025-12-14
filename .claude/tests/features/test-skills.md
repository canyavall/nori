# Skills Feature Tests

**Purpose**: Test how Claude Code activates and uses skills

**Status**: Ready for execution

**Background Context**: Research indicates skills are typically empty in most Claude Code sessions. This test suite documents actual behavior.

---

## Background

Skills in Claude Code are specialized capabilities that can be activated for specific tasks. From settings and architecture:
- Skills can be defined in `.claude/skills/`
- Skills appear in `available_skills` section of system prompt
- Activation logic is not well-documented

**Questions to answer**:
1. Are skills ever activated? Under what conditions?
2. How are skills defined and registered?
3. What's the difference between skills in Claude Code vs OpenCode?
4. Why are skills typically empty in our captures?
5. Can we manually trigger skill activation?

---

## Test FS-001: Check Default Skills Availability

**Test ID**: FS-001
**Purpose**: Verify what skills are available in a fresh Claude Code installation

### Setup
1. Fresh Claude Code session (no custom skills defined)
2. API interception running (mitmproxy)

### Test Steps

**Step 1**: Start session and capture request
- **Action**: `claude -p "hello"`
- **Expected**: API request captured
- **Observe**: Check system prompt for `available_skills` section

**Step 2**: Search for skills in captured request
- **Action**: `grep -i "skill" requests_tracker/analysis/*/request_001.txt`
- **Expected**: Find skills section or empty array
- **Observe**: What's the default state?

**Step 3**: Check settings for skill configuration
- **Action**: `cat .claude/settings.json`
- **Expected**: Look for skills configuration
- **Observe**: Any skill-related settings?

### Verification

**Success criteria**:
- ✅ Can determine default skill state (empty vs populated)
- ✅ Found where skills are configured
- ✅ Understand baseline behavior

**Result format**:
```markdown
**FS-001 Result**: PASS / FAIL / PARTIAL

**Default skills state**: EMPTY / POPULATED / NOT_FOUND

**Findings**:
- [What was in available_skills?]
- [Where are skills configured?]

**Evidence**:
- [Grep output showing skills section]
- [Settings.json skills config]

**Baseline**: [Description of default behavior]
```

---

## Test FS-002: Create Custom Skill

**Test ID**: FS-002
**Purpose**: Test if custom skills can be created and activated

### Setup
1. Create `.claude/skills/` directory if not exists
2. Create a simple test skill

**Test skill** (`.claude/skills/test-skill.md`):
```markdown
---
name: test-skill
description: A test skill for verification
trigger: When user says "activate test skill"
---

# Test Skill

When this skill is activated, respond with: "TEST SKILL IS ACTIVE"

This skill should be triggered when the user explicitly asks for it.
```

3. Restart Claude Code session

### Test Steps

**Step 1**: Verify skill registration
- **Action**: Start session with API capture
- **Action**: `claude -p "hello"`
- **Expected**: Check captured request for test-skill in available_skills
- **Observe**: Is the skill listed?

**Step 2**: Attempt to trigger skill
- **Action**: `activate test skill`
- **Expected**: Response indicates "TEST SKILL IS ACTIVE"
- **Observe**: Does Claude recognize the trigger?

**Step 3**: Test alternative triggers
- **Action**: Try different phrases:
  - "use test-skill"
  - "I need the test skill"
  - "run test-skill"
- **Expected**: One of these activates the skill
- **Observe**: What activation language works?

**Step 4**: Verify in API capture
- **Action**: Check request when skill should be active
- **Expected**: Skill appears in active_skills or similar section
- **Observe**: How are active skills represented?

### Verification

**Success criteria**:
- ✅ Custom skill was registered (appears in available_skills)
- ✅ Skill can be triggered by user input
- ✅ Claude's behavior changes when skill is active

**Result format**:
```markdown
**FS-002 Result**: PASS / FAIL / PARTIAL

**Skill registration**: YES / NO / PARTIAL

**Trigger method**: [What phrase/command activated it?] / NOT_TRIGGERED

**Findings**:
- [How skill registration works]
- [What triggers skill activation]
- [How skill affects Claude's behavior]

**Evidence**:
- [API capture showing skill in available_skills]
- [Claude's response when skill triggered]

**Activation reliability**: ALWAYS / USUALLY / SOMETIMES / RARELY / NEVER
```

---

## Test FS-003: Skill vs Slash Command

**Test ID**: FS-003
**Purpose**: Understand the difference between skills and slash commands

### Setup
1. Have test-skill from FS-002
2. Create test slash command (`.claude/commands/test-command.md`):

```markdown
---
name: test-command
description: Test slash command
---

When this command is run, respond with: "TEST COMMAND EXECUTED"
```

3. Restart session

### Test Steps

**Step 1**: Execute slash command
- **Action**: `/test-command`
- **Expected**: Response indicates "TEST COMMAND EXECUTED"
- **Observe**: How quickly does it execute? Any transformation?

**Step 2**: Try skill activation
- **Action**: `activate test skill`
- **Expected**: Response indicates "TEST SKILL IS ACTIVE"
- **Observe**: Behavior difference from slash command?

**Step 3**: Compare in API captures
- **Action**: Review captures from both invocations
- **Expected**: See how each is represented in API
- **Observe**:
  - Are slash commands expanded before sending?
  - Are skills added to context?
  - Different API structure?

**Step 4**: Test combination
- **Action**: `/test-command` then try to use test-skill in same session
- **Expected**: Both should work independently
- **Observe**: Any interaction or conflict?

### Verification

**Success criteria**:
- ✅ Understand skill vs command distinction
- ✅ Know when to use each
- ✅ Understand implementation differences

**Result format**:
```markdown
**FS-003 Result**: PASS / FAIL / PARTIAL

**Key differences**:
1. [Difference 1]
2. [Difference 2]
3. [Difference 3]

**Use cases**:
- Skills: [When to use skills]
- Commands: [When to use slash commands]

**Findings**:
- [How skills work differently from commands]

**Evidence**:
- [API captures showing structure differences]

**Recommendation**: Use SKILLS when [X], use COMMANDS when [Y]
```

---

## Test FS-004: Skills in Claude Code vs OpenCode

**Test ID**: FS-004
**Purpose**: Compare skill behavior between Claude Code and OpenCode

### Setup
1. Have test-skill created
2. Access to OpenCode installation (if available)
3. API interception for both

### Test Steps

**Step 1**: Capture Claude Code skill behavior
- **Action**: Run skill tests from FS-001 and FS-002
- **Record**: How skills work in Claude Code

**Step 2**: Test same skill in OpenCode
- **Action**: Copy test-skill to OpenCode skills directory
- **Action**: Run same tests
- **Expected**: Compare activation and behavior
- **Observe**: Different implementation? Different triggers?

**Step 3**: Compare API structure
- **Action**: Diff the captured API requests
- **Expected**: See how skills are represented differently
- **Observe**:
  - Different prompt injection?
  - Different activation logic?
  - Different context inclusion?

### Verification

**Success criteria**:
- ✅ Documented differences between Claude Code and OpenCode skills
- ✅ Understand implementation variations
- ✅ Can predict behavior based on tool

**Result format**:
```markdown
**FS-004 Result**: PASS / FAIL / PARTIAL

**Comparison**:
| Feature | Claude Code | OpenCode |
|---------|-------------|----------|
| Registration | [how] | [how] |
| Activation | [how] | [how] |
| API structure | [how] | [how] |
| Reliability | [score] | [score] |

**Findings**:
- [Key architectural differences]
- [Why Claude Code skills work differently]

**Evidence**:
- [Side-by-side API captures]

**Conclusion**: [Which implementation is better and why?]
```

---

## Test FS-005: Why Are Skills Usually Empty?

**Test ID**: FS-005
**Purpose**: Investigate why skills are typically empty in Claude Code sessions

### Setup
1. Review findings from FS-001 through FS-004
2. Analyze multiple API captures from different session types

### Investigation Steps

**Step 1**: Analyze default behavior
- **Question**: Does Claude Code ship with default skills?
- **Check**: Fresh installation skill directory
- **Observe**: Are skills opt-in or automatically included?

**Step 2**: Test skill activation conditions
- **Action**: Try various prompts to see if ANY trigger default skills
- **Test prompts**:
  - "analyze this PDF: file.pdf" (might trigger PDF skill)
  - "search the web for X" (might trigger web search skill)
  - "run tests" (might trigger test skill)
- **Expected**: Some prompts activate skills
- **Observe**: What actually happens?

**Step 3**: Review loaded knowledge about skills
- **Action**: Re-read `claude-code-analysis.md` and `hooks-system.md`
- **Question**: What do these docs say about skills?
- **Observe**: Is there a design decision to keep skills minimal?

**Step 4**: Check if skills are different from "tools"
- **Hypothesis**: Maybe what we think are "skills" are actually "tools"
- **Action**: Compare tools section vs skills section in API
- **Observe**: Are tools richer than skills in Claude Code?

### Verification

**Success criteria**:
- ✅ Understand why skills are typically empty
- ✅ Know when/if skills are used
- ✅ Understand design philosophy

**Result format**:
```markdown
**FS-005 Result**: PASS / FAIL / PARTIAL

**Root cause**: [Why skills are usually empty]

**Findings**:
1. [Finding about default skills]
2. [Finding about activation conditions]
3. [Finding about design philosophy]

**Hypothesis confirmed/rejected**:
- [Whether your theories were correct]

**Evidence**:
- [API captures across different session types]
- [Documentation references]

**Conclusion**:
Skills are empty because [reason]. They are intended for [use case].
Claude Code primarily uses [tools/commands/other] instead of skills for [reason].

**Recommendation**:
[When/if to use skills in practice]
```

---

## Aggregate Results Template

After running all FS tests:

```markdown
# Skills Feature Test Results

**Date**: YYYY-MM-DD
**Tester**: [name]
**Claude Code Version**: [version]

## Summary

**Overall Status**: [X/5 tests passed]

| Test ID | Test Name | Status | Key Finding |
|---------|-----------|--------|-------------|
| FS-001 | Default Skills | PASS/FAIL | [finding] |
| FS-002 | Custom Skill | PASS/FAIL | [finding] |
| FS-003 | Skill vs Command | PASS/FAIL | [finding] |
| FS-004 | CC vs OpenCode | PASS/FAIL | [finding] |
| FS-005 | Why Empty | PASS/FAIL | [finding] |

## Key Findings

### Skill System Architecture
- [How skills are designed in Claude Code]
- [Why they differ from expectations]

### When Skills Are Used
- [Actual use cases for skills]
- [When to use skills vs commands vs tools]

### Skills vs Tools vs Commands
- **Skills**: [What they are, when to use]
- **Tools**: [What they are, when to use]
- **Commands**: [What they are, when to use]

## Practical Recommendations

**Should you use skills?**
[YES/NO/DEPENDS - with reasoning]

**When to use skills**:
1. [Use case 1]
2. [Use case 2]

**Alternatives to skills**:
- [When to use slash commands instead]
- [When to use hooks instead]
- [When to use CLAUDE.md instead]

## Open Questions

1. [Questions still unanswered]
2. [What needs more investigation]

## Evidence

[Links to API captures, screenshots, test results]
```

---

## Next Steps

1. Execute all 5 tests
2. Record findings in `results/feature-results-YYYY-MM-DD.md`
3. Cross-reference with API interception tests
4. Document practical recommendations for skill usage
5. Proceed to test-rules.md
