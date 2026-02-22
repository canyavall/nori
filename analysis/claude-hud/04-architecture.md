# claude-hud - Architecture

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Claude Code (invokes every ~300ms)                       │
│  Pipes session JSON via stdin                             │
└─────────────────────┬────────────────────────────────────┘
                      │ stdin JSON
                      ▼
┌──────────────────────────────────────────────────────────┐
│  claude-hud (src/index.ts) — Orchestrator                 │
│                                                           │
│  1. readStdin() → model, tokens, context, transcript_path │
│  2. parseTranscript(path) → tools, agents, todos          │
│  3. countConfigs(cwd) → CLAUDE.md, rules, MCPs, hooks     │
│  4. getGitStatus(cwd) → branch, dirty, ahead/behind       │
│  5. getUsage() → 5h/7d utilization, reset times           │
│  6. getOutputSpeed() → tokens/second                      │
│  7. runExtraCmd() → custom label                          │
│                                                           │
│  Build RenderContext with all collected data               │
│  Call render(ctx)                                          │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│  Renderer (src/render/index.ts)                           │
│                                                           │
│  if (expanded layout):                                    │
│    Line 1: renderProjectLine()  → Model + Project + Git   │
│    Line 2: renderIdentityLine() → Context bar              │
│            renderUsageLine()    → Usage bar                │
│    Line 3: renderToolsLine()    → Tool activity (opt-in)   │
│    Line 4: renderAgentsLine()   → Agent status (opt-in)    │
│    Line 5: renderTodosLine()    → Todo progress (opt-in)   │
│                                                           │
│  if (compact layout):                                     │
│    Single line: renderSessionLine() → all-in-one           │
└─────────────────────┬────────────────────────────────────┘
                      │ stdout (ANSI-colored text)
                      ▼
┌──────────────────────────────────────────────────────────┐
│  Claude Code statusline display                           │
└──────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── index.ts                    # Entry point: orchestrates data collection + render
├── stdin.ts                    # Parse Claude Code stdin JSON
├── transcript.ts               # Parse transcript JSONL (tools/agents/todos)
├── config.ts                   # Load/validate user config from JSON
├── config-reader.ts            # Count CLAUDE.md, rules, MCPs, hooks
├── git.ts                      # Git status (branch, dirty, ahead/behind, stats)
├── usage-api.ts                # Fetch OAuth usage from Anthropic API
├── speed-tracker.ts            # Calculate output token speed
├── types.ts                    # TypeScript interfaces
├── debug.ts                    # Debug logging to stderr
├── extra-cmd.ts                # Execute arbitrary commands for custom labels
├── constants.ts                # Autocompact buffer constant (22.5%)
├── render/
│   ├── index.ts                # Main render coordinator (layout selection)
│   ├── colors.ts               # ANSI color helpers + bar renderers
│   ├── session-line.ts         # Compact layout: all-in-one line
│   ├── tools-line.ts           # Tool activity (spinner + counts)
│   ├── agents-line.ts          # Agent status (running/completed)
│   ├── todos-line.ts           # Todo progress (in-progress/complete)
│   └── lines/
│       ├── index.ts            # Barrel export
│       ├── project.ts          # Line 1: model + project + git
│       ├── identity.ts         # Line 2a: context bar
│       ├── usage.ts            # Line 2b: usage bar
│       └── environment.ts      # Config counts (opt-in)
└── .claude-plugin/
    └── plugin.json             # Plugin metadata for marketplace
```

## Data Sources & Flow

```
┌─────────────────────────────┐
│  stdin JSON (from Claude)    │
│  {                           │
│    model: { id, display },   │
│    context_window: {         │
│      size, current_usage: {  │
│        input, output,        │
│        cache_creation,       │
│        cache_read            │
│      },                      │
│      used_percentage         │
│    },                        │
│    transcript_path,          │
│    cwd                       │
│  }                           │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐     ┌─────────────────────────────┐
│  Transcript JSONL            │     │  Git CLI (1s timeout)       │
│  (session file, line-by-line)│     │                             │
│                              │     │  git rev-parse --abbrev-ref │
│  Extracts:                   │     │  git status --porcelain     │
│  - tool_use blocks (running) │     │  git rev-list --left-right  │
│  - tool_result (completed)   │     │                             │
│  - Task blocks (agents)      │     │  Returns:                   │
│  - TodoWrite/TaskCreate      │     │  branch, dirty, ahead,      │
│  - Session start timestamp   │     │  behind, file stats          │
│                              │     │                             │
│  Limits: 20 tools, 10 agents│     │                             │
└──────────┬──────────────────┘     └──────────┬──────────────────┘
           │                                    │
           ▼                                    ▼
┌─────────────────────────────┐     ┌─────────────────────────────┐
│  Anthropic OAuth API         │     │  Settings Files              │
│  (cached 60s)                │     │                             │
│                              │     │  ~/.claude/settings.json     │
│  Credentials:                │     │  ~/.claude/CLAUDE.md         │
│  1. macOS Keychain (v2.x)   │     │  {cwd}/.claude/settings.json │
│  2. ~/.claude/.credentials   │     │  {cwd}/CLAUDE.md             │
│                              │     │  {cwd}/.mcp.json             │
│  GET /api/oauth/usage        │     │                             │
│  → 5h%, 7d%, reset times    │     │  Counts:                     │
│  → subscription type         │     │  CLAUDE.md, rules, MCPs,     │
│                              │     │  hooks                       │
│  Backoff: 60s on failure     │     │                             │
└──────────┬──────────────────┘     └──────────┬──────────────────┘
           │                                    │
           └──────────┬─────────────────────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  RenderContext        │
           │  {                   │
           │    stdin,            │
           │    tools, agents,    │
           │    todos,            │
           │    git,              │
           │    usage,            │
           │    config,           │
           │    configCounts,     │
           │    speed,            │
           │    sessionDuration,  │
           │    extraLabel        │
           │  }                   │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  Render Pipeline      │
           │                       │
           │  Colors:              │
           │  green  < 70% ctx     │
           │  yellow 70-85% ctx    │
           │  red    > 85% ctx     │
           │                       │
           │  blue   < 75% quota   │
           │  magenta 75-89%       │
           │  red    >= 90%        │
           │                       │
           │  Bars: █ filled       │
           │        ░ empty        │
           │                       │
           │  Icons: ◐ running     │
           │         ✓ completed   │
           │         ▸ in-progress │
           └──────────────────────┘
```

## Caching Strategy

```
┌─────────────────────────────────────────┐
│  Usage API Cache                         │
│  ~/.claude/plugins/claude-hud/           │
│    .usage-cache.json                     │
│    TTL: 60s success, 15s failure         │
│                                          │
│  Keychain Backoff                        │
│    .keychain-backoff                     │
│    Duration: 60s after failure           │
│    Prevents repeated macOS prompts       │
│                                          │
│  Speed Cache                             │
│    .speed-cache.json                     │
│    Stores: previous output_tokens + ts   │
│    Calculates: delta / time = tok/s      │
│    Window: only within 2000ms            │
└─────────────────────────────────────────┘
```

## Configuration Presets

```
Full:
  expanded | all git | all display | tools + agents + todos

Essential:
  expanded | git + dirty | context + usage | tools + agents + todos

Minimal:
  compact | git + dirty | context only | no activity lines
```
