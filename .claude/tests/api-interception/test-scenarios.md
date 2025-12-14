# API Interception Test Scenarios

**Purpose**: Compare what we write (inputs) vs what is sent to API (requests) vs what we receive (responses)

**Status**: Ready for execution

**Prerequisites**: mitmproxy setup complete (see `requests_tracker/QUICK-START.md`)

---

## Background

API interception reveals the true behavior of Claude Code by capturing actual API requests/responses. This is the ground truth for understanding features.

**Infrastructure**: Existing `requests_tracker/` with mitmproxy setup

**What we'll discover**:
- System prompt length and content
- How CLAUDE.md is injected
- Tool availability and descriptions
- Skills activation (or lack thereof)
- Model selection logic
- Hook transformations
- Feature activation patterns

**Critical**: This validates all feature tests by showing what actually happens at the API level.

---

## Prerequisites

### One-Time Setup

**Step 1**: Install mitmproxy certificate
```powershell
cd requests_tracker/scripts
.\install-certificate.ps1
```

**Verify**: Certificate in "Trusted Root Certification Authorities" (NOT "Personal")

**Step 2**: Test capture works
```powershell
.\test-capture.ps1  # Should show ✅ 7.6KB captured
```

### Per-Session Setup

Before running any API tests:
```powershell
cd requests_tracker/scripts
```

**Option A**: Automated single capture (recommended for quick tests)
```powershell
.\capture-with-node-cert.ps1
# Enter prompt when asked, capture saves automatically
```

**Option B**: Manual capture (for long sessions)
```powershell
# Terminal 1: Start mitmproxy
.\quick-start.ps1

# Terminal 2: Run Claude with proxy
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
claude -p "your prompt"

# Terminal 1: Press 'q' to save capture
```

---

## Test API-001: Minimal Baseline Capture

**Test ID**: API-001
**Purpose**: Establish baseline API behavior with minimal prompt

### Setup
- Fresh session, no CLAUDE.md, no custom hooks/skills/rules
- API interception ready

### Test Steps

**Step 1**: Capture minimal request
- **Prompt**: `hello`
- **Action**: Run capture: `.\capture-with-node-cert.ps1`
- **Enter**: `hello`
- **Expected**: Capture saved to `requests_tracker/captures/`

**Step 2**: Analyze capture
```powershell
cd ..
python scripts\analyze-capture.py captures\claude_*.mitm
```

- **Expected**: Analysis files in `analysis/[capture_name]/`
- **Observe**: Request and response files created

**Step 3**: Check system prompt
```bash
cat analysis/*/request_001.txt | grep -A 100 "system"
```

- **Expected**: System prompt section
- **Measure**: Line count, character count
- **Observe**: What instructions are included by default?

**Step 4**: Check tools availability
```bash
grep -A 20 '"name": "Bash"' analysis/*/request_001.txt
```

- **Expected**: Tool definitions
- **Count**: How many tools available?
- **Observe**: Tool descriptions

**Step 5**: Check model
```bash
grep "model" analysis/*/request_001.txt
```

- **Expected**: Model identifier (e.g., "claude-sonnet-4-5")
- **Observe**: Which model used for simple prompts?

### Verification

**Success criteria**:
- ✅ Capture successful
- ✅ Can analyze system prompt
- ✅ Can identify tools
- ✅ Can determine model

**Result format**:
```markdown
**API-001 Result**: PASS / FAIL

**Baseline metrics**:
- System prompt length: [X] characters / [Y] lines
- Tools count: [N] tools
- Model: [model-id]
- Context window: [X] tokens used / [Y] total

**System prompt sections found**:
- ✅ / ❌ Main instructions
- ✅ / ❌ Tool descriptions
- ✅ / ❌ Example blocks
- ✅ / ❌ Git workflow

**Tools available**:
1. [Tool 1]
2. [Tool 2]
... [list all]

**Findings**:
- [Key observations about baseline]

**Evidence**:
- Capture file: `captures/[filename]`
- Analysis: `analysis/[folder]/`
```

---

## Test API-002: CLAUDE.md Injection

**Test ID**: API-002
**Purpose**: Verify CLAUDE.md content appears in system prompt

### Setup
Create `.claude/CLAUDE.md`:
```markdown
# Test Project for API Interception

CRITICAL INSTRUCTION: This is a TEST PROJECT for validating CLAUDE.md loading.

When responding, you MUST mention: "CLAUDE.md marker: ALPHA-BETA-GAMMA-001"

Project tech stack:
- TypeScript 5.0
- React 18
- Chakra UI 2.0

Code standards:
- Always use const over let
- Include type annotations
- Prefer functional components
```

