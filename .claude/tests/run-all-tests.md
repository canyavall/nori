# Test Execution Guide

**Purpose**: Complete guide for running the Claude Code feature testing suite

**Status**: Ready to execute

**Estimated time**: 6-8 hours for full suite (can be split across multiple sessions)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Full Test Suite Execution](#full-test-suite-execution)
4. [Individual Test Execution](#individual-test-execution)
5. [Result Recording](#result-recording)
6. [Troubleshooting](#troubleshooting)
7. [Interpreting Results](#interpreting-results)
8. [Updating Documentation](#updating-documentation)

---

## Prerequisites

### Environment Requirements

**Required software**:
- ✅ Claude Code CLI (latest version)
- ✅ Node.js (for hooks and scripts)
- ✅ Python 3.x (for mitmproxy analysis)
- ✅ mitmproxy (for API interception)
- ✅ PowerShell or Bash (for running scripts)

**Check versions**:
```bash
claude --version
node --version
python --version
mitmweb --version  # or mitmproxy --version
```

### One-Time Setup

#### Step 1: Install mitmproxy Certificate

**Critical for API interception tests**:

```powershell
cd requests_tracker/scripts
.\install-certificate.ps1
```

**Verify**:
- Certificate in "Trusted Root Certification Authorities" (NOT "Personal")
- Test: `.\test-capture.ps1` should show ✅ ~7.6KB captured

**If installation fails**, see `requests_tracker/INSTALL.md`

#### Step 2: Create Results Directory

```bash
mkdir -p .claude/tests/results
```

#### Step 3: Verify Hook System

```bash
# Check settings
cat .claude/settings.json | grep -A 20 "hooks"

# Verify hooks exist
ls .claude/knowledge/hooks/
```

**Expected hooks**:
- knowledge-prompt.mjs
- session-start-cleanup.mjs

### Environment Verification Checklist

Before running tests, verify:

```bash
# Claude Code works
claude -p "hello"  # Should respond

# Hooks work
# (You should see "Preparing knowledge context..." status message)

# mitmproxy captures work
cd requests_tracker/scripts
.\test-capture.ps1  # Should succeed

# Python analysis works
cd ..
python scripts/analyze-capture.py captures/test_*.mitm  # Should create analysis/
```

If all checks pass: ✅ **Ready to run tests**

---

## Quick Start

### Fastest Path to Results

If you want to run a minimal test suite to understand the system:

**1. Feature Smoke Test** (30 minutes):
- Run FM-001 (CLAUDE.md loading)
- Run FH-002 (Hook transformation)
- Run FC-001 (Compaction trigger)

**2. API Baseline** (15 minutes):
- Run API-001 (Minimal baseline)
- Run API-002 (CLAUDE.md injection)

**3. Review Results**:
- Document findings
- Decide if full suite needed

**Total time**: ~45 minutes

**Sufficient for**: Understanding basic behavior, validating core features

---

## Full Test Suite Execution

### Recommended Execution Order

**Day 1: Setup and Feature Tests** (3-4 hours)

1. **Morning: Setup and Feature Tests Part 1**
   - Prerequisites verification (30 min)
   - CLAUDE.md tests: FM-001 through FM-005 (1 hour)
   - Skills tests: FS-001 through FS-005 (1 hour)
   - **Break**

2. **Afternoon: Feature Tests Part 2**
   - Rules tests: FR-001 through FR-005 (1 hour)
   - Hooks tests: FH-001 through FH-005 (1 hour)
   - **Break**

3. **Evening: Compaction Tests**
   - Compaction tests: FC-001 through FC-005 (1-2 hours)

**Day 2: API and Pattern Tests** (3-4 hours)

4. **Morning: API Interception**
   - API tests: API-001 through API-007 (2-3 hours)
   - **Break**

5. **Afternoon: Pattern Tests**
   - Reliability tests: PR-001 through PR-005 (2-3 hours)

**Day 3: Analysis and Documentation** (2 hours)

6. **Aggregate Results**
   - Combine all findings
   - Cross-validate
   - Create final report

### Detailed Execution Steps

#### Phase 1: Feature Behavior Tests

**Location**: `.claude/tests/features/`

**Execution**:

```bash
# Read test document
cat features/test-claude-md.md

# For each test (FM-001 through FM-005):
# 1. Read test procedure
# 2. Follow setup steps
# 3. Execute test steps
# 4. Record results in results/feature-results-YYYY-MM-DD.md
```

**Time estimates**:
- CLAUDE.md tests (FM-001 to FM-005): ~1 hour
- Skills tests (FS-001 to FS-005): ~1 hour
- Rules tests (FR-001 to FR-005): ~1 hour
- Hooks tests (FH-001 to FH-005): ~1 hour
- Compaction tests (FC-001 to FC-005): ~1-2 hours

**Tips**:
- Start fresh sessions for each test
- Document unexpected behavior immediately
- Take screenshots of interesting findings
- Save API captures if interception is running

#### Phase 2: API Interception Tests

**Location**: `.claude/tests/api-interception/`

**Prerequisites**:
- mitmproxy certificate installed and verified
- Capture scripts tested and working

**Execution**:

```bash
# Read test scenarios
cat api-interception/test-scenarios.md

# For each test (API-001 through API-007):
# 1. Start capture (automated or manual)
# 2. Execute test prompt
# 3. Save capture
# 4. Analyze capture
# 5. Record findings
```

**Capture workflow (automated)**:
```powershell
cd requests_tracker/scripts
.\capture-with-node-cert.ps1
# Enter test prompt when asked
```

**Capture workflow (manual)**:
```powershell
# Terminal 1
cd requests_tracker/scripts
.\quick-start.ps1

# Terminal 2
$env:HTTPS_PROXY='http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
claude -p "your test prompt"

# Terminal 1: Press 'q' to save
```

**Analysis**:
```powershell
cd requests_tracker
python scripts\analyze-capture.py captures\[filename].mitm
```

**Time estimates**:
- Setup and first capture: ~30 minutes
- Each subsequent test: ~15-20 minutes
- Total for API-001 to API-007: ~2-3 hours

**Tips**:
- Name captures descriptively: `claude_API-001_baseline.mitm`
- Keep analysis folders organized
- Cross-reference with feature tests
- Document all API structure discoveries

#### Phase 3: Pattern and Reliability Tests

**Location**: `.claude/tests/patterns/`

**Prerequisites**:
- Feature tests completed (to know what patterns to look for)
- Time allocated (these require multiple runs)

**Execution**:

```bash
# Read reliability test procedures
cat patterns/test-reliability.md

# For each test (PR-001 through PR-005):
# 1. Read test procedure
# 2. Note iteration count (5-10 runs per test)
# 3. Execute all iterations
# 4. Aggregate results
# 5. Calculate reliability scores
```

**Sample sizes**:
- PR-001 (CLAUDE.md): 10 runs
- PR-002 (Hooks): 10 runs
- PR-003 (Compaction): 5 runs
- PR-004 (Tools): 40 runs (10 per tool)
- PR-005 (Cross-session): 20 runs (5 per context)

**Time estimates**:
- PR-001: ~30 minutes (10 quick tests)
- PR-002: ~30 minutes (10 quick tests)
- PR-003: ~1-2 hours (5 slow compaction tests)
- PR-004: ~1 hour (40 quick tool tests)
- PR-005: ~1 hour (20 context tests)
- Total: ~4-5 hours

**Tips**:
- Use spreadsheet or CSV to track iterations
- Automate if possible (shell script loop)
- Take breaks between long test runs
- Document patterns as you notice them

---

## Individual Test Execution

### Running a Single Test

**To run just one test (e.g., FM-001)**:

1. **Read the test document**:
   ```bash
   cat .claude/tests/features/test-claude-md.md
   ```

2. **Find the specific test**: Search for "Test FM-001"

3. **Follow the procedure**:
   - Setup: Create required files/configuration
   - Steps: Execute each step in order
   - Verification: Check success criteria
   - Results: Record using provided format

4. **Save results**:
   ```bash
   # Create result file if not exists
   echo "# FM-001 Results - $(date)" >> .claude/tests/results/feature-results-YYYY-MM-DD.md

   # Add your findings
   cat >> .claude/tests/results/feature-results-YYYY-MM-DD.md
   [Paste your results]
   Ctrl+D
   ```

### Running a Test Category

**To run all CLAUDE.md tests (FM-001 through FM-005)**:

1. Read entire `test-claude-md.md` document
2. Execute tests in order: FM-001, FM-002, FM-003, FM-004, FM-005
3. Fill out aggregate results template at end of document
4. Save to results file

**To run all API tests**:

1. Verify mitmproxy setup
2. Read `test-scenarios.md`
3. Execute API-001 through API-007 in order
4. Fill out aggregate analysis template
5. Save to results file

---

## Result Recording

### File Structure

**Result files location**: `.claude/tests/results/`

**File naming**:
- `feature-results-YYYY-MM-DD.md` - Feature test results
- `api-results-YYYY-MM-DD.md` - API interception results
- `reliability-results-YYYY-MM-DD.md` - Pattern/reliability results
- `aggregate-findings-YYYY-MM-DD.md` - Combined analysis
- `hook-logs.txt` - Hook execution logs
- `full-api-request-example.txt` - Sample API request

### Result Format

Each result file should include:

```markdown
# [Test Category] Results

**Date**: YYYY-MM-DD
**Tester**: [your name]
**Claude Code Version**: [version]
**Session Duration**: [time]

## Individual Test Results

### Test [ID]: [Name]

**Result**: PASS / FAIL / PARTIAL

**Findings**:
- [Finding 1]
- [Finding 2]

**Evidence**:
- [Link to capture, screenshot, log]

**Reliability**: ALWAYS / USUALLY / SOMETIMES / RARELY / NEVER

---

[Repeat for each test]

## Aggregate Findings

[Use template from test document]

## Recommendations

[Based on findings]
```

### Recording Best Practices

1. **Record immediately**: Don't wait until end of session
2. **Be specific**: Include exact error messages, values, timings
3. **Include evidence**: Screenshots, captures, logs
4. **Note context**: Environment, time of day, session state
5. **Document surprises**: Unexpected behavior is often most interesting
6. **Cross-reference**: Link related findings across tests

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: mitmproxy Capture Empty

**Symptoms**: Capture file is 0KB or contains no data

**Solutions**:

1. **Check certificate installation**:
   ```powershell
   # Reinstall certificate
   cd requests_tracker/scripts
   .\install-certificate.ps1

   # Verify in "Trusted Root Certification Authorities" NOT "Personal"
   certmgr.msc  # Check manually
   ```

2. **Restart terminal**: After certificate install, close and reopen terminal

3. **Check environment variables**:
   ```powershell
   $env:HTTPS_PROXY='http://localhost:8080'
   $env:NODE_TLS_REJECT_UNAUTHORIZED='0'
   ```

4. **Test with curl**:
   ```powershell
   curl -x http://localhost:8080 https://api.anthropic.com
   # Should work if proxy is running
   ```

#### Issue: Hook Not Firing

**Symptoms**: Expected hook behavior doesn't occur

**Solutions**:

1. **Check settings.json**:
   ```bash
   cat .claude/settings.json | grep -A 20 "hooks"
   ```

2. **Verify hook file exists**:
   ```bash
   ls -la .claude/knowledge/hooks/knowledge-prompt.mjs
   ```

3. **Check hook syntax**:
   ```bash
   node .claude/knowledge/hooks/knowledge-prompt.mjs
   # Should not error
   ```

4. **Check permissions**:
   ```bash
   # Make executable (on Unix)
   chmod +x .claude/knowledge/hooks/*.mjs
   ```

5. **View hook output**:
   - Hooks write to stdout/stderr
   - Check terminal for hook error messages

#### Issue: CLAUDE.md Not Loading

**Symptoms**: Claude doesn't follow CLAUDE.md instructions

**Solutions**:

1. **Verify file location**:
   ```bash
   ls -la .claude/CLAUDE.md
   ls -la CLAUDE.md
   ```

2. **Check file content**:
   ```bash
   cat .claude/CLAUDE.md
   # Ensure it's valid markdown
   ```

3. **Use API capture to verify**:
   ```bash
   grep -i "your-marker-text" requests_tracker/analysis/*/request_001.txt
   # Should find CLAUDE.md content
   ```

4. **Try root vs .claude/ location**: Test both

#### Issue: Compaction Test Takes Too Long

**Symptoms**: Waiting hours for compaction to trigger

**Solutions**:

1. **Use larger prompts**: Request 500-word explanations instead of short answers

2. **Batch prompts**: Send multiple prompts in succession

3. **Check token estimate**: Use API captures to monitor progress

4. **Consider skipping**: If time-constrained, document "unable to trigger in reasonable time"

#### Issue: Test Results Inconsistent

**Symptoms**: Same test gives different results

**Solutions**:

1. **This is expected**: Pattern tests specifically measure inconsistency

2. **Document variance**: Record all variations observed

3. **Increase sample size**: Run more iterations to find pattern

4. **Check for external factors**:
   - Time of day
   - Network conditions
   - API rate limiting
   - System resources

---

## Interpreting Results

### Understanding Test Outcomes

#### PASS
- Feature works as documented
- Behavior is reliable and consistent
- Can be used in production with confidence

#### FAIL
- Feature doesn't work as documented
- Behavior is unreliable
- Should not be used until issues resolved

#### PARTIAL
- Feature works but with caveats
- Behavior is inconsistent or conditional
- Use with caution, understanding limitations

### Reliability Scores

**ALWAYS (100%)**:
- ✅ Production-ready
- ✅ Can depend on this
- ✅ Build critical features on this

**USUALLY (75-99%)**:
- ✅ Generally safe to use
- ⚠️ Have fallback plan
- ✅ Good enough for most use cases

**SOMETIMES (25-74%)**:
- ⚠️ Use with caution
- ⚠️ Always have fallback
- ⚠️ Not for critical paths

**RARELY (1-24%)**:
- ❌ Don't rely on this
- ❌ Consider alternatives
- ✅ Ok for non-critical nice-to-haves

**NEVER (0%)**:
- ❌ Doesn't work
- ❌ Don't use
- ❌ Feature may be documented but not implemented

### Cross-Validation

**Compare findings across test types**:

| Finding | Feature Test | API Test | Pattern Test | Validated? |
|---------|-------------|----------|--------------|------------|
| CLAUDE.md loads | YES | YES | 100% | ✅ |
| Skills empty | N/A | YES | 100% | ✅ |
| Hook transforms | YES | YES | 95% | ✅ |
| Compaction at 90% | YES | YES | 80% | ⚠️ |

**If tests disagree**:
- Re-run both tests
- Check for environmental differences
- Document discrepancy
- Investigate root cause

### Identifying Patterns

**Look for**:
1. **Timing patterns**: Does feature work better/worse at certain times?
2. **Context patterns**: Does session length affect behavior?
3. **Trigger patterns**: What conditions cause feature to activate?
4. **Failure patterns**: When does feature fail?
5. **Degradation patterns**: Does quality decrease over time?

**Document patterns**:
```markdown
## Pattern: [Name]

**Observed in**: [tests]
**Frequency**: [X]%
**Conditions**: [when it occurs]
**Impact**: [what it affects]
**Mitigation**: [how to handle]
```

---

## Updating Documentation

### When to Update Test Docs

**After running tests, update if**:
- Found new test scenarios
- Discovered edge cases
- Identified better verification methods
- Found clearer ways to describe procedures

### How to Update

1. **Identify improvement**:
   - "This test would be better if..."
   - "We should also test..."
   - "This verification step is unclear..."

2. **Edit test document**:
   ```bash
   # Edit the relevant test file
   nano .claude/tests/features/test-claude-md.md
   ```

3. **Add new test or improve existing**:
   - Follow existing format
   - Include all sections (ID, purpose, setup, steps, verification)
   - Update aggregate templates if needed

4. **Document the change**:
   ```bash
   git commit -m "test: improve FM-003 verification steps based on findings"
   ```

### Updating Based on Findings

**If you discover**:
- "CLAUDE.md only works from .claude/ location" → Update FM-003 with finding
- "Compaction triggers at 85%, not 90%" → Update FC-001 threshold
- "Hook data includes extra fields" → Update FH-002 data format

**Process**:
1. Document finding in results file
2. Update test document with correct information
3. Note in findings: "Test doc updated based on this result"
4. Re-run test to verify update is accurate

---

## Time Management

### Full Suite Timeline

**Minimum time**: ~6 hours (rushing)
**Recommended time**: ~8-10 hours (thorough)
**Comfortable time**: ~12-15 hours (detailed analysis)

**Can split across**:
- 3 days × 3-4 hours
- 5 days × 2 hours
- 2 weeks × 1 hour per day

### Priority Execution (Time-Limited)

**If you have 2 hours total**:
1. FM-001 (CLAUDE.md loading)
2. API-001, API-002 (Baseline and CLAUDE.md)
3. PR-001 (CLAUDE.md reliability, 10 runs)

**If you have 4 hours total**:
- Add: FH-002 (Hooks), FC-001 (Compaction), API-003 (Hook transform)
- Add: PR-002 (Hook reliability)

**If you have full 8+ hours**:
- Run complete suite as described

---

## Success Criteria

### Test Suite is Successful When

- ✅ All test categories executed (or documented reason for skip)
- ✅ Results recorded in standardized format
- ✅ Reliability scores assigned
- ✅ Patterns identified and documented
- ✅ Cross-validation completed
- ✅ Aggregate findings report created
- ✅ Practical recommendations documented
- ✅ Evidence preserved (captures, logs, screenshots)

### Knowledge Gained

**After completing test suite, you should know**:

1. **Which features work reliably**: Can use in production
2. **Which features are flaky**: Use with caution
3. **How CLAUDE.md actually works**: Not just documentation
4. **When skills are activated**: If ever
5. **How hooks transform requests**: Actual behavior
6. **When compaction triggers**: Practical threshold
7. **What API requests look like**: True structure
8. **How to debug Claude Code**: Using captures and tests

**This knowledge enables**:
- Better Claude Code usage
- Informed decisions about features
- Effective debugging
- Realistic expectations
- Contribution to Claude Code community (share findings)

---

## Next Steps After Testing

1. **Create aggregate report**: Combine all findings
2. **Share results**: With team, community, Anthropic (feedback)
3. **Update project practices**: Based on what works
4. **Contribute improvements**: To test suite, Claude Code docs
5. **Repeat periodically**: As Claude Code updates

---

## Getting Help

**If stuck**:
1. Re-read test procedure carefully
2. Check troubleshooting section
3. Review prerequisite setup
4. Examine similar test for comparison
5. Document issue and continue (come back later)

**For reporting issues**:
- Test ID and name
- What you expected
- What actually happened
- Environment details
- Steps to reproduce

---

**You're ready to run tests! Start with prerequisites verification, then choose your execution path.**
