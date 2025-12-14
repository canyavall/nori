# How to Run Knowledge Loading Tests

**Quick Start Guide for Manual Testing**

---

## Prerequisites

1. Knowledge loading protocol implemented (`.ai/knowledge/instructions/knowledge-loading-guide.md`)
2. All agents updated to reference protocol
3. Tracker system operational (tracker.jsonl and metrics.jsonl being written)

---

## Running Tests Manually

### Test 1: Routing Implementation (KL-001)

**What**: Test planning-agent loads routing knowledge with `--with-deps`

**Steps**:
1. Note current time or check last tracker entry
2. Run: `/task feco-0000`
3. Wait for planning-agent to complete
4. Check tracking files:
   ```bash
   # View last 5 tracker entries
   tail -5 .ai/knowledge/tracker/tracker.jsonl

   # View last 2 metrics entries
   tail -2 .ai/knowledge/tracker/metrics.jsonl

   # Pretty print metrics with jq
   tail -2 .ai/knowledge/tracker/metrics.jsonl | jq '.'
   ```
5. Check `.ai/specs/feco-0000/plan.md` "Required Knowledge" section
6. Verify:
   - ✅ tracker.jsonl has 2 entries (one for step 2, one for step 6)
   - ✅ metrics.jsonl shows "packages_returned": ≥9
   - ✅ plan.md lists ≥9 packages
   - ✅ All packages have real paths (not placeholders)

**Expected Packages** (plan.md should list these):
- nx-commands.md
- react-router-v7-basics.md
- react-router-navigation.md
- react-router-loaders.md
- react-router-forms-actions.md
- react-router-error-handling.md
- react-router-permissions.md
- react-router-monorepo-patterns.md
- nx-architecture.md
- Plus standards packages via --with-deps

**Pass/Fail**:
- ✅ PASS if all verification steps succeed
- ❌ FAIL if missing packages or missing `--with-deps`

---

### Test 2: Component Implementation (KL-002)

**What**: Test user prompt loads component knowledge

**Steps**:
1. Send prompt: `"Create a UserProfile component with name, email fields and a save button"`
2. Check response starts with knowledge loading proof
3. Check tracking:
   ```bash
   # Find recent user prompts
   grep "agent_name\":\"user" .ai/knowledge/tracker/tracker.jsonl | tail -3

   # Check metrics for user
   grep "agent_name\":\"user" .ai/knowledge/tracker/metrics.jsonl | tail -1 | jq '.'
   ```
4. Verify agent loaded component-related knowledge

**Pass/Fail**:
- ✅ PASS if loaded ≥3 packages including component patterns
- ❌ FAIL if no knowledge loaded or wrong knowledge type

---

### Test 3: Test Fixing (KL-003)

**What**: Test fixing flaky tests loads testing knowledge

**Steps**:
1. Send prompt: `"Fix the flaky tests in OrderDrawer.spec.tsx - tests are failing randomly"`
2. Check response mentions testing knowledge
3. Verify tracker shows test_fixing task-type
4. Check loaded packages include testing patterns

**Pass/Fail**:
- ✅ PASS if loaded testing-related knowledge (isolation, async, msw)
- ❌ FAIL if wrong knowledge or no testing patterns

---

### Test 6: No Knowledge Needed (KL-006)

**What**: Test pure file discovery skips knowledge loading

**Steps**:
1. Send prompt: `"List all .tsx files in apps/synergy-client/src/routes"`
2. Check response starts with: `"No knowledge needed: Pure file discovery operation"`
3. Verify NO new tracker entry for this timestamp
4. Response should directly provide file list

**Pass/Fail**:
- ✅ PASS if no knowledge loaded AND reason is specific
- ❌ FAIL if knowledge loaded for pure discovery task

---

## Quick Validation Commands

### Check if `--with-deps` was used

```bash
# View metrics for specific agent
grep "planning-agent-feco-0000" .ai/knowledge/tracker/metrics.jsonl | jq '.'

# Check with_deps field (should be true or not present means default true)
# Note: Current mjs doesn't track this in metrics, but package count indicates it
```

### Count packages loaded

```bash
# Count tracker entries for specific task
grep "feco-0000" .ai/knowledge/tracker/tracker.jsonl | wc -l

# Should be ≥9 for routing task if --with-deps worked
```

### View loaded packages

```bash
# List all packages loaded for specific task
grep "feco-0000" .ai/knowledge/tracker/tracker.jsonl | jq -r '.file'
```

### Check compliance rate

```bash
# Count total searches
wc -l .ai/knowledge/tracker/metrics.jsonl

# Count with reasonable package counts (≥5 suggests --with-deps)
jq 'select(.packages_returned >= 5)' .ai/knowledge/tracker/metrics.jsonl | wc -l
```

---

## Recording Test Results

Create a test log file: `.ai/knowledge/tests/test-results-YYYY-MM-DD.md`

**Template**:
```markdown
# Test Results - 2025-12-03

## Test Run Details
- **Date**: 2025-12-03 15:30:00
- **Tester**: [Your name]
- **Protocol Version**: 2.0

## Results

### KL-001: Routing Implementation
- **Status**: ❌ FAIL
- **Details**:
  - tracker.jsonl: ✅ 2 entries found
  - metrics.jsonl: ❌ Only 9 packages (expected standards packages missing)
  - plan.md: ❌ Missing standards-code-conventions
- **Action**: Update planning-agent to document implementation-agent's always_load packages

### KL-002: Component Implementation
- **Status**: ✅ PASS
- **Details**:
  - Loaded 5 packages including react-component-patterns
  - tracker.jsonl has correct entry
  - Response acknowledged knowledge loading

[Continue for all tests...]

## Summary
- **Total Tests**: 7
- **Passed**: 5
- **Failed**: 2
- **Compliance Rate**: 71%

## Action Items
1. Fix planning-agent knowledge documentation
2. Re-test KL-001 after fix
3. Investigate KL-004 failure
```

---

## Common Issues

### Issue: No tracker entries appearing

**Symptoms**: Running tests but tracker.jsonl not updating

**Fix**:
1. Check knowledge-search.mjs is being called with `--agent-name` and `--agent-id`
2. Verify file permissions on tracker.jsonl
3. Check if tracker directory exists: `.ai/knowledge/tracker/`

### Issue: Package count too low

**Symptoms**: Only 2-3 packages loaded when expecting 9+

**Causes**:
- Missing `--with-deps` flag
- Agent skipped step 6 (task-type detection)
- Wrong task-type detected

**Fix**:
1. Check agent instructions include `--with-deps`
2. Verify step 6 is being executed
3. Check task-type detection logic

### Issue: Wrong knowledge loaded

**Symptoms**: Loaded business knowledge for technical task

**Causes**:
- Wrong mode selected (Mode 1 vs 2 vs 3)
- Incorrect task-type detection
- Wrong tags or category

**Fix**:
1. Review task prompt and requirements
2. Check agent logic for mode selection
3. Verify task-type mapping

---

## Next Steps After Testing

1. **Document Results**: Record all test results in test log
2. **Fix Failures**: Address each failing test
3. **Re-test**: Run failed tests again after fixes
4. **Monitor**: Set up continuous monitoring
5. **Automate**: Build automated test runner (future)

---

## Getting Help

If tests are failing and you can't determine why:

1. Check `.ai/temp/knowledge-loading-analysis.md` for system overview
2. Review protocol: `.ai/knowledge/instructions/knowledge-loading-guide.md`
3. Check agent instructions: `.claude/agents/[agent-name].md`
4. Examine tracker files manually: `tail -20 .ai/knowledge/tracker/*.jsonl`
5. Ask for help with specific error details
