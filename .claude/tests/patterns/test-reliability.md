# Reliability and Pattern Documentation Tests

**Purpose**: Document behavioral patterns and reliability across multiple test runs

**Status**: Ready for execution

**Critical**: These tests require running the same scenarios multiple times to identify patterns and measure consistency.

---

## Background

Single test runs show "what happened once". Multiple runs reveal patterns: "what happens reliably".

**Reliability scoring**:
- **ALWAYS** (100%): Works in all test runs
- **USUALLY** (75-99%): Works most of the time
- **SOMETIMES** (25-74%): Works inconsistently
- **RARELY** (1-24%): Almost never works
- **NEVER** (0%): Doesn't work

**What we'll discover**:
- Which features are rock-solid vs flaky
- Edge cases and failure modes
- Conditions that affect reliability
- Patterns in behavior variations

---

## Test PR-001: CLAUDE.md Loading Reliability

**Test ID**: PR-001
**Purpose**: Measure consistency of CLAUDE.md loading and application

### Setup
Use CLAUDE.md from test-claude-md.md:
```markdown
# Test Project

You are working on a TEST PROJECT.

When asked about the project, respond with: "This is the TEST PROJECT."

CRITICAL: Always mention "CLAUDE.md active" in every response.
```

### Test Steps

**Run this test 10 times** (fresh session each time):

**For each iteration (1-10)**:

**Step 1**: Start fresh session
- **Action**: `claude`
- **Record**: Session start time

**Step 2**: Ask about project
- **Prompt**: `what project is this?`
- **Record**:
  - ✅ / ❌ Mentions "TEST PROJECT"
  - ✅ / ❌ Mentions "CLAUDE.md active"
  - Response time

**Step 3**: Follow-up test
- **Prompt**: `what is 2+2?`
- **Record**:
  - ✅ / ❌ Still mentions "CLAUDE.md active"
  - Consistency with first response

**Step 4**: Exit session
- **Action**: `exit`

### Analysis

After all 10 runs, aggregate:

```markdown
**CLAUDE.md Loading Results** (N=10 runs):

| Run | Mentions TEST PROJECT | Mentions Active | Follow-up Consistent |
|-----|----------------------|-----------------|----------------------|
| 1   | ✅ / ❌               | ✅ / ❌          | ✅ / ❌               |
| 2   | ✅ / ❌               | ✅ / ❌          | ✅ / ❌               |
...
| 10  | ✅ / ❌               | ✅ / ❌          | ✅ / ❌               |

**Success rates**:
- TEST PROJECT mention: [X/10] ([Y]%)
- Active mention: [A/10] ([B]%)
- Follow-up consistency: [C/10] ([D]%)

**Reliability score**: [Based on lowest success rate]
- If ≥ 100%: ALWAYS
- If 75-99%: USUALLY
- If 25-74%: SOMETIMES
- If 1-24%: RARELY
- If 0%: NEVER

**Patterns observed**:
- [Pattern 1]
- [Pattern 2]

**Failure modes** (if any):
- [When did it fail?]
- [What was different?]
- [Common failure pattern?]
```

### Verification

**Success criteria**:
- ✅ Completed 10 runs
- ✅ Consistent data collection
- ✅ Identified patterns or variance
- ✅ Assigned reliability score

**Result format**:
```markdown
**PR-001 Result**: [X/10 runs successful]

**Reliability**: ALWAYS / USUALLY / SOMETIMES / RARELY / NEVER

**Patterns**:
1. [Pattern observed]
2. [Pattern observed]

**Failure conditions**:
- [What causes failures]

**Recommendation**:
[Can you rely on CLAUDE.md loading? When/how?]
```

---

## Test PR-002: Hook Execution Reliability

**Test ID**: PR-002
**Purpose**: Measure consistency of hook execution (our knowledge-prompt.mjs)

### Setup
- knowledge-prompt.mjs hook active (default)
- Fresh hook-logs.txt file

### Test Steps

**Run this test 10 times**:

**For each iteration (1-10)**:

**Step 1**: Clear logs
```bash
echo "" > .claude/tests/results/hook-logs.txt
```

**Step 2**: Send prompt
- **Prompt**: `test prompt number [N]` (where N = iteration number)
- **Record**:
  - Timestamp of prompt
  - Response received (yes/no)
  - Response includes knowledge system header (yes/no)

**Step 3**: Measure timing
- **Start**: When you press Enter
- **Hook complete**: When you see status message
- **Response start**: When Claude starts responding
- **Timing**: Hook execution time

