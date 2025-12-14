# Rules Feature Tests

**Purpose**: Test how Claude Code enforces rules for file access and constraints

**Status**: Ready for execution

**Background Context**: Rules in `.claude/rules.md` define file access patterns and constraints

---

## Background

Rules provide file-level constraints in Claude Code. From settings.json:
- Rules can restrict file access patterns
- Rules can enforce naming conventions
- Rules integrate with permission system

**Questions to answer**:
1. How are rules defined and applied?
2. Are rules enforced automatically or require configuration?
3. What happens when rules are violated?
4. How do rules interact with permissions system?
5. Can rules prevent Claude from reading/writing files?

---

## Test FR-001: Create Basic Rules

**Test ID**: FR-001
**Purpose**: Test if basic file access rules are enforced

### Setup
Create `.claude/rules.md`:

```markdown
# File Access Rules

## Restricted Files

NEVER read or write to the following:
- `secrets.txt`
- `*.env` files
- Files in `/private/` directory

## Required Patterns

All new test files MUST:
- End with `.spec.ts` or `.test.ts`
- Be located in `__tests__/` directory

## Warnings

Files larger than 1000 lines should trigger a warning before modification.
```

### Test Steps

**Step 1**: Test restricted file read
- **Action**: `claude -p "read the file secrets.txt"`
- **Expected**: Claude refuses or warns before reading
- **Observe**: Is the rule enforced? What's the error message?

**Step 2**: Test restricted file write
- **Action**: `claude -p "create a file called test.env with DB_PASSWORD=test"`
- **Expected**: Claude refuses or warns
- **Observe**: How is the violation handled?

**Step 3**: Test directory restriction
- **Action**: `claude -p "create private/data.txt with content 'test'"`
- **Expected**: Claude refuses or warns about `/private/` directory
- **Observe**: Does directory-level restriction work?

**Step 4**: Test required pattern
- **Action**: `claude -p "create a test file for UserService"`
- **Expected**: Claude creates `UserService.spec.ts` or `.test.ts` in `__tests__/`
- **Observe**: Does Claude follow the pattern requirement?

**Step 5**: Test warning trigger
- **Action**: Create a 1500-line file, then ask Claude to modify it
- **Expected**: Warning before modification
- **Observe**: Is the warning shown? Can user override?

### Verification

**Success criteria**:
- ✅ Rules prevent access to restricted files
- ✅ Rules enforce required patterns
- ✅ Warnings work for large files
- ✅ Clear error/warning messages

**Result format**:
```markdown
**FR-001 Result**: PASS / FAIL / PARTIAL

**Rule enforcement**:
| Rule Type | Enforced | Details |
|-----------|----------|---------|
| File restrictions | YES/NO | [behavior] |
| Pattern requirements | YES/NO | [behavior] |
| Warnings | YES/NO | [behavior] |

**Findings**:
- [How rules are enforced]
- [Error message examples]
- [Can rules be overridden?]

**Evidence**:
- [Claude's responses when rules violated]
- [Successfully enforced patterns]

**Reliability**: ALWAYS / USUALLY / SOMETIMES / RARELY / NEVER
```

---

## Test FR-002: Rules vs Permissions Interaction

**Test ID**: FR-002
**Purpose**: Test how rules interact with the permissions system in settings.json

### Setup

**Step A**: Configure permissions in `.claude/settings.json`:
```json
{
  "permissions": {
    "allow": ["Read(///**)", "Write(///**)" ],
    "deny": ["Write(//secrets.txt)"],
    "ask": ["Bash(rm:*)"]
  }
}
```

**Step B**: Configure rules in `.claude/rules.md`:
```markdown
# Rules

Never read `config.txt`
Never write to `data.txt`
```

### Test Steps

**Step 1**: Test permission deny + rule deny (same file)
- **Action**: `claude -p "write to secrets.txt"`
- **Expected**: Denied by permissions system
- **Observe**: Which system blocks it? Both? One?

**Step 2**: Test permission allow + rule deny (different files)
- **Action**: `claude -p "read config.txt"` (rule says no, permission says yes)
- **Expected**: Either rules override permissions, or permissions override rules
- **Observe**: Which takes precedence?

**Step 3**: Test permission ask + rule allow
- **Action**: `claude -p "remove file test.txt using bash"`
- **Expected**: Permission system asks user
- **Observe**: Do rules affect the "ask" behavior?

**Step 4**: Test no rule + permission allow
- **Action**: `claude -p "write to unrestricted.txt"`
- **Expected**: Allowed (no restriction)
- **Observe**: Baseline behavior

### Verification

**Success criteria**:
- ✅ Understand rules vs permissions precedence
- ✅ Know which system checks first
- ✅ Can predict behavior with both systems

