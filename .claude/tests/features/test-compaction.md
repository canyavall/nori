# Context Compaction Feature Tests

**Purpose**: Test Claude Code's context compaction behavior, triggers, and reliability

**Status**: Ready for execution

**Background Context**: When context window fills, Claude Code should compact the conversation. From our knowledge, Claude Code uses sophisticated compaction vs OpenCode's simpler approach.

---

## Background

Context compaction is critical for long sessions. From loaded knowledge:
- **Claude Code**: Uses "wU2 compactor" (intelligent compression)
- **OpenCode**: Reactive compaction at 90% capacity
- Compaction generates structured summaries to preserve information

**Questions to answer**:
1. When does compaction trigger?
2. What algorithm is used?
3. What's preserved vs discarded?
4. How reliable is compaction?
5. Does compaction affect response quality?
6. Can compaction be configured or disabled?

---

## Test FC-001: Compaction Trigger Threshold

**Test ID**: FC-001
**Purpose**: Determine what triggers context compaction

### Setup
1. Start fresh Claude Code session
2. API interception running to monitor context size
3. Prepared to generate long conversation

### Test Steps

**Step 1**: Establish baseline context
- **Action**: Start session: `claude -p "hello"`
- **Action**: Check API capture for context window stats
- **Expected**: Low context usage initially
- **Observe**: What's the starting token count?

**Step 2**: Gradually increase context
- **Action**: Have conversation with multiple back-and-forth exchanges
- **Prompts to use**:
  - "Tell me about TypeScript in 200 words"
  - "Explain React hooks with examples"
  - "Write a function to sort an array"
  - "Describe database indexing strategies"
  - (Continue with similar prompts)
- **Expected**: Context grows with each exchange
- **Observe**: Track token count via API captures

**Step 3**: Monitor for compaction event
- **Action**: Continue conversation until compaction triggers
- **Expected**: At some threshold, compaction occurs
- **Observe**:
  - At what token count does it trigger?
  - Is there a warning before compaction?
  - How long does compaction take?

**Step 4**: Verify compaction occurred
- **Action**: Check API capture after compaction
- **Expected**: Context size reduced
- **Observe**:
  - How much was the reduction?
  - What percentage of tokens saved?
  - Was information summarized or deleted?

**Step 5**: Test threshold consistency
- **Action**: Repeat test 2-3 times in fresh sessions
- **Expected**: Similar trigger threshold each time
- **Observe**: Is threshold consistent or variable?

### Verification

**Success criteria**:
- ✅ Can identify compaction trigger threshold
- ✅ Compaction is detectable in API captures
- ✅ Threshold is consistent across sessions
- ✅ Context reduction is measurable

**Result format**:
```markdown
**FC-001 Result**: PASS / FAIL / PARTIAL

**Trigger threshold**: [X] tokens / [Y]% of context window

**Threshold consistency**:
- Test 1: [X] tokens
- Test 2: [Y] tokens
- Test 3: [Z] tokens
- Variance: [±N] tokens

**Findings**:
- [When compaction triggers]
- [How predictable the threshold is]
- [Any warnings or indicators]

**Evidence**:
- [API captures showing token counts]
- [Before/after compaction comparisons]

**Compaction trigger**: CONSISTENT / VARIABLE / UNPREDICTABLE
```

---

## Test FC-002: Compaction Algorithm

**Test ID**: FC-002
**Purpose**: Understand what compaction algorithm is used

### Setup
1. Fresh session ready to approach compaction threshold
2. API interception capturing full messages
3. Specific test conversation designed to trigger compaction

### Test Steps

**Step 1**: Create conversation with trackable content
- **Action**: Send prompts with unique, memorable content:
  - "Remember: Code A is 'ALPHA_MARKER_001'"
  - "Remember: Code B is 'BETA_MARKER_002'"
  - "Remember: Code C is 'GAMMA_MARKER_003'"
  - (Continue building context with markers)
- **Expected**: Each marker appears in API message history
- **Observe**: Messages building up in context

**Step 2**: Trigger compaction
- **Action**: Continue conversation until compaction occurs
- **Expected**: Compaction reduces message count/size
- **Observe**: Compaction event

**Step 3**: Test recall after compaction
- **Action**: Ask Claude about the markers:
  - "What was Code A?"
  - "What was Code B?"
  - "What was Code C?"
- **Expected**: Either remembers (info preserved) or doesn't (info lost)
- **Observe**: Which information survived compaction?

**Step 4**: Examine compacted context
- **Action**: Check API capture after compaction
- **Expected**: See summary or compressed messages
- **Observe**:
  - Is there a summary message?
  - What format is it in?
  - How detailed is the summary?

**Step 5**: Compare compaction strategies
- **Hypothesis**: Claude Code uses "wU2 compactor" (intelligent)
- **Action**: Check if compaction is:
  - Simple deletion (oldest messages removed)
  - Summarization (messages condensed into summary)
  - Semantic compression (important info preserved)
- **Observe**: Algorithm characteristics

### Verification

**Success criteria**:
- ✅ Understand compaction algorithm type
- ✅ Know what information is preserved
- ✅ Can see summary format
- ✅ Differentiate from simple deletion

