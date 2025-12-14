# Claude Code Feature Testing Suite - Summary

**Created**: 2025-12-14
**Epic**: epic-0001
**Status**: ✅ Complete and ready for execution

---

## What This Is

A comprehensive testing framework to understand and validate Claude Code features through:
- **Behavioral testing**: How features actually work vs how they're documented
- **API interception**: What's really sent to/from the API
- **Reliability analysis**: How consistently features work across multiple runs

---

## Quick Stats

**Test Documents**: 9 files
**Test Scenarios**: 32+ unique tests
**Reliability Iterations**: 85+ test runs
**Estimated Time**: 6-15 hours (full suite) or 45 minutes (quick validation)

---

## What You'll Learn

After running this test suite, you'll know:

1. **Does CLAUDE.md actually work?** Yes/No + reliability score
2. **Why are skills usually empty?** Root cause and when they activate
3. **How do rules enforce constraints?** Actual enforcement vs documentation
4. **When do hooks fire?** Exact lifecycle timing and data format
5. **When does compaction trigger?** Real threshold vs advertised
6. **What's in the API request?** True system prompt structure
7. **How reliable is each feature?** ALWAYS / USUALLY / SOMETIMES / RARELY / NEVER

---

## Test Categories

### 1. Feature Behavior Tests (features/)

**25 test scenarios across 5 features:**

- **test-claude-md.md** (5 tests)
  - Initial loading
  - Updates
  - Root vs .claude/ precedence
  - Complex instructions
  - Missing file handling

- **test-skills.md** (5 tests)
  - Default skills availability
  - Custom skill creation
  - Skills vs slash commands
  - Claude Code vs OpenCode comparison
  - Why skills are usually empty

- **test-rules.md** (5 tests)
  - Basic file access rules
  - Rules vs permissions interaction
  - Dynamic rule updates
  - Complex pattern enforcement
  - Error handling

- **test-hooks.md** (5 tests)
  - SessionStart hook
  - UserPromptSubmit hook (our knowledge hook!)
  - ToolCall hooks
  - Error handling
  - Hook matchers

- **test-compaction.md** (5 tests)
  - Trigger threshold measurement
  - Compaction algorithm analysis
  - Quality impact assessment
  - Configuration options
  - Reliability testing

### 2. API Interception Tests (api-interception/)

**7 test scenarios:**

- API-001: Minimal baseline capture
- API-002: CLAUDE.md injection verification
- API-003: Hook transformation capture
- API-004: Skills section analysis
- API-005: Model selection logic
- API-006: Feature-rich request structure
- API-007: Error scenario handling

**What you'll capture:**
- System prompt length and structure
- Tool availability and descriptions
- Feature injection points
- Request/response format
- Model selection patterns

### 3. Pattern Documentation Tests (patterns/)

**5 reliability test suites (85+ total runs):**

- PR-001: CLAUDE.md loading (10 runs)
- PR-002: Hook execution (10 runs)
- PR-003: Compaction trigger (5 runs)
- PR-004: Tool reliability (40 runs)
- PR-005: Cross-session consistency (20 runs)

**What you'll discover:**
- Reliability scores for each feature
- Behavioral patterns
- Failure modes and edge cases
- Statistical confidence intervals
- Conditions affecting consistency

---

## File Structure

```
.claude/tests/
├── README.md                   # Overview and strategy
├── SUMMARY.md                  # This file
├── run-all-tests.md           # Complete execution guide
│
├── features/                   # Behavioral tests
│   ├── test-claude-md.md
│   ├── test-skills.md
│   ├── test-rules.md
│   ├── test-hooks.md
│   └── test-compaction.md
│
├── api-interception/          # API comparison tests
│   └── test-scenarios.md
│
├── patterns/                  # Reliability tests
│   └── test-reliability.md
│
└── results/                   # Test results go here
    ├── feature-results-YYYY-MM-DD.md
    ├── api-results-YYYY-MM-DD.md
    ├── reliability-results-YYYY-MM-DD.md
    └── aggregate-findings-YYYY-MM-DD.md
```

---

