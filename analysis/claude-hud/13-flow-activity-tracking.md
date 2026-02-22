# Flow: Activity Tracking

> How tools, agents, and todos are tracked from transcript data.

---

## Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Transcript  │────►│  Parse Lines │────►│  Match &     │────►│  Render      │
│  JSONL File  │     │  (readline)  │     │  Aggregate   │     │  Activity    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Journey 1: Tool Activity Tracking

### Data Source
Transcript JSONL file (path from stdin's `transcript_path`).

### Parsing
For each line in the transcript:

**tool_use blocks** → Tool started:
```json
{
  "type": "assistant",
  "content": [{
    "type": "tool_use",
    "id": "toolu_abc123",
    "name": "Edit",
    "input": { "file_path": "/Users/me/project/src/auth.ts" }
  }]
}
```
→ Record: `{ id: "toolu_abc123", name: "Edit", target: "auth.ts", status: "running", startTime }`

**tool_result blocks** → Tool completed:
```json
{
  "type": "user",
  "content": [{
    "type": "tool_result",
    "tool_use_id": "toolu_abc123"
  }]
}
```
→ Match by ID, set `status: "completed"`, record `endTime`, calculate duration.

### Target Extraction by Tool Name
```
Read/Write/Edit → input.file_path → "auth.ts"
Glob            → input.pattern   → "**/*.ts"
Grep            → input.pattern   → "function auth"
Bash            → input.command   → "npm test" (first 30 chars)
```

### Rendering

**Running tools** (up to 2 most recent):
```
◐ Edit: auth.ts | ◐ Read: config.ts
```
- `◐` = spinner icon (yellow)
- Tool name in cyan
- Target path in dim (truncated to 20 chars: `.../{filename}`)

**Completed tools** (up to 4 most-used):
```
✓ Read ×3 | ✓ Grep ×2 | ✓ Edit ×1
```
- `✓` = checkmark (green)
- Aggregated by name with count
- Sorted by count (most-used first)

**Combined output**:
```
◐ Edit: auth.ts | ✓ Read ×3 | ✓ Grep ×2
```

### Limits
- Returns latest 20 tools (memory efficiency)
- Running tools: show up to 2
- Completed tools: show up to 4 most-used

---

## Journey 2: Agent Monitoring

### Data Source
Same transcript JSONL. Agents are `Task` tool_use blocks.

### Parsing
**Task tool_use blocks** → Agent started:
```json
{
  "content": [{
    "type": "tool_use",
    "name": "Task",
    "input": {
      "subagent_type": "explore",
      "model": "haiku",
      "description": "Finding auth code"
    }
  }]
}
```
→ Record: `{ type: "explore", model: "haiku", description: "Finding auth code", status: "running", startTime }`

**Task tool_result** → Agent completed:
→ Match by ID, set `status: "completed"`, calculate duration.

### Rendering

**Running agents**:
```
◐ explore [haiku]: Finding auth code (2m 15s)
```
- `◐` = spinner (yellow)
- Agent type in magenta
- Model in dim brackets
- Description truncated to 40 chars
- Elapsed time in dim

**Completed agents**:
```
✓ explore [haiku]: Finding auth code (1m 30s)
```
- `✓` = checkmark (green)

### Elapsed Time Format
```
< 1s:   "<1s"
< 60s:  "45s"
≥ 60s:  "2m 15s"
≥ 3600s: "1h 5m"
```

### Display Rules
- Show all running agents
- Show up to 2 most recent completed agents
- Hidden if no agents exist
- Only visible when `showAgents: true` in config

---

## Journey 3: Todo Progress

### Data Source
Same transcript JSONL. Todos from `TodoWrite`, `TaskCreate`, `TaskUpdate` blocks.

### Parsing

**TodoWrite blocks** (older format):
```json
{
  "content": [{
    "type": "tool_use",
    "name": "TodoWrite",
    "input": {
      "todos": [
        { "content": "Fix auth bug", "status": "in_progress" },
        { "content": "Add tests", "status": "pending" },
        { "content": "Update docs", "status": "completed" }
      ]
    }
  }]
}
```

**TaskCreate blocks** (newer format):
```json
{
  "content": [{
    "type": "tool_use",
    "name": "TaskCreate",
    "input": {
      "subject": "Fix auth bug",
      "description": "..."
    }
  }]
}
```

**TaskUpdate blocks**:
```json
{
  "content": [{
    "type": "tool_use",
    "name": "TaskUpdate",
    "input": {
      "taskId": "1",
      "status": "completed"
    }
  }]
}
```

### Status Normalization
```
"in_progress" | "in-progress" | "active" → "in_progress"
"completed" | "done" | "finished"         → "completed"
"pending" | "todo" | "open"               → "pending"
```

### Rendering

**In-progress task**:
```
▸ Fix auth bug (2/5)
```
- `▸` = in-progress icon (cyan)
- Current in-progress task content (truncated to 50 chars)
- Progress: `({completed}/{total})`

**All complete**:
```
✓ All todos complete (5/5)
```
- `✓` = checkmark (green)
- Shows when all tasks are completed

**Hidden**: When no todos exist or none are in_progress.

### Only visible when `showTodos: true` in config.

---

## Combined Activity Display

With all three enabled (tools + agents + todos):

```
[Opus | Max] │ my-project git:(main*)
Context █████░░░░░ 45% │ Usage ██░░░░░░░░ 25% (1h 30m / 5h)
──────────────────────────────────────────────────
◐ Edit: auth.ts | ✓ Read ×3 | ✓ Grep ×2
◐ explore [haiku]: Finding auth code (2m 15s)
▸ Fix authentication bug (2/5)
```

With separators enabled (`showSeparators: true`), a dim dashed line appears between the header lines and activity lines.

---

## Activity Line Visibility

| Feature | Config Key | Default | When Shown |
|---------|-----------|---------|------------|
| Tools | `showTools` | `false` | When any tool activity exists |
| Agents | `showAgents` | `false` | When any agent activity exists |
| Todos | `showTodos` | `false` | When any todo exists and at least one is in_progress |

All three are opt-in. They only render when there's actual activity to show (empty lines are suppressed).