**Result format**:
```markdown
**FC-002 Result**: PASS / FAIL / PARTIAL

**Algorithm type**: DELETION / SUMMARIZATION / SEMANTIC_COMPRESSION / HYBRID

**Information preservation**:
| Marker | Preserved | Details |
|--------|-----------|---------|
| ALPHA_MARKER_001 | YES/NO | [details] |
| BETA_MARKER_002 | YES/NO | [details] |
| GAMMA_MARKER_003 | YES/NO | [details] |

**Summary format**:
```
[Example of generated summary]
```

**Findings**:
- [What algorithm is used]
- [How information is preserved]
- [Quality of summarization]

**Evidence**:
- [API capture showing before/after messages]
- [Summary message content]

**Algorithm sophistication**: HIGH / MEDIUM / LOW
```

---

## Test FC-003: Compaction Impact on Quality

**Test ID**: FC-003
**Purpose**: Measure how compaction affects response quality

### Setup
1. Design test conversation with specific requirements
2. API interception active
3. Ready to test before and after compaction

### Test Steps

**Step 1**: Establish project context before compaction
- **Action**: Build up project context:
  - "This is a TypeScript project using React"
  - "We use Chakra UI for styling"
  - "API calls go through React Query"
  - "Tests use Jest and React Testing Library"
  - (Add more project-specific context)
- **Expected**: Rich project understanding
- **Observe**: Context window filling

**Step 2**: Test Claude's understanding (before compaction)
- **Action**: "Create a new UserProfile component"
- **Expected**: Uses React, Chakra UI, follows project patterns
- **Observe**: Quality of response with full context
- **Record**: Response quality score (1-5)

**Step 3**: Trigger compaction
- **Action**: Continue conversation to trigger compaction
- **Expected**: Compaction reduces context
- **Observe**: Compaction event

**Step 4**: Test same request (after compaction)
- **Action**: "Create a new OrderList component"
- **Expected**: Still uses React, Chakra UI, follows patterns
- **Observe**: Quality of response with compacted context
- **Record**: Response quality score (1-5)

**Step 5**: Compare responses
- **Expected**: Similar quality before and after (good compaction preserves important info)
- **Observe**:
  - Does Claude still remember project tech stack?
  - Are patterns still followed?
  - Any degradation in quality?

### Verification

**Success criteria**:
- ✅ Can measure quality before/after compaction
- ✅ Important context is preserved
- ✅ Minimal quality degradation
- ✅ Understand what's most at risk during compaction

**Result format**:
```markdown
**FC-003 Result**: PASS / FAIL / PARTIAL

**Quality comparison**:
| Metric | Before Compaction | After Compaction |
|--------|-------------------|------------------|
| Follows tech stack | YES/NO | YES/NO |
| Follows patterns | YES/NO | YES/NO |
| Code quality (1-5) | [score] | [score] |
| Completeness (1-5) | [score] | [score] |

**Preserved knowledge**:
- ✅ / ❌ Tech stack (React, TypeScript)
- ✅ / ❌ Styling library (Chakra UI)
- ✅ / ❌ Patterns (React Query, Jest)
- ✅ / ❌ Project structure

**Findings**:
- [What context is preserved well]
- [What context is lost or degraded]
- [Overall quality impact]

**Evidence**:
- [Code examples before/after compaction]

**Quality impact**: NONE / MINIMAL / MODERATE / SIGNIFICANT
```

---

## Test FC-004: Compaction Configuration

**Test ID**: FC-004
**Purpose**: Test if compaction can be configured or disabled

### Setup
Review settings and configuration options

### Test Steps

**Step 1**: Check settings.json for compaction config
- **Action**: `cat .claude/settings.json`
- **Expected**: Look for compaction-related settings
- **Observe**: Any options like:
  - `compactionThreshold`
  - `compactionStrategy`
  - `enableCompaction`
  - `summaryDetail`

**Step 2**: Check command-line options
- **Action**: `claude --help`
- **Expected**: Look for compaction flags
- **Observe**: Any CLI options for compaction control?

**Step 3**: Test disabling compaction (if possible)
- **Action**: Set `enableCompaction: false` (if available)
- **Action**: Run long conversation
- **Expected**: Context grows without compaction
- **Observe**: Does setting work? What happens at max context?

**Step 4**: Test threshold adjustment (if possible)
- **Action**: Set lower threshold (e.g., 50% instead of 90%)
- **Action**: Build context
- **Expected**: Compaction triggers earlier
- **Observe**: Is threshold configurable?

**Step 5**: Test strategy selection (if possible)
- **Action**: Try different compaction strategies
- **Expected**: Different compaction behavior
- **Observe**: Available strategies?

### Verification

**Success criteria**:
- ✅ Found compaction configuration options (or confirmed none exist)
- ✅ Tested available options
- ✅ Understand configurability

