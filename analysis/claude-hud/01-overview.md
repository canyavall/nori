# claude-hud - Project Overview

## What Is It

**claude-hud** is a real-time statusline plugin for Claude Code that provides a heads-up display showing session intelligence — context usage, API quota, active tools, agent status, todo progress, git state, and project information — all rendered as a configurable ANSI-colored display below the Claude Code input.

**Repository**: https://github.com/jarrodwatts/claude-hud
**License**: MIT
**Runtime**: Node.js 18+ (zero dependencies)
**Distribution**: Claude Code plugin marketplace

## What It Does

Claude Code invokes the plugin every ~300ms, piping session data via stdin JSON. The plugin collects data from multiple sources and renders a multi-line (or single-line) display to stdout.

### 1. Context Window Monitoring
- Color-coded progress bar (green < 70%, yellow 70-85%, red > 85%)
- Percentage or token count display
- Token breakdown at high usage (input vs cache tokens)
- Autocompact buffer awareness (reserves 22.5% for Claude's internal use)

### 2. API Usage Limits (Pro/Max/Team)
- 5-hour rolling window utilization percentage
- 7-day utilization (shown when >= 80% threshold)
- Reset time countdowns
- Color-coded by severity (blue < 75%, magenta 75-89%, red >= 90%)
- Fetches from Anthropic OAuth API with file-based caching

### 3. Tool Activity Tracking
- Running tools shown with spinner icon and target file/pattern
- Completed tools aggregated by name with counts
- Parses transcript JSONL for tool_use/tool_result blocks

### 4. Agent Monitoring
- Running subagents with type, model, description, elapsed time
- Completed agents with final duration
- Shows up to 3 agents (running + 2 most recent completed)

### 5. Todo Progress
- Current in-progress task name
- Progress counter (completed/total)
- Captures TodoWrite and TaskCreate/TaskUpdate blocks

### 6. Git Status
- Branch name with dirty indicator (*)
- Ahead/behind upstream counts (optional)
- File stats: modified, added, deleted, untracked (optional, Starship-compatible)

### 7. Project & Model Info
- Current model name in bracket: `[Opus | Max]`
- Plan detection (Pro, Max, Team, API, Bedrock)
- Project path (configurable 1-3 directory levels)
- Config counts: CLAUDE.md files, rules, MCPs, hooks

### 8. Session Duration & Speed
- Elapsed session time
- Output token speed (tokens/second)

## How It Works (High Level)

```
Claude Code (every ~300ms)
    │
    ▼ pipes stdin JSON
claude-hud
    │
    ├── Parse stdin: model, tokens, context window, transcript path
    ├── Read transcript JSONL: tools, agents, todos
    ├── Count configs: CLAUDE.md, rules, MCPs, hooks
    ├── Git status: branch, dirty, ahead/behind, file stats
    ├── Fetch usage: Anthropic OAuth API (cached 60s)
    ├── Speed calc: delta tokens / delta time
    │
    ├── Build RenderContext
    │
    ├── Render (expanded or compact layout)
    │   ├── Line 1: Model + Project + Git
    │   ├── Line 2: Context bar + Usage bar
    │   ├── Line 3: Tools (optional)
    │   ├── Line 4: Agents (optional)
    │   └── Line 5: Todos (optional)
    │
    ▼ stdout
ANSI-colored text → Claude Code statusline
```
