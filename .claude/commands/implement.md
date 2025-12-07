---
description: Start executing the implementation plan
argument-hint: <project-id>
model: haiku
---

# Implement Command - Execute Implementation Plan

Start implementing plan for: "$ARGUMENTS"

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

### 5. Execute All Tasks

Execute all tasks in the plan sequentially:

1. Find first TODO task
2. Update task status to IN_PROGRESS in plan.md
3. Implement the task (write code, tests, etc.)
4. Update task status to COMPLETED in plan.md
5. Continue to next task
6. Repeat until all tasks completed

**CRITICAL**: You MUST update plan.md task statuses as you progress:
- Before starting task: TODO → IN_PROGRESS
- After completing task: IN_PROGRESS → COMPLETED
- Use the Edit tool to modify plan.md

**Example**:
```markdown
# Starting Task 1
→ Edit plan.md: "**Status**: TODO" → "**Status**: IN_PROGRESS"
→ Implement the task
→ Edit plan.md: "**Status**: IN_PROGRESS" → "**Status**: COMPLETED"

# Move to Task 2
→ Edit plan.md: "**Status**: TODO" → "**Status**: IN_PROGRESS"
→ Implement the task
→ Edit plan.md: "**Status**: IN_PROGRESS" → "**Status**: COMPLETED"
```

### 6. Progress Reporting (Compressed)

After each task completion, use compressed format:
```
✅ TASK-00X completed ([X]/[N] tasks)
Files: [count] files modified
Verification: [Quick one-line verification method]
Next: [TASK-00Y name] or "All tasks complete"
```

**Suppress verbose outputs**:
- Lint/build outputs: Only show errors, summarize success
- Example: `✅ synergy-client lint passed` instead of full nx output
- Keep TypeScript errors if they occur, but summarize success

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
- ✅ Execute ALL tasks in sequence
- ✅ Update task statuses in plan.md as you progress
- ✅ Challenge your code for issues
- ✅ Add error handling
- ✅ Run quality checks (build, tests, lint, typecheck)
- ✅ Provide clear progress updates after each task

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

## Example Output (Compressed Format)

```
🚀 Starting implementation for {project-id}
Plan: 8 tasks total

✅ TASK-001 completed (1/8)
Files: 3 files modified
Verification: Component renders correctly
Next: TASK-002 - Add form validation

✅ TASK-002 completed (2/8)
Files: 2 files modified
Verification: Validation errors display
Next: TASK-003 - API integration

[...continues...]

✅ TASK-008 completed (8/8)
Files: 1 file modified
Verification: All tests pass
Next: All tasks complete

🎉 Implementation complete for {project-id}
```