**Result format**:
```markdown
**FC-004 Result**: PASS / FAIL / PARTIAL

**Configuration options found**:
| Option | Location | Effect |
|--------|----------|--------|
| [option1] | settings.json | [what it does] |
| [option2] | CLI flag | [what it does] |

**Configurability**: HIGHLY_CONFIGURABLE / SOME_OPTIONS / MINIMAL / NONE

**Findings**:
- [What can be configured]
- [What's hardcoded]
- [Recommended settings]

**Evidence**:
- [Settings file examples]
- [CLI help output]
- [Test results with different configs]

**Recommendation**:
[Best configuration for different use cases]
```

---

## Test FC-005: Compaction Reliability

**Test ID**: FC-005
**Purpose**: Test compaction reliability and failure modes

### Setup
1. Prepared to run long test conversations
2. Monitoring for compaction errors

### Test Steps

**Step 1**: Test normal compaction multiple times
- **Action**: Run 5 sessions that trigger compaction
- **Expected**: All succeed without errors
- **Observe**: Reliability across multiple runs

**Step 2**: Test rapid context growth
- **Action**: Send very large prompts to quickly fill context
- **Expected**: Compaction handles rapid growth
- **Observe**: Does rapid growth cause issues?

**Step 3**: Test with special content
- **Action**: Fill context with edge cases:
  - Very long code blocks (2000+ lines)
  - Unicode and special characters
  - Deeply nested JSON
  - Binary data representations
- **Expected**: Compaction handles special content
- **Observe**: Any parsing or summarization errors?

**Step 4**: Test compaction during active operations
- **Action**: Trigger compaction while Claude is generating a response
- **Expected**: Either queues compaction or handles gracefully
- **Observe**: Timing conflicts?

**Step 5**: Monitor for data loss
- **Action**: After each compaction, ask for previously discussed information
- **Expected**: Important information preserved
- **Observe**: Any critical data loss?

### Verification

**Success criteria**:
- ✅ Compaction works reliably across different scenarios
- ✅ No crashes or errors
- ✅ Minimal data loss
- ✅ Handles edge cases

**Result format**:
```markdown
**FC-005 Result**: PASS / FAIL / PARTIAL

**Reliability testing**:
| Scenario | Success Rate | Issues |
|----------|--------------|--------|
| Normal compaction | [X/5] | [issues] |
| Rapid growth | [X/5] | [issues] |
| Special content | [X/5] | [issues] |
| During operations | [X/5] | [issues] |
| Data preservation | [X/5] | [issues] |

**Failure modes observed**:
1. [Failure mode 1]
2. [Failure mode 2]

**Findings**:
- [How reliable compaction is]
- [What scenarios cause problems]
- [Data loss patterns]

**Evidence**:
- [Error messages if any]
- [Examples of failed compactions]

**Overall reliability**: EXCELLENT / GOOD / FAIR / POOR
```

---

## Aggregate Results Template

After running all FC tests:

```markdown
# Context Compaction Feature Test Results

**Date**: YYYY-MM-DD
**Tester**: [name]
**Claude Code Version**: [version]

## Summary

**Overall Status**: [X/5 tests passed]

| Test ID | Test Name | Status | Key Finding |
|---------|-----------|--------|-------------|
| FC-001 | Trigger Threshold | PASS/FAIL | [finding] |
| FC-002 | Algorithm | PASS/FAIL | [finding] |
| FC-003 | Quality Impact | PASS/FAIL | [finding] |
| FC-004 | Configuration | PASS/FAIL | [finding] |
| FC-005 | Reliability | PASS/FAIL | [finding] |

## Compaction Characteristics

**Trigger**:
- Threshold: [X] tokens or [Y]% of context window
- Consistency: [score]
- Predictability: [score]

**Algorithm**:
- Type: [deletion / summarization / semantic / hybrid]
- Sophistication: [score]
- Information preservation: [score]

**Impact**:
- Quality degradation: [none / minimal / moderate / significant]
- What's preserved: [list]
- What's lost: [list]

**Configuration**:
- Configurability: [none / minimal / extensive]
- Available options: [list]
- Recommended settings: [list]

**Reliability**:
- Success rate: [X]%
- Failure modes: [list]
- Edge case handling: [score]

## Claude Code vs OpenCode Compaction

| Feature | Claude Code | OpenCode |
|---------|-------------|----------|
| Algorithm | [type] | Reactive @ 90% |
| Trigger | [threshold] | 90% capacity |
| Preservation | [quality] | Basic summary |
| Configuration | [options] | Limited |
| Reliability | [score] | [score] |

## Best Practices

**For long sessions**:
1. [Best practice 1]
2. [Best practice 2]

**To preserve context**:
1. [Technique 1]
2. [Technique 2]

**When compaction is problematic**:
1. [Workaround 1]
2. [Workaround 2]

## Recommendations

**General usage**:
[How to work effectively with compaction]

**For specific use cases**:
- Long conversations: [recommendations]
- Project context: [recommendations]
- Code generation: [recommendations]

## Evidence

[Links to API captures, test logs, examples]
```

---

## Next Steps

1. Execute all 5 tests
2. Document compaction threshold and algorithm
3. Create recommendations for long sessions
4. Record findings in `results/feature-results-YYYY-MM-DD.md`
5. Compare with API interception findings
6. All feature tests complete - proceed to API interception tests