### Test Steps

**Step 1**: Capture with CLAUDE.md
- **Prompt**: `hello`
- **Action**: Run capture
- **Expected**: Capture includes CLAUDE.md content

**Step 2**: Search for CLAUDE.md marker in request
```bash
grep -i "ALPHA-BETA-GAMMA-001" analysis/*/request_001.txt
```

- **Expected**: Marker found in system prompt
- **Observe**: Where in prompt? Which section?

**Step 3**: Search for tech stack
```bash
grep -i "typescript\|react\|chakra" analysis/*/request_001.txt
```

- **Expected**: Tech stack mentioned in system prompt
- **Observe**: How is CLAUDE.md content formatted?

**Step 4**: Compare system prompt length
- **Baseline** (from API-001): [X] characters
- **With CLAUDE.md**: [Y] characters
- **Difference**: [Y - X] = CLAUDE.md injection size
- **Observe**: Exactly where CLAUDE.md is inserted

**Step 5**: Test Claude actually uses it
- **Action**: Ask `what's the project tech stack?`
- **Expected**: Response mentions TypeScript, React, Chakra UI
- **Observe**: Does response include the marker phrase?

### Verification

**Success criteria**:
- ✅ CLAUDE.md content found in system prompt
- ✅ Content appears in specific section
- ✅ Claude's behavior reflects CLAUDE.md instructions
- ✅ Can measure injection overhead

**Result format**:
```markdown
**API-002 Result**: PASS / FAIL / PARTIAL

**CLAUDE.md injection**:
- Found in system prompt: YES / NO
- Location: [section of prompt]
- Size added: [X] characters / [Y] lines

**Content verification**:
- ✅ / ❌ Marker found
- ✅ / ❌ Tech stack found
- ✅ / ❌ Code standards found

**Behavior impact**:
- ✅ / ❌ Claude mentions marker in response
- ✅ / ❌ Claude follows CLAUDE.md instructions

**Findings**:
- [How CLAUDE.md is injected]
- [Format of injection]
- [When it's loaded]

**Evidence**:
```
[Excerpt from system prompt showing CLAUDE.md content]
```
```

---

## Test API-003: Hook Transformation

**Test ID**: API-003
**Purpose**: Verify our knowledge-prompt.mjs hook transforms prompts before API

### Setup
Our knowledge hook is already active

### Test Steps

**Step 1**: Send simple prompt
- **Original prompt**: `hello world`
- **Action**: Capture request
- **Expected**: Hook transformed prompt before sending

**Step 2**: Check what was sent to API
```bash
grep -A 10 "content.*hello world" analysis/*/request_001.txt
```

- **Expected**: Either original prompt or transformed version
- **Observe**: Is the knowledge system header present?

**Step 3**: Compare input vs sent
- **What we typed**: `hello world`
- **What API received**: [from capture]
- **Difference**: [transformation applied by hook]

**Step 4**: Identify hook sections
```bash
grep -i "knowledge system\|available knowledge" analysis/*/request_001.txt
```

- **Expected**: Knowledge system instructions added by hook
- **Observe**: Where in the message?

**Step 5**: Measure hook overhead
- **Original prompt**: ~11 characters
- **Sent to API**: [X] characters
- **Hook added**: [X - 11] characters
- **Overhead**: Significant or minimal?

### Verification

**Success criteria**:
- ✅ Hook transformation visible in API capture
- ✅ Can identify what hook added
- ✅ Understand hook impact on API request
- ✅ Can measure overhead

**Result format**:
```markdown
**API-003 Result**: PASS / FAIL

**Hook transformation**:
- Original prompt: `hello world`
- Sent to API: [X] characters
- Hook added: [Y] characters
- Transformation visible: YES / NO

**Hook additions found**:
- ✅ / ❌ Knowledge system header
- ✅ / ❌ Category list
- ✅ / ❌ Workflow instructions
- ✅ / ❌ Loading commands

**Findings**:
- [What hook adds to prompts]
- [Impact on API request size]
- [When transformation happens]

**Evidence**:
```
[Before/after comparison from capture]
```

**Hook overhead**: MINIMAL / MODERATE / SIGNIFICANT
```

---

## Test API-004: Skills Activation (or Lack Thereof)