**Step 4**: Verify hook fired
- **Check**: Did hook status message appear?
- **Check**: Does response have knowledge header?
- **Record**: Hook execution success (yes/no)

### Analysis

```markdown
**Hook Execution Results** (N=10 runs):

| Run | Hook Fired | Header Present | Execution Time |
|-----|------------|----------------|----------------|
| 1   | ✅ / ❌     | ✅ / ❌          | [X]ms          |
| 2   | ✅ / ❌     | ✅ / ❌          | [Y]ms          |
...
| 10  | ✅ / ❌     | ✅ / ❌          | [Z]ms          |

**Success rates**:
- Hook fired: [X/10] ([Y]%)
- Header present: [A/10] ([B]%)

**Performance**:
- Average execution time: [X]ms
- Min: [Y]ms
- Max: [Z]ms
- Std dev: [W]ms

**Reliability score**: ALWAYS / USUALLY / SOMETIMES / RARELY / NEVER

**Patterns**:
- [Execution time pattern]
- [Failure pattern if any]
```

### Verification

**Success criteria**:
- ✅ Completed 10 runs
- ✅ Measured timing consistently
- ✅ Identified performance patterns
- ✅ Assigned reliability score

**Result format**:
```markdown
**PR-002 Result**: [X/10 runs successful]

**Reliability**: ALWAYS / USUALLY / SOMETIMES / RARELY / NEVER

**Performance**: [Average]ms (±[StdDev]ms)

**Patterns**:
- [Performance pattern]
- [Success pattern]

**Failure modes** (if any):
- [When hook fails]

**Recommendation**:
[Is hook reliable enough for production use?]
```

---

## Test PR-003: Compaction Trigger Consistency

**Test ID**: PR-003
**Purpose**: Measure consistency of compaction trigger threshold

### Setup
- Fresh sessions
- Prepared long-form prompts to fill context
- Method to track token count (via API captures)

### Test Steps

**Run this test 5 times** (compaction test is time-intensive):

**For each iteration (1-5)**:

**Step 1**: Start fresh session with API capture

**Step 2**: Build context progressively
- **Send prompts**: Series of 200-word explanations
- **Topics**: TypeScript, React, databases, algorithms, etc.
- **Track**: Token count via API captures

**Step 3**: Monitor for compaction
- **Continue**: Until compaction triggers
- **Record**:
  - Token count when compaction occurred
  - Number of messages before compaction
  - Time to compaction
  - Whether warning appeared

**Step 4**: Verify compaction
- **Check**: API capture shows context reduction
- **Record**: Compaction success (yes/no)

### Analysis

```markdown
**Compaction Trigger Results** (N=5 runs):

| Run | Tokens at Trigger | Messages Count | Time to Compact | Warning? |
|-----|-------------------|----------------|-----------------|----------|
| 1   | [X]              | [N]            | [T] min         | YES/NO   |
| 2   | [Y]              | [M]            | [U] min         | YES/NO   |
...
| 5   | [Z]              | [P]            | [V] min         | YES/NO   |

**Threshold consistency**:
- Average trigger: [X] tokens
- Min trigger: [Y] tokens
- Max trigger: [Z] tokens
- Variance: ±[W] tokens ([P]%)

**Trigger is**: CONSISTENT / VARIABLE / UNPREDICTABLE

**Patterns**:
- [Pattern in trigger timing]
- [Conditions affecting trigger]
```

### Verification

**Success criteria**:
- ✅ Completed 5 compaction tests
- ✅ Measured trigger threshold each time
- ✅ Calculated variance
- ✅ Identified consistency level

**Result format**:
```markdown
**PR-003 Result**: [X/5 runs completed]

**Trigger threshold**: [Average] tokens (±[Variance])

**Consistency**: CONSISTENT / VARIABLE / UNPREDICTABLE

**Patterns**:
- [When compaction triggers]

**Recommendation**:
[Can you predict compaction? How to manage it?]
```

---

## Test PR-004: Tool Call Reliability

**Test ID**: PR-004
**Purpose**: Measure consistency of tool execution

### Setup
- Tools to test: Read, Write, Bash, Glob
- Test files prepared

### Test Steps

**Run each tool test 10 times**:

#### Read Tool Test

**For iterations 1-10**:
- **Prompt**: `read the file README.md`
- **Record**:
  - ✅ / ❌ Tool executed
  - ✅ / ❌ File content returned
  - ✅ / ❌ Content correct
  - Response time

