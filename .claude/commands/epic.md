---
description: Fast-track planning - generates requirements and plan only
allowed-tools: Read(*), Write(*), Bash(*), Glob(*), Grep(*), mcp__serena__*(*)
argument-hint: [prompt-text] or [epic-id]
---

# Epic Command - Streamlined Planning Workflow

Execute planning workflow with in-memory research and tech-design. Only generates requirements.md and plan.md.

## Argument Parsing

**Three modes:**

```bash
/epic                          # Create epic-XXXX, prompt user for ticket
/epic "Create user dashboard"  # Create epic-XXXX, use text as ticket
/epic epic-0042                # Use existing epic-0042
```

**Detection logic:**

1. **No argument** → Create new epic, interactive ticket creation
2. **Matches `epic-\d+` pattern** → Use existing epic
3. **Any other text** → Create new epic, use text as ticket content

## Step 0: Setup Epic

### 0.1 Determine Mode

If argument matches `epic-\d+`:
- Set `project_id = argument`
- Check `.claude/epics/{project_id}/ticket.md` exists
- If missing: Error "Ticket not found for {project_id}"
- **Skip to Step 1**

Otherwise (no argument OR text argument):
- **Continue to 0.2**

### 0.2 Find Next Epic ID

List existing epics:

```bash
ls .claude/epics/ | grep -E '^epic-[0-9]+$' | sort -V | tail -1
```

Extract highest number and increment:
- If none exist → `epic-0001`
- If `epic-0042` exists → `epic-0043`

Set `project_id = epic-XXXX`

### 0.3 Create Epic Folder

```bash
mkdir -p .claude/epics/{project_id}
```

### 0.4 Create Ticket

**If argument provided (text):**

Write to `.claude/epics/{project_id}/ticket.md`:

```markdown
# [First line of prompt text]

[Full prompt text]
```

**If no argument:**

Ask user: "Provide ticket content for {project_id}:"

Wait for response, then write to ticket.md.

**Continue to Step 1**

---

## Step 1: Requirements

### 1.1 Read Ticket

Read `.claude/epics/{project_id}/ticket.md`

### 1.2 Detect Domain

From ticket keywords (case-insensitive):

- **Trading**: trading, trade, order, execution, liquidity, portfolio, OMS, market
- **Tokenization**: tokenization, token, issuance, primary market, secondary market, compliance
- **Crypto**: crypto, cryptocurrency, bitcoin, ethereum, blockchain, wallet, DeFi
- **Cash**: cash, fiat, SEPA, SWIFT, payment, settlement, bank account
- **None**: refactor, move, fix, bug, test, route, component (without domain context)

### 1.3 Validate Ticket

Check for:
- Business context (for domain tasks)
- Technical clarity (WHAT and WHY)
- Scope boundaries

### 1.4 Define Scope

Extract from ticket:
- In-scope apps (with `apps/` prefix)
- In-scope modules (if mentioned)
- Out-of-scope items

### 1.5 Write requirements.md

Write to `.claude/epics/{project_id}/requirements.md`:

```markdown
# [Feature Title]

## Ticket Quality Assessment

**Domain Detected**: [trading/tokenization/crypto/cash/none]
**Business Context**: [✅ Complete / ⚠️ Partial / ❌ Missing]
**Technical Clarity**: [✅ Clear / ⚠️ Unclear / ❌ Vague]

**Missing Information**: [List or "None"]

## Scope

### In-Scope

- **Apps**: [list with full paths]
- **Modules**: [list with full paths or "TBD"]
- **Features**: [list specific features]

### Out-of-Scope

- [Explicitly list what is NOT included]

### Verification Needed

- [ ] [Ambiguities if any]

## What

[2-3 sentences describing what needs to be done]

## Why

[1-2 sentences on business value]

## Business Context

[CONDITIONAL: Only if domain detected]
[Business rules and domain context]

## Acceptance Criteria

- [ ] Specific testable criterion 1
- [ ] Specific testable criterion 2
- [ ] Specific testable criterion 3

## Notes

[ONLY if critical constraints exist]
```

---

## Step 2: Research (In-Memory)

**CRITICAL**: Do research work, **do NOT write research.md**. Keep findings in context.

### 2.1 Time-Boxed Research (Max 5 iterations)