**Test ID**: API-004
**Purpose**: Verify skills section in API request and activation behavior

### Setup
- Default configuration (no custom skills)
- Custom skill from feature tests (if created)
- API capture ready

### Test Steps

**Step 1**: Capture with no skills expected
- **Prompt**: `hello`
- **Action**: Capture request
- **Expected**: Skills section in API

**Step 2**: Search for skills section
```bash
grep -i "available_skills\|skills" analysis/*/request_001.txt
```

- **Expected**: Skills section found (may be empty)
- **Observe**: Format and content

**Step 3**: Check if skills array is empty
- **Expected**: Based on research, usually `[]` or absent
- **Observe**: Actual state in this capture

**Step 4**: Test with custom skill (if created)
- **Action**: Create test-skill from feature tests
- **Prompt**: `activate test skill`
- **Capture**: New request
- **Expected**: Either skill appears in available_skills or doesn't
- **Observe**: Is custom skill registered in API?

**Step 5**: Compare to tools section
- **Skills**: [count or empty]
- **Tools**: [count from API-001]
- **Observe**: Are "tools" what we thought were "skills"?

### Verification

**Success criteria**:
- ✅ Located skills section in API request
- ✅ Confirmed skills state (empty or populated)
- ✅ Understand skills vs tools distinction
- ✅ Validated research findings

**Result format**:
```markdown
**API-004 Result**: PASS / FAIL

**Skills section**:
- Present: YES / NO
- Format: [JSON structure]
- Content: EMPTY / [list of skills]

**Custom skill test**:
- test-skill registered: YES / NO
- If yes, how represented: [format]

**Skills vs Tools**:
- Skills count: [N]
- Tools count: [M]
- Relationship: [how they differ]

**Findings**:
- [Why skills are usually empty]
- [What skills actually are vs tools]
- [When skills would be populated]

**Evidence**:
```json
{
  "available_skills": [...],
  "tools": [...]
}
```

**Conclusion**: Research finding CONFIRMED / CONTRADICTED
```

---

## Test API-005: Model Selection

**Test ID**: API-005
**Purpose**: Understand how Claude Code selects models for different requests

### Setup
- Various prompt types ready
- API captures for comparison

### Test Steps

**Step 1**: Simple prompt
- **Prompt**: `hello`
- **Capture and check model**:
```bash
grep '"model"' analysis/*/request_001.txt
```
- **Record**: [model-id]

**Step 2**: Complex code request
- **Prompt**: `write a React component with TypeScript that handles user authentication with JWT tokens`
- **Capture and check model**
- **Record**: [model-id]
- **Observe**: Same or different from simple prompt?

**Step 3**: Explicit tool use
- **Prompt**: `read the file package.json and explain the dependencies`
- **Capture and check model**
- **Record**: [model-id]
- **Observe**: Model selection for tool-heavy requests

**Step 4**: Long conversation context
- **Action**: Continue conversation for 10+ exchanges
- **Capture later request**
- **Observe**: Model changes as context grows?

**Step 5**: Compare all captures
- **Prompt type** → **Model used**
- **Pattern**: When does model change?

### Verification

**Success criteria**:
- ✅ Identified model for different prompt types
- ✅ Understand model selection logic
- ✅ Can predict model for given prompt type

**Result format**:
```markdown
**API-005 Result**: PASS / FAIL

**Model usage**:
| Prompt Type | Model Used | Notes |
|-------------|------------|-------|
| Simple | [model] | [observations] |
| Complex code | [model] | [observations] |
| Tool use | [model] | [observations] |
| Long context | [model] | [observations] |

**Selection logic**:
- [Pattern observed]
- [When model changes]
- [Factors affecting selection]

**Findings**:
- [How Claude Code chooses models]
- [Optimization strategy]

**Evidence**:
[Model fields from multiple captures]

**Model strategy**: STATIC / DYNAMIC / ADAPTIVE
```

---

## Test API-006: Feature-Rich Request

**Test ID**: API-006
**Purpose**: Capture request with all features active (CLAUDE.md, hooks, custom skills, rules)

### Setup
- CLAUDE.md with instructions
- Knowledge hook active (default)
- Custom skill created
- Rules defined
- API capture ready

### Test Steps

**Step 1**: Capture maximally-featured request
- **Prompt**: `create a new UserProfile component following project patterns`
- **Expected**: All features impact API request
- **Observe**: Full request structure