#### Write Tool Test

**For iterations 1-10**:
- **Prompt**: `create a file test-[N].txt with content "test [N]"`
- **Record**:
  - ✅ / ❌ Tool executed
  - ✅ / ❌ File created
  - ✅ / ❌ Content correct
  - Response time

#### Bash Tool Test

**For iterations 1-10**:
- **Prompt**: `list files in current directory`
- **Record**:
  - ✅ / ❌ Tool executed
  - ✅ / ❌ Command ran
  - ✅ / ❌ Output correct
  - Response time

#### Glob Tool Test

**For iterations 1-10**:
- **Prompt**: `find all .md files`
- **Record**:
  - ✅ / ❌ Tool executed
  - ✅ / ❌ Files found
  - ✅ / ❌ Results correct
  - Response time

### Analysis

```markdown
**Tool Reliability Results** (N=10 runs per tool):

| Tool | Success Rate | Avg Time | Issues |
|------|--------------|----------|--------|
| Read | [X/10] ([Y]%) | [Z]ms | [issues] |
| Write | [A/10] ([B]%) | [C]ms | [issues] |
| Bash | [D/10] ([E]%) | [F]ms | [issues] |
| Glob | [G/10] ([H]%) | [I]ms | [issues] |

**Overall tool reliability**: [Lowest score]

**Patterns**:
- [Pattern 1]
- [Pattern 2]

**Failure modes**:
- [Common failures]
```

### Verification

**Success criteria**:
- ✅ Tested 4 tools × 10 runs = 40 tests
- ✅ Measured success rates
- ✅ Identified failure patterns
- ✅ Assigned reliability scores

**Result format**:
```markdown
**PR-004 Result**: [X/40 total tests successful]

**Most reliable tool**: [tool name] ([X]%)

**Least reliable tool**: [tool name] ([Y]%)

**Patterns**:
- [What makes tools fail]

**Recommendation**:
[Which tools to rely on, which to be careful with]
```

---

## Test PR-005: Cross-Session Consistency

**Test ID**: PR-005
**Purpose**: Test if behavior is consistent across different session types

### Setup
Test same request in different contexts:
- Fresh session
- Mid-session (after 5 exchanges)
- Long session (after 20+ exchanges)
- After compaction

### Test Steps

**Test prompt**: `create a function to sort an array in TypeScript`

**Context A**: Fresh session
- **Runs**: 5 times
- **Record**: Response quality, patterns used, consistency

**Context B**: Mid-session (after 5 exchanges)
- **Runs**: 5 times
- **Record**: Response quality, patterns used, consistency

**Context C**: Long session (after 20+ exchanges)
- **Runs**: 5 times
- **Record**: Response quality, patterns used, consistency

**Context D**: After compaction
- **Runs**: 5 times
- **Record**: Response quality, patterns used, consistency

### Analysis

```markdown
**Cross-Session Consistency** (N=5 runs per context):

| Context | Quality Score (1-5) | Uses TypeScript | Includes Types | Consistent |
|---------|---------------------|-----------------|----------------|------------|
| Fresh | [avg] | [X/5] | [Y/5] | [Z/5] |
| Mid-session | [avg] | [A/5] | [B/5] | [C/5] |
| Long session | [avg] | [D/5] | [E/5] | [F/5] |
| After compact | [avg] | [G/5] | [H/5] | [I/5] |

**Consistency across contexts**: HIGH / MEDIUM / LOW

**Degradation observed**: NONE / MINIMAL / MODERATE / SIGNIFICANT

**Patterns**:
- [How responses change with context]
- [Impact of session length]
- [Impact of compaction]
```

### Verification

**Success criteria**:
- ✅ Tested 4 contexts × 5 runs = 20 tests
- ✅ Compared quality across contexts
- ✅ Identified degradation patterns
- ✅ Measured consistency

**Result format**:
```markdown
**PR-005 Result**: [X/20 tests completed]

**Consistency**: HIGH / MEDIUM / LOW

**Context impact**: [Which context affects quality most]

**Patterns**:
- [How behavior changes]

**Recommendation**:
[When to start fresh session, when compaction becomes problematic]
```

---

## Aggregate Pattern Analysis

After completing all pattern tests, create comprehensive analysis:

