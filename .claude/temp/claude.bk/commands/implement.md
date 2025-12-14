---
description: Start executing the implementation plan
argument-hint: <project-id>
model: haiku
---

# Implement Command - Execute Implementation Plan

Start implementing plan for: "$ARGUMENTS"

## Model Selection

**Default: Haiku** (cost-efficient for executing detailed plans)

**Rationale:**
- The plan contains detailed instructions from Sonnet-generated tech-design
- Implementation is "follow the plan" work, not complex decision-making
- Checkpoint system catches issues after each task (low risk)
- 92% cost savings enables longer productive work sessions

**When to override to Sonnet:**
User can request Sonnet for specific complex tasks:
- "Use Sonnet for TASK-003" - Complex refactoring requiring deep code understanding
- "Switch to Sonnet" - If Haiku quality is consistently poor
- "Use Sonnet for the rest" - For remaining tasks in epic

**CRITICAL**: When exploring existing code in `/apps/` or `/libs/` during implementation, you MUST use Serena MCP tools (`mcp__serena__*`) exclusively. Only use Read for non-code files or when you're about to Edit/Write a code file.

## Steps

### 1. Locate and Analyze Plan

- Parse project ID from arguments (e.g., "PROJ-123", "feature-name")
- Read `.claude/epics/[project-id]/plan.md`
- Count total TODO tasks
- Show plan summary to user

### 2. Load Knowledge (MANDATORY)

**MANDATORY**: Load knowledge before starting implementation work.

**Step 1: Discover Available Tags**

Run tag discovery to see all available tags:

```bash
node .claude/knowledge/scripts/knowledge-search.mjs --list-tags
```

**Step 2: Determine Relevant Tags**

Based on plan.md task details, select 2-4 relevant tags:

**Domain-based tags**:
- **Trading**: `trading`, `trading-oms`, `portfolio`, `market-data`
- **Tokenization**: `tokenization`, `compliance`, `primary-market`, `secondary-market`
- **Crypto**: `crypto`, `wallet`, `custody`, `blockchain`
- **Cash**: `cash`, `payment`, `sepa`, `settlement`
- **Risk**: `risk`, `compliance`, `monitoring`

**Task-type tags**:
- **Routing**: `routing`, `react-router`, `permissions`, `monorepo-routing`
- **Components**: `component-creation`, `react-component-patterns`, `styling`
- **Forms**: `forms`, `validation`, `yoda-form`
- **Testing**: `testing-basics`, `mocking`, `jest`
- **API**: `api-integration`, `data-fetching`, `react-query`
- **State**: `state-management`, `zustand`, `context`
- **Data Tables**: `data-table`, `tanstack-table`, `pagination`

**Step 3: Load Knowledge**

Run knowledge search with selected tags:

```bash
agent_id="implementation-{project-id}-$(date +%s)"

node .claude/knowledge/scripts/knowledge-search.mjs \
  --command-profile implementation \
  --tags [selected-tags] \
  --agent-name implementation-command \
  --agent-id "$agent_id" \
  --prompt "[brief-task-summary]"
```

**Step 4: Read Top Packages**

From the JSON output, read the top 3-5 most relevant packages by their `knowledge_path`.

**Example**:
```bash
# Task: "Create portal routes in synergy-client"
# Selected tags: routing,react-router,component-creation

agent_id="implementation-feco-0000-$(date +%s)"

node .claude/knowledge/scripts/knowledge-search.mjs \
  --command-profile implementation \
  --tags routing,react-router,component-creation \
  --agent-name implementation-command \
  --agent-id "$agent_id" \
  --prompt "Create portal routes in synergy-client"

# Read top packages returned
```

**If search returns 0 results**:
1. Use fewer tags (try 1-2 instead of 4)
2. Broaden tags (use more general terms)
3. Re-run `--list-tags` to verify available tags

**Proof of loading**:
After loading knowledge, state in your response:
- "Loaded: [package1], [package2], [package3]"
- OR "No relevant knowledge found: [reason]"

### 3. Ask User for Plan Approval

Ask user if the plan is approved and ready to execute.

### 4. Explore Existing Code (if needed)

**Use Serena MCP** for code exploration (saves 80-90% tokens):

```bash
# Overview first (300-500 tokens vs 2-5k)
mcp__serena__get_symbols_overview({
  relative_path: "apps/[app]/src/[file].tsx"
})

# Specific symbols (100-200 tokens)
mcp__serena__find_symbol({
  name_path_pattern: "[symbol-name]",
  relative_path: "[file]"
})
```

**When to use Read vs Serena**:
- ✅ Serena MCP: Exploring code in `/apps/` or `/libs/`
- ✅ Read: Docs, configs, package.json, non-code files
- ✅ Read: Code files you're about to Edit/Write

### 5. Execute Tasks (One at a Time)

**CRITICAL**: Execute ONE task at a time, then STOP for user testing.

**For each task:**

1. Find next TODO task
2. Update task status to IN_PROGRESS in plan.md
3. Implement the task (write code, tests, etc.)
4. Run automated verification (tests, typecheck, lint, build)
5. Update task status to COMPLETED in plan.md
6. **STOP and ask user to test**