**Step 2**: Identify all feature contributions
```bash
# CLAUDE.md
grep -i "test project\|tech stack" analysis/*/request_001.txt

# Hook transformation
grep -i "knowledge system" analysis/*/request_001.txt

# Skills
grep -i "available_skills" analysis/*/request_001.txt

# Tools
grep -i '"tools"' analysis/*/request_001.txt
```

**Step 3**: Measure combined overhead
- **Baseline prompt** (API-001): [X] characters
- **Feature-rich request**: [Y] characters
- **Total overhead**: [Y - X] characters
- **Breakdown**:
  - CLAUDE.md: [A] chars
  - Hook: [B] chars
  - Skills: [C] chars
  - Other: [D] chars

**Step 4**: Document full API structure
```bash
cat analysis/*/request_001.txt > .claude/tests/results/full-api-request-example.txt
```

**Step 5**: Analyze system prompt composition
- **Sections identified**: [list all sections]
- **Order**: [how sections are arranged]
- **Total size**: [characters, lines, estimated tokens]

### Verification

**Success criteria**:
- ✅ All features visible in API request
- ✅ Can measure each feature's contribution
- ✅ Understand full request structure
- ✅ Have template of maximum request

**Result format**:
```markdown
**API-006 Result**: PASS / FAIL

**Feature contributions**:
| Feature | Present | Size | Location |
|---------|---------|------|----------|
| CLAUDE.md | YES/NO | [X] chars | [section] |
| Hook | YES/NO | [Y] chars | [section] |
| Skills | YES/NO | [Z] chars | [section] |
| Tools | YES/NO | [W] chars | [section] |

**Total request structure**:
- System prompt: [X] characters
- User message: [Y] characters
- Tools: [Z] characters
- Total: [X+Y+Z] characters (~[N] tokens)

**System prompt sections** (in order):
1. [Section 1] ([X] chars)
2. [Section 2] ([Y] chars)
3. [Section 3] ([Z] chars)
...

**Findings**:
- [How all features combine]
- [Total overhead of features]
- [Request structure]

**Evidence**:
Full request saved: `.claude/tests/results/full-api-request-example.txt`
```

---

## Test API-007: Error Scenario

**Test ID**: API-007
**Purpose**: Capture API behavior when errors occur

### Setup
- Intentionally trigger errors
- API capture active

### Test Steps

**Step 1**: Invalid tool call
- **Prompt**: `read the file /nonexistent/fake/path/file.txt`
- **Capture**: Request and response
- **Expected**: Tool attempts to execute, errors
- **Observe**: How error is communicated

**Step 2**: Check error in response
```bash
grep -i "error" analysis/*/response_001.txt
```

- **Expected**: Error message in response
- **Observe**: Error format and detail

**Step 3**: Malformed request (if possible to create)
- **Action**: Modify hook to send malformed JSON
- **Expected**: API rejects request
- **Observe**: Error handling

**Step 4**: API rate limit or failure
- **Note**: May not be testable
- **If encountered**: Capture for analysis

**Step 5**: Compare error vs success responses
- **Structure differences**: [observations]
- **Error indicators**: [what shows error state]

### Verification

**Success criteria**:
- ✅ Can capture error scenarios
- ✅ Understand error response format
- ✅ Know how errors are communicated

**Result format**:
```markdown
**API-007 Result**: PASS / FAIL

**Error scenarios tested**:
| Scenario | Captured | Error Format |
|----------|----------|--------------|
| Invalid tool call | YES/NO | [format] |
| Malformed request | YES/NO | [format] |
| Other errors | YES/NO | [format] |

**Error response structure**:
```json
{
  "error": {
    ...
  }
}
```

**Findings**:
- [How errors are returned]
- [Error detail level]

**Evidence**:
[Error response examples]
```

---

## Aggregate Analysis Template

After running all API tests:

```markdown
# API Interception Test Results

**Date**: YYYY-MM-DD
**Tester**: [name]
**Claude Code Version**: [version]
**mitmproxy Version**: [version]

## Summary

**Tests completed**: [X/7]

| Test ID | Test Name | Status | Key Finding |
|---------|-----------|--------|-------------|
| API-001 | Baseline | PASS/FAIL | [finding] |
| API-002 | CLAUDE.md | PASS/FAIL | [finding] |
| API-003 | Hook Transform | PASS/FAIL | [finding] |
| API-004 | Skills | PASS/FAIL | [finding] |
| API-005 | Model Selection | PASS/FAIL | [finding] |
| API-006 | Feature-Rich | PASS/FAIL | [finding] |
| API-007 | Errors | PASS/FAIL | [finding] |

## System Prompt Analysis

**Baseline system prompt**:
- Length: [X] characters ([Y] lines, ~[Z] tokens)
- Sections: [count]
- Key sections: [list]

**With all features**:
- Length: [A] characters ([B] lines, ~[C] tokens)
- Feature overhead: [A - X] characters
- Breakdown: [by feature]

**Prompt structure** (confirmed):
```
1. [Section name] ([size])
2. [Section name] ([size])
...
```

## Feature Validation

### CLAUDE.md
- **Injected**: YES / NO / CONDITIONAL
- **Location**: [where in system prompt]
- **Impact**: [size and behavior changes]

### Skills
- **Present in API**: YES / NO
- **Default state**: EMPTY / POPULATED
- **Custom skills**: SUPPORTED / NOT_SUPPORTED

### Hooks
- **Transformation visible**: YES / NO
- **Overhead**: [size added]
- **Impact**: [what changed]

### Tools
- **Count**: [N] tools
- **Descriptions**: DETAILED / BASIC
- **Custom tools**: SUPPORTED / NOT_SUPPORTED

### Model Selection
- **Default**: [model-id]
- **Logic**: STATIC / DYNAMIC
- **Factors**: [what affects selection]

## What We Write vs What's Sent

### Simple prompt
- **Input**: `hello`
- **Sent**: [actual content with all transformations]
- **Ratio**: Input:[X] chars → Sent:[Y] chars (× [Y/X] expansion)

### Complex prompt
- **Input**: `[example]`
- **Sent**: [actual content]
- **Ratio**: [expansion factor]

### With CLAUDE.md
- **Additional context**: [X] chars
- **Impact**: [how it changes behavior]

## Cross-Validation with Feature Tests

| Feature | Feature Test Finding | API Capture Finding | Match? |
|---------|---------------------|---------------------|--------|
| CLAUDE.md loading | [finding] | [finding] | YES/NO |
| Skills activation | [finding] | [finding] | YES/NO |
| Hook transformation | [finding] | [finding] | YES/NO |
| Model selection | [finding] | [finding] | YES/NO |

**Discrepancies**: [List any contradictions]

## Key Discoveries

### Surprising findings
1. [Unexpected discovery 1]
2. [Unexpected discovery 2]

### Confirmed hypotheses
1. [Hypothesis confirmed]
2. [Hypothesis confirmed]

### Rejected hypotheses
1. [Hypothesis rejected]
2. [Hypothesis rejected]

## Practical Implications

**For using Claude Code**:
1. [Recommendation based on findings]
2. [Recommendation based on findings]

**For optimizing prompts**:
1. [How to work with observed behavior]
2. [How to minimize overhead]

**For debugging**:
1. [How to use API captures for troubleshooting]
2. [What to look for in captures]

## Evidence

**Capture files**: `requests_tracker/captures/`
**Analysis files**: `requests_tracker/analysis/`
**Full examples**: `.claude/tests/results/`

---

**Next**: Cross-reference with feature tests, update reliability scores, document in `results/api-results-YYYY-MM-DD.md`
```

---

## Quick Reference

### Capture a Request
```powershell
cd requests_tracker/scripts
.\capture-with-node-cert.ps1
# Enter your prompt
```

### Analyze Capture
```powershell
cd requests_tracker
python scripts\analyze-capture.py captures\[filename].mitm
```

### Find Content in Capture
```bash
# System prompt
grep -A 100 "system" analysis/*/request_001.txt

# CLAUDE.md marker
grep -i "your-marker" analysis/*/request_001.txt

# Tools list
grep -A 10 '"tools"' analysis/*/request_001.txt

# Model
grep '"model"' analysis/*/request_001.txt
```

### Common Checks
```bash
# System prompt size
cat analysis/*/request_001.txt | grep -A 1000 "system" | wc -l

# Tools count
grep '"name"' analysis/*/request_001.txt | wc -l

# Skills present
grep -i "available_skills" analysis/*/request_001.txt
```

---

## Next Steps

1. Complete mitmproxy setup (if not done)
2. Run all 7 API test scenarios
3. Cross-validate with feature test findings
4. Document comprehensive API structure
5. Create practical examples based on findings
6. Proceed to pattern/reliability tests