Use Serena MCP tools:
- `mcp__serena__find_file` - Find files
- `mcp__serena__search_for_pattern` - Search patterns
- `mcp__serena__get_symbols_overview` - Get structure
- `mcp__serena__find_symbol` - Read symbols
- `mcp__serena__find_referencing_symbols` - Track usage

**Iteration 1 (2 min):**
- Verify imports from in-scope apps
- Find file locations
- Discover existing patterns
- Document current dependencies

**Confidence check:**
- ✅ HIGH: Sufficient understanding → Continue
- ⚠️ MEDIUM: Need more context → Ask user for 1 more minute
- ❌ LOW: Gaps exist → Ask user for 1 more minute

**Iterations 2-5 (1 min each)** - If approved:
- Discover additional patterns
- Document test patterns
- Track dependencies

**Max 5 iterations total.**

### 2.2 Keep Research Findings in Memory

Remember for Step 3 (knowledge loading) and Step 4 (tech-design):
- Verified in-scope apps and modules
- Existing file locations and paths
- Discovered patterns (with file:line references)
- Import dependencies
- Test patterns
- Type definitions
- Actual technologies/frameworks used (e.g., React Router v6 vs v7, Chakra vs MUI)
- Existing state management patterns discovered

**Do NOT write research.md.**

---

## Step 3: Load Knowledge

**CRITICAL**: Knowledge loading happens AFTER research so we know what's actually needed.

### 3.1 Analyze Ticket + Research Findings

Combine information from:
- Ticket requirements (Step 1)
- Research findings (Step 2) - actual patterns, frameworks, technologies discovered

### 3.2 Discover Available Tags

```bash
node .claude/knowledge/scripts/knowledge-search.mjs --list-tags
```

### 3.3 Select Relevant Tags

Based on **both ticket AND research findings**, select 2-4 tags from available tags.

**Consider:**
- What frameworks/libraries were actually found in research?
- What patterns already exist in the codebase?
- What specific features need to be implemented?
- What testing patterns were discovered?

### 3.4 Load Knowledge

```bash
agent_id="epic-{project_id}-$(date +%s)"

node .claude/knowledge/scripts/knowledge-search.mjs \
  --command-profile plan \
  --tags [selected-tags] \
  --agent-name epic-command \
  --agent-id "$agent_id" \
  --prompt "[brief-ticket-summary]"
```

Read top 3-5 packages from JSON output.

### 3.5 State What Was Loaded

"Loaded: [package1], [package2], ..." OR "No relevant knowledge found"

**Why this matters:** Knowledge is now loaded based on actual codebase findings, not just ticket guesses. This ensures relevant, targeted knowledge for tech-design decisions.

---

## Step 4: Tech-Design (In-Memory)

**CRITICAL**: Do tech-design work, **do NOT write tech-design.md**. Keep decisions in context.

### 4.1 Use Research Findings + Loaded Knowledge

From Step 2 (research) memory:
- Current state (existing files)
- Import dependencies
- Discovered patterns
- Test patterns

From Step 3 (loaded knowledge):
- Best practices for discovered patterns
- Standard approaches for the frameworks/libraries found
- Testing strategies that match the project's conventions

### 4.2 Make Design Decisions

Determine:
- **Files to create**: List with purpose
- **Files to modify**: List with changes needed
- **Files to delete**: List with safety conditions
- **Implementation approach**: High-level phases/steps
- **Components and responsibilities**: Key components
- **Design decisions**: Rationale for approach
- **Integration points**: How it fits existing system

### 4.3 Clarify Requirements (if needed)

If ambiguities exist, ask user. Wait for answers before continuing.

### 4.4 Determine Testing Strategy

**For entire feature:**

1. **Will existing tests break?**
   Search test files importing changed code:
   ```typescript
   mcp__serena__search_for_pattern({
     pattern: "[file-name-being-changed]",
     paths_include_glob: "**/*.spec.{ts,tsx}"
   })
   ```

2. **Are we adding new code?** → NEW tests required

3. **Are we changing behavior?** → Regression tests required

4. **Pure refactor + tests work?** → "Run test suite" only

5. **Docs/styling/config only?** → "No test changes"

### 4.5 Keep Tech-Design in Memory

Remember for Step 5:
- File operations (create/modify/delete)
- Implementation approach (phases)
- Design decisions and rationale
- Testing strategy
- Integration points

