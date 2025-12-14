---
description: Discover what you were working on by scanning work artifacts
allowed-tools: Read(*), Bash(*), Glob(*), Grep(*)
argument-hint: (no arguments)
model: haiku
---

# Next Command - Context Discovery

Scans your work artifacts to discover what you were working on. No state management - just intelligent file scanning.

## How It Works

Scans:
1. Epic plan.md files for IN-PROGRESS tasks
2. Recent standalone tasks (last 48 hours)
3. Git status (uncommitted changes, current branch)
4. File modification times

Then presents a summary and asks what to work on next.

---

## Step 1: Scan Epics

### 1.1 Find All Epics

```bash
ls .claude/epics/ 2>/dev/null | grep -E '^epic-[0-9]+$'
```

If no epics found, set `epics_context = []` and skip to Step 2.

### 1.2 Check Each Epic for IN-PROGRESS Tasks

For each epic found, read `plan.md`:

```bash
cat .claude/epics/{epic-id}/plan.md
```

**Extract IN-PROGRESS tasks:**

Look for task sections with `**Status**: IN-PROGRESS`

**Parse task info:**
- Task ID (e.g., TASK-003)
- Task title
- Subtasks (if any) with their statuses
- Files mentioned in task description

**Store:**
```
epics_context = [
  {
    epic_id: "epic-0001",
    task_id: "TASK-003",
    title: "Add user validation",
    subtasks: [
      { id: "TASK-003-1", status: "complete" },
      { id: "TASK-003-2", status: "in-progress" }
    ],
    files: ["user-form.tsx", "user-form.spec.tsx"]
  }
]
```

### 1.3 Check for TODO Tasks (Next in Line)

For epics with NO in-progress tasks, find the first TODO task:

```
next_tasks = [
  {
    epic_id: "epic-0002",
    task_id: "TASK-001",
    title: "Create dashboard layout",
    status: "todo"
  }
]
```

---

## Step 2: Scan Standalone Tasks

### 2.1 Find Recent Tasks

```bash
find .claude/tasks/ -name "work.md" -type f -mtime -2 2>/dev/null | sort -r
```

**Explanation:**
- `-mtime -2` = modified in last 48 hours
- `sort -r` = most recent first

### 2.2 Read Recent Task Details

For top 5 most recent tasks, read `work.md`:

**Extract:**
- Task ID (from folder name)
- Title (from frontmatter)
- Created date
- Status (complete/failed)
- Files changed

**Store:**
```
tasks_context = [
  {
    task_id: "task-0042",
    title: "Fix button border size",
    created: "2025-01-07",
    status: "complete",
    ago: "2 hours ago",
    files: ["button.css", "button.spec.tsx"]
  }
]
```

---

## Step 3: Check Git Status

### 3.1 Get Current Branch

```bash
git rev-parse --abbrev-ref HEAD 2>/dev/null
```

If not a git repo, skip this step.

### 3.2 Get Uncommitted Changes

```bash
git status --short 2>/dev/null
```

**Parse output:**
- Count modified files
- Count new files
- List specific files (max 10)

**Store:**
```
git_context = {
  branch: "feature/user-validation",
  modified: 5,
  new: 2,
  files: ["user-form.tsx", "user-form.spec.tsx", ...]
}
```

---

## Step 4: Check Recent File Changes

### 4.1 Find Recently Modified Files

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -mmin -60 \
  -exec ls -lt {} + 2>/dev/null | head -10
```

**Explanation:**
- `-mmin -60` = modified in last 60 minutes
- Top 10 most recent

**Store:**
```
recent_files = [
  { path: "apps/client/src/user-form.tsx", ago: "15 minutes ago" },
  { path: "apps/client/src/user-form.spec.tsx", ago: "15 minutes ago" }
]
```

---

## Step 5: Present Context

### 5.1 Build Summary

**Format:**

```markdown
📊 Work Context Discovery

## Epics in Progress