**CRITICAL**: You MUST update plan.md task statuses as you progress:
- Before starting task: TODO → IN_PROGRESS
- After completing task: IN_PROGRESS → COMPLETED
- Use the Edit tool to modify plan.md

**Workflow per task:**
```markdown
# Starting Task 1
→ Edit plan.md: "**Status**: TODO" → "**Status**: IN_PROGRESS"
→ Implement the task
→ Run automated checks (tests, typecheck, lint)
→ Edit plan.md: "**Status**: IN_PROGRESS" → "**Status**: COMPLETED"
→ STOP - Ask user to test

# User tests, gives feedback
→ If issues found: Fix them
→ If approved: Continue to Task 2

# Starting Task 2
→ Edit plan.md: "**Status**: TODO" → "**Status**: IN_PROGRESS"
→ Implement the task
→ ...
```

**Why stop after each task?**
- Vertical slices deliver user value incrementally
- Each task should be testable independently
- Catch issues early before building on broken foundation
- Get user feedback on direction before continuing

### 6. Testing Checkpoint (MANDATORY)

After completing each task, STOP and present testing checkpoint:

```
✅ TASK-00X completed ([X]/[N] tasks)

**What was implemented:**
- [Brief description of what was built]
- [Key functionality added]

**Files modified:**
- [List of changed files with brief description]

**Automated verification:**
- ✅ Unit tests: [X/Y passed]
- ✅ Type check: Passed
- ✅ Linter: Passed
- ✅ Build: Passed

**Manual testing needed:**
Please test the following:
1. [Specific thing to test with expected behavior]
2. [Another thing to test]
3. [Edge case to verify]

**How to test:**
[Brief instructions on how to run/view the feature]
Example: "Run `npx nx serve client`, navigate to /users, click 'Add User'"

---

**Ready for testing. Please verify and let me know:**
1. "Continue" - Move to next task
2. "Fix [issue]" - I'll fix the issue before continuing
3. "Stop" - Pause implementation here
```

**Suppress verbose outputs**:
- Lint/build outputs: Only show errors, summarize success
- Example: `✅ synergy-client lint passed` instead of full nx output
- Keep TypeScript errors if they occur, but summarize success

**Do NOT continue to next task until user responds.**

## Code Quality Standards

**Your code MUST**:
- ✅ Compile/run without errors
- ✅ Pass all tests (unit/integration)
- ✅ Pass linter and type checker
- ✅ Follow loaded knowledge patterns
- ✅ Handle errors gracefully
- ✅ Be documented (complex logic)
- ✅ Be maintainable

**Challenge your own code for**:
- Bugs, security issues, performance problems
- Missing error handling
- N+1 queries, inefficient algorithms
- Business logic in wrong layers
- Missing tests

## Critical Rules

**ALWAYS**:
- ✅ Load knowledge before implementing
- ✅ Use Serena MCP for code exploration
- ✅ Apply loaded knowledge patterns
- ✅ Write tests alongside code
- ✅ Execute ONE task at a time (not all tasks)
- ✅ STOP after each task for user testing
- ✅ Update task statuses in plan.md as you progress
- ✅ Challenge your code for issues
- ✅ Add error handling
- ✅ Run quality checks (build, tests, lint, typecheck)
- ✅ Provide testing checkpoint with clear instructions
- ✅ Wait for user approval before continuing to next task

**NEVER**:
- ❌ Write code without loading knowledge
- ❌ Ship buggy or insecure code
- ❌ Skip tests
- ❌ Write e2e tests (only unit/integration)
- ❌ Leave TODO comments
- ❌ Ignore linting/type errors
- ❌ Use Read for code exploration (use Serena MCP)

## Context

The plan.md contains all necessary information extracted from requirements, research, tech-design, and scenarios during the planning phase. You should refer to plan.md and may autonomously read other files if needed for specific implementation details.

## Error Handling

If a task fails:
1. Mark task as FAILED in plan.md
2. Report error to user
3. STOP execution
4. Suggest: Fix issue, then run `/implement` again to retry

## Example Output (With Testing Checkpoints)

```
🚀 Starting implementation for {project-id}
Plan: 8 tasks total

[Implements TASK-001...]

✅ TASK-001 completed (1/8)

**What was implemented:**
- Created UserForm component with name and email fields
- Added form state management with useState
- Styled component using existing design system

**Files modified:**
- apps/client/src/components/UserForm.tsx (new)
- apps/client/src/components/UserForm.spec.tsx (new)

**Automated verification:**
- ✅ Unit tests: 5/5 passed
- ✅ Type check: Passed
- ✅ Linter: Passed
- ✅ Build: Passed

**Manual testing needed:**
1. Form renders with name and email inputs
2. Inputs accept text properly
3. Styling matches design system

**How to test:**
Run `npx nx serve client`, navigate to /users/new

---

**Ready for testing. Please verify and let me know:**
1. "Continue" - Move to TASK-002
2. "Fix [issue]" - I'll fix before continuing
3. "Stop" - Pause here

[User responds: "Continue"]

[Implements TASK-002...]

✅ TASK-002 completed (2/8)

[... checkpoint format repeats ...]

[After all tasks complete:]

🎉 Implementation complete for {project-id}
All 8 tasks completed and tested.
```
