---
description: Quick standalone task - implement and document
allowed-tools: Read(*), Write(*), Bash(*), Glob(*), Grep(*), mcp__serena__*(*)
argument-hint: "task description"
---

# Task Command - Standalone Quick Fix

Implements small, independent tasks with knowledge loading and after-action documentation.

## Argument Parsing

**Required:** Task description (text)

```bash
/task "Fix button border size"
/task "Make /api/users endpoint non-nullable"
```

**Error if no argument:** "Provide task description: /task \"description\""

---

## Step 1: Setup Task ID

### 1.1 Find Next Task ID

List existing tasks:

```bash
ls .claude/tasks/ 2>/dev/null | grep -E '^task-[0-9]+$' | sort -V | tail -1
```

Extract highest number and increment:
- If none exist → `task-0001`
- If `task-0042` exists → `task-0043`

Set `task_id = task-XXXX`

### 1.2 Create Task Folder

```bash
mkdir -p .claude/tasks/{task_id}
```

---

## Step 2: Refine Input & Load Knowledge

### 2.1 Analyze Task Description

From user input, determine:
- **Type**: Bug fix, styling change, config update, API change, etc.
- **Scope**: Which files/components likely affected
- **Domain**: Technical area (UI, API, database, etc.)

### 2.2 Extract Keywords for Tags

From task description, identify relevant tags:

**Common tag patterns:**
- Styling/CSS → `styling`, `css`, `component`
- Component changes → `component-creation`, `react-component-patterns`
- API changes → `api-integration`, `endpoints`
- Forms → `forms`, `validation`
- Tests → `testing-basics`, `mocking`
- State → `state-management`
- Routing → `routing`, `react-router`

**Generate refined description:**
- Expand abbreviations
- Add technical context
- Clarify intent

**Example:**
```
Input: "Fix button border size"
Refined: "Fix button border size in header component (styling issue)"
Tags: styling, component, css
```

### 2.3 Discover Available Tags

```bash
node .claude/knowledge/scripts/knowledge-search.mjs --list-tags
```

### 2.4 Load Knowledge

```bash
agent_id="task-{task_id}-$(date +%s)"

node .claude/knowledge/scripts/knowledge-search.mjs \
  --tags [selected-tags] \
  --agent-name task-command \
  --agent-id "$agent_id" \
  --prompt "[refined-description]"
```

Read top 3-5 packages from JSON output.

**Show user:**
```
Task: task-0001
Refined: [refined description]
Loaded: [package1], [package2], [package3]
```

OR if no packages found:
```
Task: task-0001
Refined: [refined description]
No relevant knowledge packages found, proceeding with general knowledge
```

---

## Step 3: Implement

### 3.1 Do Research (if needed)

Use Serena MCP to find affected files:
- `mcp__serena__find_file` - Locate files
- `mcp__serena__search_for_pattern` - Find patterns
- `mcp__serena__get_symbols_overview` - Understand structure
- `mcp__serena__find_symbol` - Read specific code

**Time-box:** Max 2 minutes for discovery

### 3.2 Implement Fix

Apply changes using:
- Read, Edit, Write tools for code changes
- Bash for running tests/build

**Follow loaded knowledge patterns** (if any loaded)

### 3.3 Verify

Run appropriate verification:
- Tests: `npx nx test [affected-app]`
- Type check: `npx nx typecheck [affected-app]`
- Lint: `npx nx lint [affected-app]`
- Build: `npx nx build [affected-app]` (if needed)

**If verification fails:** Fix issues before documenting.

---

## Step 4: Document (After-Action Report)

### 4.1 Collect Implementation Data

From Step 3, gather:
- Files changed (with specific lines if applicable)
- Approach taken
- Tests run
- Any issues encountered and resolved

### 4.2 Write Work Document

Write to `.claude/tasks/{task_id}/work.md`:

```markdown
---
title: [Refined task description]
created: [YYYY-MM-DD]
status: [complete | failed]
knowledge_used:
  - [package1]
  - [package2]
---

## Request

[Original user input]

## Refined Description

[Refined/expanded description from Step 2]

## Implementation

**Files Changed:**
- `path/to/file1.ts` ([line numbers or "multiple lines"]) - [What was changed]
- `path/to/file2.spec.ts` - [What was changed]

**Approach:**
[Brief description of how the fix was implemented - 2-3 sentences]

**Knowledge Applied:**
- [Package name]: [How it informed the implementation]
- [Package name]: [How it informed the implementation]
OR "No knowledge packages used - implemented with general best practices"

## Verification

**Commands Run:**
```bash
npx nx test [app]
npx nx typecheck [app]
npx nx lint [app]
```

**Results:**
- ✅ All tests passed
- ✅ Type check passed
- ✅ Linter passed

OR (if failed):
- ❌ Task failed: [reason]
- [Error details]

## JIRA Summary

[One-sentence summary suitable for JIRA sync]
[Example: "Updated button border from 1px to 2px in header component for better visibility"]
```

**If task failed:**
- Set `status: failed`
- Document what was attempted
- Document error encountered
- Don't make assumptions about fixes

---

## Step 5: Summary

Show completion message:

```markdown
✅ Task task-{task_id} complete

**What:** [Refined description]
**Changed:** [N files]
**Knowledge Used:** [package1, package2] OR "None"
**Status:** Complete

Documentation: .claude/tasks/{task_id}/work.md
```

OR if failed:

```markdown
❌ Task task-{task_id} failed

**What:** [Refined description]
**Issue:** [Brief error description]
**Status:** Failed

Details: .claude/tasks/{task_id}/work.md
```

---

## Critical Rules

**ALWAYS:**

- ✅ Create incremental task-XXXX folder
- ✅ Refine user input before implementing
- ✅ Load knowledge when available
- ✅ Implement BEFORE documenting
- ✅ Document what WAS done, not what WILL be done
- ✅ Include JIRA-ready summary
- ✅ Track knowledge usage
- ✅ Verify implementation (tests, typecheck, lint)

**NEVER:**

- ❌ Write plan before implementing (this is a quick task)
- ❌ Document "how it will be fixed" (document "how it WAS fixed")
- ❌ Skip knowledge loading (always attempt to load)
- ❌ Skip verification (always run tests/checks)
- ❌ Mark as complete if verification fails

---

## Knowledge Loading Strategy

**For quick tasks:**

1. **Extract 1-3 tags** from description
2. **Load focused knowledge** (max 3-5 packages)
3. **Apply patterns** if knowledge loaded
4. **Proceed with best practices** if no knowledge found

**Don't over-research:** This is a quick task, not an epic. 2 minutes max for discovery.

---

**Now begin workflow.**