## How to Use This Suite

### For Quick Validation (45 minutes)

**Goal**: Understand basic Claude Code behavior

1. Run FM-001 (CLAUDE.md loading)
2. Run FH-002 (Hook transformation)
3. Run API-001 & API-002 (Baseline + CLAUDE.md)
4. Review findings

**Sufficient for**: Understanding core features, validating assumptions

### For Comprehensive Testing (6-15 hours)

**Goal**: Complete understanding and reliability analysis

1. **Day 1**: Feature tests (FM, FS, FR, FH, FC series)
2. **Day 2**: API interception tests (API series)
3. **Day 3**: Reliability tests (PR series) + aggregate analysis

**Sufficient for**: Production decisions, feature reliability, team documentation

### For Specific Feature Investigation

**Just want to test CLAUDE.md?**
- Read: features/test-claude-md.md
- Run: FM-001 through FM-005
- Cross-validate: API-002 (CLAUDE.md injection)
- Reliability: PR-001 (10 runs)

**Just want to test hooks?**
- Read: features/test-hooks.md
- Run: FH-001 through FH-005
- Cross-validate: API-003 (Hook transformation)
- Reliability: PR-002 (10 runs)

---

## Prerequisites

**Before running tests:**

✅ Claude Code CLI installed
✅ mitmproxy installed and certificate configured
✅ Node.js (for hooks)
✅ Python (for analysis scripts)
✅ 6-15 hours allocated (or 45 min for quick validation)

**Setup guide**: See `run-all-tests.md` Prerequisites section

---

## Integration with Existing Infrastructure

**Leverages existing tools:**
- `requests_tracker/` - mitmproxy setup and analysis scripts
- `.claude/knowledge/hooks/` - Hook implementations (we test these!)
- `.claude/settings.json` - Permissions and hook configuration

**Adds new testing layer:**
- Systematic feature validation
- Multi-run reliability analysis
- Behavioral pattern documentation
- Evidence-based understanding

---

## Expected Outcomes

After completing the test suite:

### Documented Findings

- ✅ Feature reliability scores (ALWAYS → NEVER)
- ✅ Behavioral patterns and edge cases
- ✅ API request structure documentation
- ✅ Failure modes and workarounds
- ✅ Cross-validated results
- ✅ Practical recommendations

### Actionable Knowledge

- Know which features to rely on
- Understand how to use features effectively
- Can debug Claude Code issues
- Can optimize prompts and configuration
- Can contribute findings to community

### Evidence Base

- API captures showing actual behavior
- Test logs proving reliability
- Screenshots of interesting findings
- Statistical analysis of patterns
- Cross-referenced validation

---

## Success Criteria

Test suite is successful when you can answer:

1. ✅ Does CLAUDE.md load reliably? (Yes/No + %)
2. ✅ When are skills activated? (Conditions)
3. ✅ How do hooks transform requests? (Data format)
4. ✅ When does compaction trigger? (Threshold)
5. ✅ What's the API request structure? (Full format)
6. ✅ Which features are production-ready? (List with scores)

---

## Next Steps

1. **Review test suite**: Read README.md and run-all-tests.md
2. **Set up environment**: Install mitmproxy, verify prerequisites
3. **Choose execution path**: Quick validation or full suite
4. **Run tests**: Follow run-all-tests.md procedures
5. **Document findings**: Record results in results/ directory
6. **Share knowledge**: Team documentation, community contribution

---

## Support

**Getting started**: Read `run-all-tests.md`
**Test procedures**: Each test document has detailed steps
**Troubleshooting**: See run-all-tests.md Troubleshooting section
**Questions**: Document unclear items and investigate

---

## Meta Notes

**This test suite itself is a test**: We're testing Claude Code's testing capabilities by creating a comprehensive test framework. Meta!

**Our knowledge hook is being tested**: The hook that transformed the prompt you're reading right now is one of the test subjects. Double meta!

**Continuous improvement**: Update test documents based on findings. Tests should improve as we learn.

---

**Ready to understand Claude Code at a deep level? Start with `run-all-tests.md`**