[epic-0001] TASK-003: Add user validation
  Status: IN-PROGRESS
  Subtasks:
    - TASK-003-1: Fix regex validation bug [✅ complete]
    - TASK-003-2: Add null check [⏳ in-progress]
  Files: user-form.tsx, user-form.spec.tsx

## Next Tasks (TODO)

[epic-0002] TASK-001: Create dashboard layout
  Status: TODO (ready to start)

## Recent Standalone Tasks

[task-0042] Fix button border size (2 hours ago) [✅ complete]
  Files: button.css, button.spec.tsx

## Git Status

Branch: feature/user-validation
Uncommitted changes: 5 modified, 2 new
Recent files:
  - apps/client/src/user-form.tsx (15 minutes ago)
  - apps/client/src/user-form.spec.tsx (15 minutes ago)

## Suggestion

Based on the evidence, you were likely working on:
→ **epic-0001 TASK-003 (Add user validation)**

Specifically on subtask TASK-003-2 (Add null check).

Recent file activity in user-form.tsx suggests active work 15 minutes ago.

---

What would you like to work on?
1. Continue with epic-0001 TASK-003 (subtask TASK-003-2)
2. Start epic-0002 TASK-001 (Create dashboard layout)
3. Something else (just tell me)
```

### 5.2 Make Intelligent Suggestion

**Priority order for suggestion:**

1. **IN-PROGRESS subtask** (most specific context)
2. **IN-PROGRESS task** (if no subtask in progress)
3. **Next TODO task** in same epic (logical continuation)
4. **Next TODO task** in any epic (something to start)
5. **Recent standalone task** (if failed, suggest retry)

**Cross-reference:**
- If git branch matches epic pattern (e.g., "feature/user-validation" ≈ epic-0001), boost that epic's priority
- If recent files match task's mentioned files, boost that task's priority

---

## Step 6: Wait for User Choice

After presenting context, wait for user input.

**User might say:**
- "Continue with TASK-003" → Load epic-0001, implement TASK-003
- "Start TASK-001" → Load epic-0002, implement TASK-001
- "Fix the button issue" → Create new standalone task
- "I want to work on something else" → Ask what

**Don't auto-implement.** Let user decide.

---

## Edge Cases

### No Work Found

If no epics, no tasks, no git changes:

```
📊 Work Context Discovery

No active work found.

Options:
1. Create a new epic: /epic "description"
2. Start a quick task: /task "description"
3. See all available commands: /help
```

### Multiple In-Progress Tasks

If multiple tasks are IN-PROGRESS across different epics:

```
⚠️ Multiple tasks in progress detected:

1. [epic-0001] TASK-003: Add user validation (last modified: 15 min ago)
2. [epic-0002] TASK-005: Fix API error handling (last modified: 2 days ago)

Suggestion: Continue with #1 (most recent activity)

Which would you like to work on?
```

**Use file modification times to rank by recency.**

### Failed Standalone Task

If recent task has `status: failed`:

```
⚠️ Recent failed task detected:

[task-0042] Fix button border size (2 hours ago) [❌ failed]
  Error: Type check failed in button.spec.tsx

Suggestion: Retry this task?
```

---

## Critical Rules

**ALWAYS:**

- ✅ Scan all epics for context
- ✅ Check last 48 hours of standalone tasks
- ✅ Include git status (if git repo)
- ✅ Cross-reference files with tasks
- ✅ Make intelligent suggestion based on evidence
- ✅ Wait for user confirmation before acting

**NEVER:**

- ❌ Create state files
- ❌ Write to any files (read-only operation)
- ❌ Auto-start work (present context only)
- ❌ Assume user wants the suggestion (always ask)

---

## Performance Notes

**Expected scanning time:**
- Epics: ~50ms per epic (assuming 1-5 epics)
- Tasks: ~100ms (find + read top 5)
- Git: ~50ms
- Files: ~100ms

**Total:** <500ms for typical setup

**This is fast enough.** No caching needed.

---

**Now execute workflow.**