**Result format**:
```markdown
**FR-002 Result**: PASS / FAIL / PARTIAL

**Precedence**: RULES_FIRST / PERMISSIONS_FIRST / BOTH_CHECKED / UNCLEAR

**Findings**:
1. [Which system is checked first?]
2. [Can rules override permissions?]
3. [Can permissions override rules?]

**Behavior matrix**:
| Permissions | Rules | Result |
|-------------|-------|--------|
| Allow | Deny | [behavior] |
| Deny | Allow | [behavior] |
| Allow | Allow | [behavior] |
| Deny | Deny | [behavior] |
| Ask | Deny | [behavior] |

**Evidence**:
- [Responses showing precedence]

**Recommendation**:
[When to use rules vs permissions for access control]
```

---

## Test FR-003: Dynamic Rules Updates

**Test ID**: FR-003
**Purpose**: Test if rules can be updated during a session

### Setup
Start with basic rules from FR-001

### Test Steps

**Step 1**: Verify current rules
- **Action**: `claude -p "read secrets.txt"`
- **Expected**: Blocked by rule
- **Record**: Baseline behavior

**Step 2**: Update rules to remove restriction
- **Action**: Edit `.claude/rules.md`, remove `secrets.txt` restriction
- **Save**: Save the file

**Step 3**: Test if update applied (same session)
- **Action**: In same session, `claude -p "read secrets.txt"`
- **Expected**: Either blocked (old rules) or allowed (new rules)
- **Observe**: Are rules reloaded during session?

**Step 4**: Test in new session
- **Action**: Exit and restart Claude Code
- **Action**: `claude -p "read secrets.txt"`
- **Expected**: Allowed with new rules
- **Observe**: Do new sessions pick up rule changes?

**Step 5**: Add new rule mid-session
- **Action**: Add new restriction: "Never write to temp.txt"
- **Action**: Test `claude -p "write to temp.txt"`
- **Expected**: Either blocked (new rule applied) or allowed (not yet applied)
- **Observe**: When are new rules loaded?

### Verification

**Success criteria**:
- ✅ Understand rule reload behavior
- ✅ Know if restart required for rule changes
- ✅ Can predict when rule updates take effect

**Result format**:
```markdown
**FR-003 Result**: PASS / FAIL / PARTIAL

**Update behavior**:
- Same session: RELOADED / NOT_RELOADED / CONDITIONAL
- New session: RELOADED / NOT_RELOADED / CONDITIONAL

**Findings**:
- [When rules are reloaded]
- [Do you need to restart?]
- [Any caching of rules?]

**Evidence**:
- [Behavior before and after rule changes]

**Recommendation**:
To update rules, [what to do]
```

---

## Test FR-004: Complex Rule Patterns

**Test ID**: FR-004
**Purpose**: Test advanced rule patterns (wildcards, regex, conditions)

### Setup
Create `.claude/rules.md` with advanced patterns:

```markdown
# Advanced Rules

## Wildcard Patterns

Never write to:
- `*.log` files (anywhere)
- `dist/**/*` (anything in dist directory)
- `node_modules/**/*` (anything in node_modules)

## Conditional Rules

IF file is `package.json`:
  - REQUIRE user confirmation before modification
  - NEVER delete

IF file matches `*.spec.ts`:
  - ALLOW all operations
  - ENCOURAGE test additions

## Path-based Rules

Files in `/src/`:
  - MUST have TypeScript extension (.ts, .tsx)
  - MUST NOT exceed 500 lines

Files in `/docs/`:
  - MUST be markdown (.md)
  - SHOULD follow naming: lowercase-with-dashes
```

### Test Steps

**Step 1**: Test wildcard patterns
- **Action**: `claude -p "create error.log with content 'error'"`
- **Expected**: Blocked by `*.log` pattern
- **Observe**: Does wildcard matching work?

**Step 2**: Test directory wildcards
- **Action**: `claude -p "write to dist/bundle.js"`
- **Expected**: Blocked by `dist/**/*` pattern
- **Observe**: Does recursive directory matching work?

**Step 3**: Test conditional rules
- **Action**: `claude -p "modify package.json to add a dependency"`
- **Expected**: Asks for confirmation (IF/REQUIRE rule)
- **Observe**: How are conditional rules handled?

**Step 4**: Test path-based rules
- **Action**: `claude -p "create src/utils.js with helper functions"`
- **Expected**: Rejected (MUST be .ts in /src/)
- **Observe**: Are path-specific rules enforced?

**Step 5**: Test SHOULD (soft recommendation)
- **Action**: `claude -p "create docs/MyGuide.md"`
- **Expected**: Works but Claude might suggest renaming to "my-guide.md"
- **Observe**: How are SHOULD rules communicated?

### Verification