```markdown
# Reliability and Pattern Analysis Report

**Date**: YYYY-MM-DD
**Test Period**: [dates]
**Total Tests Run**: [N]

## Summary

| Test ID | Feature | Sample Size | Reliability | Key Pattern |
|---------|---------|-------------|-------------|-------------|
| PR-001 | CLAUDE.md | N=10 | [score] | [pattern] |
| PR-002 | Hooks | N=10 | [score] | [pattern] |
| PR-003 | Compaction | N=5 | [score] | [pattern] |
| PR-004 | Tools | N=40 | [score] | [pattern] |
| PR-005 | Cross-session | N=20 | [score] | [pattern] |

## Reliability Rankings

**Most reliable features**:
1. [Feature]: [score] - [why]
2. [Feature]: [score] - [why]
3. [Feature]: [score] - [why]

**Least reliable features**:
1. [Feature]: [score] - [why]
2. [Feature]: [score] - [why]
3. [Feature]: [score] - [why]

## Behavioral Patterns

### Pattern 1: [Name]
- **Observed in**: [which tests]
- **Frequency**: [how often]
- **Conditions**: [when it happens]
- **Impact**: [what it affects]

### Pattern 2: [Name]
[Same format]

## Statistical Summary

**Overall reliability metrics**:
- Mean reliability: [X]%
- Median reliability: [Y]%
- Standard deviation: [Z]%

**Performance metrics**:
- Average response time: [X]ms
- Tool execution time: [Y]ms
- Hook execution time: [Z]ms

## Failure Mode Analysis

### Common Failures

**Failure Mode 1**: [Description]
- **Frequency**: [X]%
- **Affected features**: [list]
- **Root cause**: [analysis]
- **Workaround**: [solution]

**Failure Mode 2**: [Description]
[Same format]

### Edge Cases

**Edge Case 1**: [Description]
- **Scenario**: [when it occurs]
- **Behavior**: [what happens]
- **Reproducibility**: [how reliably it occurs]

## Recommendations

### For Production Use

**Reliable enough for production**:
- [Feature 1]: [conditions]
- [Feature 2]: [conditions]

**Use with caution**:
- [Feature 1]: [why and how to mitigate]
- [Feature 2]: [why and how to mitigate]

**Not recommended**:
- [Feature 1]: [why and alternatives]

### Best Practices

Based on reliability testing:

1. **CLAUDE.md**: [recommendations]
2. **Hooks**: [recommendations]
3. **Compaction**: [recommendations]
4. **Tools**: [recommendations]
5. **Session management**: [recommendations]

### Risk Mitigation

**For critical operations**:
1. [Mitigation strategy 1]
2. [Mitigation strategy 2]

**For long sessions**:
1. [Mitigation strategy 1]
2. [Mitigation strategy 2]

## Future Testing

**Questions for deeper investigation**:
1. [Question 1]
2. [Question 2]

**Recommended additional tests**:
1. [Test idea 1]
2. [Test idea 2]

## Evidence

**Raw data**: `.claude/tests/results/pattern-test-data.csv`
**Test logs**: `.claude/tests/results/hook-logs.txt`
**API captures**: `requests_tracker/captures/reliability-test-*`
```

---

## Statistical Analysis Template

For quantitative analysis:

```markdown
## Statistical Analysis

### CLAUDE.md Loading

**Sample**: N=10
**Success rate**: [X]% (95% CI: [Y]-[Z]%)
**Null hypothesis**: CLAUDE.md loads 100% of the time
**Result**: [ACCEPT/REJECT] (p=[value])

### Hook Execution

**Sample**: N=10
**Mean execution time**: [X]ms
**Standard deviation**: [Y]ms
**95% confidence interval**: [[A]ms, [B]ms]
**Outliers**: [count] ([values])

### Compaction Trigger

**Sample**: N=5
**Mean trigger**: [X] tokens
**Variance**: [Y] tokens²
**Coefficient of variation**: [Z]%
**Consistency rating**: [HIGH/MEDIUM/LOW]

### Tool Reliability

**Sample**: N=40 (10 per tool)
**Overall success**: [X]% (95% CI: [Y]-[Z]%)
**Chi-square test**: Tool reliability independent of tool type?
**Result**: χ²=[value], p=[value], [INDEPENDENT/DEPENDENT]
```

---

## Next Steps

1. Execute all 5 pattern tests (total ~85 test runs)
2. Aggregate results using templates
3. Perform statistical analysis
4. Cross-reference with feature and API tests
5. Document final reliability scores
6. Create practical recommendations
7. Record in `results/reliability-results-YYYY-MM-DD.md`
