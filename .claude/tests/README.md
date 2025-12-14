# Claude Code Feature Testing Suite

**Purpose**: Comprehensive testing framework to understand and validate Claude Code features, compare documented vs actual behavior, and capture behavioral patterns.

**Status**: Test procedures defined and ready for execution

**Location**: `.claude/tests/`

---

## Test Categories

### 1. Feature Behavior Tests (`features/`)

Test core Claude Code features to understand actual behavior and reliability:

- **test-claude-md.md** - CLAUDE.md instruction loading, application, and updates
- **test-skills.md** - Skills activation triggers and current behavior
- **test-rules.md** - Rules file constraint enforcement
- **test-hooks.md** - Hooks lifecycle events (SessionStart, UserPromptSubmit, ToolCall, etc.)
- **test-compaction.md** - Context compaction triggers, summary generation, consistency

**What you'll learn**:
- Does CLAUDE.md actually get loaded and applied?
- When are skills activated (and why they're usually empty)?
- How are rules enforced for file access?
- What lifecycle events fire and when?
- When does compaction trigger and how reliable is it?

### 2. API Interception Tests (`api-interception/`)

Compare what we write vs what's sent to the API using mitmproxy:

- **test-scenarios.md** - Test cases for minimal, feature-rich, and error scenarios

**What you'll learn**:
- How long is the system prompt actually sent?
- Does CLAUDE.md appear in the system prompt?
- What tools are available in each request?
- How do hooks affect the API request?
- What's different between Claude Code and OpenCode at the API level?

### 3. Pattern Documentation Tests (`patterns/`)

Document reliability and consistency patterns across multiple test runs:

- **test-reliability.md** - Consistency and pattern documentation procedures

**What you'll learn**:
- How reliably do features work across multiple runs?
- What patterns emerge in feature behavior?
- Are there edge cases or failure modes?
- How consistent is the feature activation?

---

## Quick Start

### For Executing All Tests

See: `run-all-tests.md` for complete execution guide

**Quick summary**:
1. Verify prerequisites (mitmproxy, certificates, environment)
2. Run feature tests (1-2 hours)
3. Run API interception tests (30 minutes per scenario)
4. Run pattern tests (2-3 hours for reliability)
5. Aggregate and document findings

### For Running Individual Test Categories

**Feature tests**:
```bash
# Read test-claude-md.md for CLAUDE.md tests
cat features/test-claude-md.md

# Execute each test scenario described in the document
# Record results in results/feature-results-YYYY-MM-DD.md
```

**API interception**:
```bash
# Prerequisites: mitmproxy setup
# See: requests_tracker/QUICK-START.md

# Read test scenarios
cat api-interception/test-scenarios.md

# Run capture script
cd requests_tracker/scripts
./capture-with-node-cert.ps1  # or manual capture with quick-start.ps1
```

**Pattern tests**:
```bash
# Run same test 5+ times and document patterns
# See: patterns/test-reliability.md for procedures
```

---

## Test Results

Test results are stored in `results/` directory by date:

- `feature-results-YYYY-MM-DD.md` - Feature test results
- `api-results-YYYY-MM-DD.md` - API interception findings
- `reliability-results-YYYY-MM-DD.md` - Pattern findings
- `aggregate-findings-YYYY-MM-DD.md` - Combined analysis

---

## Test Procedures Format

Each test document follows this format:

### Test Scenario Header
**Test ID**: Unique identifier (e.g., FM-001 for Feature/Markdown)
**Purpose**: What we're testing and why
**Setup**: Prerequisites and configuration

### Test Steps
Numbered steps with:
1. **Action**: What to do
2. **Expected**: What should happen
3. **Observe**: What to look for
4. **Record**: Where to note results

### Verification
- How to verify the test passed/failed
- What success looks like
- Common failure modes

### Result Format
Standard format for recording findings:
- **Status**: PASS / FAIL / PARTIAL
- **Findings**: What we discovered
- **Evidence**: Data supporting the finding
- **Notes**: Edge cases or context

---

## Key Concepts

### Feature Reliability Scoring

How reliably does a feature work?

- **ALWAYS** (100%): Works in all test runs
- **USUALLY** (75-99%): Works most of the time
- **SOMETIMES** (25-74%): Works inconsistently
- **RARELY** (1-24%): Almost never works
- **NEVER** (0%): Doesn't work

### Hook Lifecycle Events

Claude Code supports lifecycle hooks that fire at specific points:

1. **SessionStart**: When session begins (cleanup, initialization)
2. **UserPromptSubmit**: Before prompt reaches Claude (transformation, validation)
3. **ToolCall**: Before/after tool execution
4. **ToolResult**: After tool returns result
5. **ResponseGeneration**: Before/after response generation
6. **SessionEnd**: When session ends (logging, cleanup)

Tests verify: Does each hook fire? When exactly? What data is available?

### Context Compaction

When context window fills, Claude Code compacts it. Tests verify:

- What triggers compaction? (Context size? Token count? Specific threshold?)
- How is compaction performed? (Summarization? Deletion? Compression?)
- Is compaction reliable? (Does it work consistently?)
- What's preserved? (Which messages? Which context?)

---

## Integration with Our Knowledge Hook

Our custom `knowledge-prompt.mjs` hook is part of what we're testing:

- **knowledge-prompt.mjs** (UserPromptSubmit) - Shows knowledge system info, initiates loading
- **session-start-cleanup.mjs** (SessionStart) - Clears tracking files

**Meta-testing**: These hooks affect our test execution itself. Tests should account for:
- How hooks transform prompts we send
- Whether hooks affect API requests we capture
- Whether tracking hooks interfere with results

---

## Dependencies

### Prerequisites
- **mitmproxy**: For API interception (see `requests_tracker/INSTALL.md`)
- **Node.js**: For running hooks and analysis scripts
- **Claude Code CLI**: Latest version
- **Certificates**: mitmproxy root certificate installed (see `requests_tracker/QUICK-START.md`)

### Related Infrastructure
- `.claude/knowledge/hooks/` - Hook implementations
- `requests_tracker/` - API interception scripts and analysis tools
- `.claude/knowledge/tracker/` - Tracking output files (tracker.jsonl, metrics.jsonl)

---

## Test Execution Workflow

1. **Plan tests** - Read what to test (this document + individual test docs)
2. **Setup environment** - Verify prerequisites met
3. **Execute tests** - Run scenarios described in test documents
4. **Record results** - Document what you found in results/ directory
5. **Analyze patterns** - Extract patterns and reliability scores
6. **Aggregate findings** - Combine results into comprehensive report

See `run-all-tests.md` for detailed execution guide.

---

## What You'll Discover

By completing this test suite, you'll understand:

1. **How CLAUDE.md actually works** - When it loads, how it's applied, what happens when it updates
2. **Why skills are usually empty** - Activation logic, typical behavior
3. **How rules are enforced** - File access constraints, error handling
4. **What hooks do** - Lifecycle events, data available, timing
5. **When compaction happens** - Trigger conditions, reliability
6. **What makes Claude Code different** - System prompt details, tool differences, model behavior
7. **Feature reliability patterns** - Which features are rock-solid vs flaky
8. **Behavioral patterns** - How features interact, edge cases discovered

This knowledge becomes team documentation for understanding Claude Code's real behavior.

---

## Contributing to Tests

To add new test scenarios:

1. Determine which category (features/, api-interception/, patterns/)
2. Add test section to relevant document
3. Follow test format: ID, purpose, setup, steps, verification, results
4. Execute test and record results
5. Update aggregate findings document

---

## Files Reference

```
.claude/tests/
├── README.md (this file)
├── run-all-tests.md (execution guide)
├── features/
│   ├── test-claude-md.md
│   ├── test-skills.md
│   ├── test-rules.md
│   ├── test-hooks.md
│   └── test-compaction.md
├── api-interception/
│   └── test-scenarios.md
├── patterns/
│   └── test-reliability.md
└── results/
    ├── feature-results-YYYY-MM-DD.md
    ├── api-results-YYYY-MM-DD.md
    ├── reliability-results-YYYY-MM-DD.md
    └── aggregate-findings-YYYY-MM-DD.md
```

---

## Next Steps

1. Read `run-all-tests.md` for complete execution guide
2. Review individual test documents in `features/`, `api-interception/`, `patterns/`
3. Follow prerequisites section to set up environment
4. Execute tests and record findings
5. Aggregate results for team documentation
