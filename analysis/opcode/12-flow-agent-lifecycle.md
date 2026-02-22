# Flow: Agent Lifecycle (Create → Execute → Review)

> The complete journey of creating, configuring, running, and reviewing a custom AI agent.

---

## Flow Diagram

```
┌────────────┐    ┌──────────────┐    ┌───────────────┐    ┌──────────────┐
│ Agent List  │───►│ Create/Edit  │───►│ Execute Agent │───►│ View Results │
│ (Browse)    │    │  Agent Form  │    │ (Select Proj) │    │  (Metrics)   │
└─────┬──────┘    └──────────────┘    └───────────────┘    └──────────────┘
      │                                                           │
      │◄──────────────────────────────────────────────────────────┘
      │
      ├───► Import from GitHub
      ├───► Import from File
      └───► Export to File
```

---

## Step 1: Browse Agents

**User sees**: Grid of agent cards (3 columns, paginated)

**Each card shows**:
- Icon (mapped from icon name: bot, shield, code, terminal, etc.)
- Agent name
- Model badge (Sonnet/Opus)
- Truncated system prompt preview
- Edit / Delete / Execute buttons

**Backend calls**:
- `api.listAgents()` → Returns all agents from SQLite

**UI details**:
- Pagination: 9 agents per page (3x3 grid)
- Empty state: "No agents yet. Create your first agent."
- Search/filter not implemented (could be added)

---

## Step 2: Create Agent

**User action**: Clicks "Create Agent" button

**User sees**: Form with fields:

| Field | Type | Required | Default |
|-------|------|----------|---------|
| Name | Text input | Yes | - |
| Icon | Icon picker (12 options) | Yes | "bot" |
| System Prompt | Large textarea | Yes | - |
| Default Task | Text input | No | - |
| Model | Select (Sonnet/Opus) | Yes | "sonnet" |

**Icon picker options**: bot, code, terminal, database, globe, shield, file-text, git-branch, search, zap, brain, wrench

**Form submission**:
1. Validate: name and system_prompt not empty
2. `api.createAgent({ name, icon, system_prompt, default_task, model })`
3. Agent created in SQLite with auto-increment ID
4. Navigate back to agent list (refreshed)
5. Toast: "Agent created successfully"

**Backend**: Inserts row into `agents` table with `created_at` = now.

---

## Step 3: Edit Agent

**User action**: Clicks edit button on agent card

**Flow**: Same form as Create, pre-populated with existing values.

**Backend**: `api.updateAgent(agentId, { name, icon, system_prompt, default_task, model })`

Updates `agents` row, sets `updated_at` = now.

---

## Step 4: Execute Agent

**User action**: Clicks "Run" button on agent card or from agent detail view

**Step 4a: Select Project**

**User sees**: Project directory picker
1. File picker modal opens (same as session flow)
2. User navigates to and selects project directory
3. Project path stored for execution

**Step 4b: Configure Execution**

**User sees**: Execution panel with:
- Agent info header (name, icon, model)
- Task input (pre-filled with `default_task` if set)
- Model override selector
- "Start" button

**Step 4c: Execute**

**What happens on "Start"**:
```
1. api.executeAgent(agentId, projectPath, task, model)
   │
   ▼
2. Backend creates agent_runs record (status='pending')
   Returns runId
   │
   ▼
3. Backend builds Claude command:
   claude -p "{system_prompt}\n\nTask: {task}"
          --model {model}
          --output-format stream-json
          --verbose
          --dangerously-skip-permissions
   │
   ▼
4. Backend spawns process via ProcessRegistry
   Updates agent_runs: status='running', pid=X
   │
   ▼
5. Frontend sets up event listeners:
   - agent-output:{runId}
   - agent-error:{runId}
   - agent-complete:{runId}
   │
   ▼
6. Stream begins (same JSONL format as sessions)
```

**User sees during execution**:
- Messages streaming in real-time
- Elapsed time counter (updates every second)
- Token counter (cumulative)
- Status badge: "Running" (with pulse animation)
- Stop button to cancel

---

## Step 5: Monitor Execution

**User sees**: Live output panel

**Execution Control Bar shows**:
- Play/Stop toggle
- Status: Running / Completed / Failed / Cancelled
- Elapsed time: "2m 34s"
- Tokens: "15,234"
- Copy output button

**Output rendering**: Same as session messages (virtualized list, syntax highlighting, tool widgets)

**Cancel flow**:
1. User clicks Stop
2. `api.killAgentSession(runId)` called
3. Backend sends SIGTERM → waits 5s → SIGKILL
4. Updates agent_runs: status='cancelled', completed_at=now
5. Frontend receives `agent-complete:{runId}` event
6. Status badge changes to "Cancelled"

---

## Step 6: Completion & Metrics

**On completion event**:
1. Backend parses session JSONL for metrics:
   - Duration (first timestamp → last timestamp)
   - Total tokens (sum of all usage entries)
   - Message count
   - Cost (tokens × model pricing)
2. Updates agent_runs: status='completed', completed_at=now
3. Frontend fetches final metrics: `api.getAgentRunWithRealTimeMetrics(runId)`

**User sees**:
- Status: "Completed" (green badge)
- Final metrics card:
  - Duration: "3m 12s"
  - Tokens: "23,456"
  - Cost: "$0.07"
  - Messages: "45"

---

## Step 7: Review Past Runs

**User action**: Navigates to agent runs history

**User sees**: Paginated list (5 per page)

**Each run shows**:
- Agent name + icon
- Task (truncated)
- Date/time
- Duration
- Token count
- Status badge
- Click to view full output

**Backend**: `api.listAgentRunsWithMetrics()` → Returns runs with computed metrics

**View full output**:
1. Click on run → `api.loadAgentSessionHistory(sessionId, projectPath)`
2. Full message history loaded
3. Same rendering as live execution (but not streaming)

---

## Step 8: Import/Export Agents

### Export

**User action**: Clicks export on agent card

**What happens**:
1. `api.exportAgent(agentId)` → Returns `.opcode.json` content
2. Save dialog opens (native file picker)
3. File saved to user-chosen location

**Export format**:
```json
{
  "version": 1,
  "exported_at": "2024-01-15T10:30:00Z",
  "agent": {
    "name": "Security Scanner",
    "icon": "shield",
    "model": "opus",
    "system_prompt": "You are a security expert...",
    "default_task": "Review the codebase"
  }
}
```

### Import from File

**User action**: Clicks "Import" → selects `.opcode.json` file

**What happens**:
1. File dialog opens (filtered to .json)
2. `api.importAgentFromFile(filePath)` called
3. Backend parses JSON, validates schema
4. Creates new agent in database
5. Agent list refreshed

### Import from GitHub

**User action**: Clicks "Browse GitHub Agents"

**User sees**: `GitHubAgentBrowser` component
1. Fetches agent files from GitHub repository
2. Shows list of available agents with previews
3. User selects agent → `api.importAgentFromGitHub(url)` called
4. Agent created locally from GitHub JSON

---

## Step 9: Delete Agent

**User action**: Clicks delete on agent card

**Flow**:
1. Confirmation dialog: "Delete agent '{name}'? This cannot be undone."
2. User confirms
3. `api.deleteAgent(agentId)` called
4. Agent removed from database (agent_runs preserved for history)
5. Agent list refreshed
6. Toast: "Agent deleted"