**Success criteria**:
- ✅ Wildcard patterns work correctly
- ✅ Conditional rules (IF/THEN) are enforced
- ✅ Path-based rules are applied
- ✅ Distinction between MUST and SHOULD

**Result format**:
```markdown
**FR-004 Result**: PASS / FAIL / PARTIAL

**Pattern support**:
| Pattern Type | Supported | Details |
|--------------|-----------|---------|
| Wildcards (*) | YES/NO | [examples] |
| Recursive (**) | YES/NO | [examples] |
| Conditionals (IF) | YES/NO | [examples] |
| Path-based | YES/NO | [examples] |

**Rule severity**:
- NEVER/MUST: [how enforced]
- SHOULD: [how enforced]
- REQUIRE: [how enforced]
- ENCOURAGE: [how enforced]

**Findings**:
- [Which patterns work]
- [How rules are interpreted]

**Evidence**:
- [Examples of each pattern type]

**Pattern support level**: FULL / PARTIAL / BASIC / NONE
```

---

## Test FR-005: Rules Error Handling

**Test ID**: FR-005
**Purpose**: Test behavior when rules file has errors

### Setup

Test various error conditions:

**Test A**: Malformed markdown
```markdown
# Rules

Never write to secrets.txt
- But this list item is malformed
  - And improperly nested
```

**Test B**: Invalid syntax
```markdown
# Rules

NEVER write to [INVALID PATTERN **
IF file matches ??? THEN ^^^
```

**Test C**: Conflicting rules
```markdown
# Rules

ALWAYS allow writes to test.txt
NEVER allow writes to test.txt
```

### Test Steps

For each error type (A, B, C):

**Step 1**: Create rules file with error
- **Action**: Save malformed rules.md
- **Action**: Start Claude Code session

**Step 2**: Test if session starts
- **Expected**: Either error on startup, warning, or silent failure
- **Observe**: How are rule errors handled?

**Step 3**: Test if any rules work
- **Action**: Try operations that should be restricted
- **Expected**: Either partial rules work, or all rules ignored
- **Observe**: Graceful degradation?

**Step 4**: Check for error messages
- **Expected**: Helpful error message pointing to problem
- **Observe**: Can user debug the issue?

### Verification

**Success criteria**:
- ✅ Errors are caught and reported clearly
- ✅ Graceful degradation (don't crash)
- ✅ Helpful error messages for debugging

**Result format**:
```markdown
**FR-005 Result**: PASS / FAIL / PARTIAL

**Error handling by type**:
| Error Type | Behavior | Error Message |
|------------|----------|---------------|
| Malformed MD | [crash/warn/ignore] | [message] |
| Invalid syntax | [crash/warn/ignore] | [message] |
| Conflicting rules | [crash/warn/ignore] | [message] |

**Findings**:
- [How errors are communicated]
- [Whether partial rules work]
- [User debuggability]

**Evidence**:
- [Error messages received]
- [Behavior with malformed rules]

**Error handling quality**: EXCELLENT / GOOD / FAIR / POOR
```

---

## Aggregate Results Template

After running all FR tests:

```markdown
# Rules Feature Test Results

**Date**: YYYY-MM-DD
**Tester**: [name]
**Claude Code Version**: [version]

## Summary

**Overall Status**: [X/5 tests passed]

| Test ID | Test Name | Status | Key Finding |
|---------|-----------|--------|-------------|
| FR-001 | Basic Rules | PASS/FAIL | [finding] |
| FR-002 | Rules vs Permissions | PASS/FAIL | [finding] |
| FR-003 | Dynamic Updates | PASS/FAIL | [finding] |
| FR-004 | Complex Patterns | PASS/FAIL | [finding] |
| FR-005 | Error Handling | PASS/FAIL | [finding] |

## Key Findings

### Rule System Capabilities
- [What rules can enforce]
- [What rules cannot enforce]
- [Reliability of enforcement]

### Rules vs Permissions
- [When to use rules]
- [When to use permissions]
- [How they interact]

### Best Practices

**Creating rules**:
1. [Best practice 1]
2. [Best practice 2]

**Patterns to avoid**:
1. [Anti-pattern 1]
2. [Anti-pattern 2]

**Rule syntax that works**:
- [Syntax examples that are reliable]

**Rule syntax that doesn't work**:
- [Syntax to avoid]

## Practical Recommendations

**Use rules for**:
- [Use case 1]
- [Use case 2]

**Use permissions for**:
- [Use case 1]
- [Use case 2]

**Avoid rules for**:
- [What not to use rules for]

## Evidence

[Links to test results, examples, error messages]
```

---

## Next Steps

1. Execute all 5 tests
2. Record findings in `results/feature-results-YYYY-MM-DD.md`
3. Document practical recommendations for rule usage
4. Proceed to test-hooks.md