**Do NOT write tech-design.md.**

---

## Step 5: Implementation Plan

### 5.1 Validate Scope

From requirements.md:
- In-scope apps, modules, features
- Out-of-scope items
- Ambiguities

### 5.2 Break Down Into Tasks

Use tech-design decisions from Step 4.

Create vertical slices:
- 3-8 tasks total (fewer is better)
- Each independently testable/committable
- Include all layers + tests per task

**Task Template:**

```markdown
## TASK-XXX: [Descriptive Technical Title]

**Status**: TODO
**Priority**: [Critical/High/Medium/Low]

**Description**:
[Clear technical description - WHAT to implement]
[Specific components, functions, modules, files]

**Goal**:
[Technical outcome - WHY this matters]

**Requirements**:

- [ ] Include ALL layers (DB, service, API, UI)
- [ ] Handle errors and edge cases
- [ ] Follow project standards
- [ ] Type-safe implementation
- [ ] NO JSDoc/comments (self-documenting code)

**Testing Requirements** (MANDATORY):

- [ ] Update test mocks: [specific files] OR "No mocks to update"
- [ ] Write unit tests: [specific functions] OR "No new tests needed"
- [ ] Write integration tests: [specific flows] OR "No integration tests needed"
- [ ] Run test suite: npx nx test [app-name]
- [ ] Fix broken tests: [estimate or "none expected"]
  OR (only if truly no test work):
- [ ] No test changes needed: [explicit reason]

**Acceptance Criteria**:

- [ ] Implementation complete
- [ ] Build succeeds: npx nx build [app]
- [ ] Type checker passes: npx nx typecheck [app]
- [ ] Linter passes: npx nx lint [app]
- [ ] All tests pass: npx nx test [app]
- [ ] Feature works end-to-end (manual verification)
- [ ] Ready to commit

**Dependencies**:

- TASK-XXX: [Description] (or None)

**Notes**:

- [Implementation decisions, gotchas, links]
```

### 5.3 Self-Check

Verify:
- ✅ EVERY task has "Testing Requirements" section
- ✅ At least ONE task includes "Run test suite"
- ✅ All tasks are vertical slices
- ✅ All Nx commands use `npx nx` prefix
- ✅ 3-8 tasks total

### 5.4 Write Plan

Write to `.claude/epics/{project_id}/plan.md`:

```markdown
# Implementation Plan: [Feature Name]

**Spec Location**: `.claude/epics/{project_id}/requirements.md`
**Created**: [Date]
**Domain**: [Backend/Frontend/etc]
**Total Tasks**: [N]

## Tasks

[All tasks using template above]

---

## Suggested Commit Message

```

[TICKET-ID] Brief description (50 chars max)

- Key change 1
- Key change 2
- Key change 3

This implements [summary of what was built].

```
```

---

## Step 6: Summary

Show completion status:

```markdown
✅ Epic planning complete for {project_id}

Generated:
- ✅ requirements.md
- ✅ plan.md

Completed (in-memory):
- ✅ Research (findings used to inform knowledge loading)
- ✅ Knowledge loading (loaded based on ticket + research)
- ✅ Tech-design (decisions used for plan)

Location: .claude/epics/{project_id}/

Next: Run /implement {project_id} to start coding
```

Ask user if they want to review or proceed with implementation.

---

## Critical Rules

**ALWAYS:**

- ✅ Use Serena MCP for ALL code research
- ✅ Do requirements FIRST (Step 1)
- ✅ Do research SECOND (Step 2)
- ✅ Load knowledge THIRD - after research (Step 3)
- ✅ Base knowledge tag selection on BOTH ticket AND research findings
- ✅ Keep research findings in memory (no research.md)
- ✅ Keep tech-design decisions in memory (no tech-design.md)
- ✅ Only write requirements.md and plan.md
- ✅ Use tech-design decisions as source of truth for planning
- ✅ Create vertical slice tasks
- ✅ Include testing in EVERY task
- ✅ Use `npx nx` prefix

**NEVER:**

- ❌ Load knowledge before research (you won't know what to load!)
- ❌ Write research.md
- ❌ Write tech-design.md
- ❌ Skip research work (just don't document it)
- ❌ Skip tech-design work (just don't document it)
- ❌ Create layer-based tasks
- ❌ Use bare `nx` commands

---

**Now begin workflow.**
