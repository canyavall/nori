# claude-hud - Use Cases

## Primary Use Cases

### 1. Context Window Awareness
**Who**: Any Claude Code user who runs long sessions.
**What**: Always-visible color-coded progress bar showing how much context window is consumed, with warnings at 70% and 85%.
**Value**: Prevents the surprise of hitting context limits mid-task. Users can proactively compact or start new sessions.

### 2. API Usage Limit Monitoring
**Who**: Pro/Max/Team subscribers with rate limits.
**What**: Shows 5-hour and 7-day usage percentages with reset time countdowns, fetched from Anthropic's OAuth API.
**Value**: Know when you're approaching limits before hitting them. Plan work around reset windows.

### 3. Tool Activity Visibility
**Who**: Users running complex multi-tool operations.
**What**: Shows which tools are currently running (Read, Write, Edit, Bash, Grep, Glob) with target file/pattern and aggregated completion counts.
**Value**: Understand what Claude is doing in real-time without scrolling through the conversation.

### 4. Agent Progress Monitoring
**Who**: Users running subagents (explore, plan, etc.).
**What**: Shows running agents with type, model, description, and elapsed time. Shows recently completed agents.
**Value**: Track parallel work without losing context. Know when background agents finish.

### 5. Git Status at a Glance
**Who**: Any developer working in a git repository.
**What**: Branch name, dirty indicator, ahead/behind counts, file modification stats — all visible without running `git status`.
**Value**: Constant awareness of git state during AI-assisted coding sessions.

### 6. Todo/Task Progress
**Who**: Users working on multi-step tasks with TodoWrite or TaskCreate.
**What**: Shows current in-progress task and completion progress (e.g., "Fix auth bug (2/5)").
**Value**: Track overall task progress without scrolling back to find the task list.

## Secondary Use Cases

### 7. Model & Plan Awareness
Shows current model and subscription plan. Useful when switching between models to confirm which one is active.

### 8. Project Configuration Overview
Shows counts of CLAUDE.md files, rules, MCPs, and hooks. Quick check that your project is configured correctly.

### 9. Session Duration Tracking
Shows how long the current session has been running. Useful for timeboxing work sessions.

### 10. Output Speed Monitoring
Shows output token speed (tok/s). Useful for detecting when the API is slow or overloaded.

### 11. Custom Labels via Extra Commands
Execute arbitrary commands to add custom labels to the HUD (e.g., `git describe --tags` to show current version).

## Limitations

- **Claude Code only**: Plugin architecture tied to Claude Code's statusline API
- **macOS Keychain**: OAuth usage feature requires macOS Keychain access for Claude Code 2.x credentials
- **Read-only**: Cannot control or modify Claude Code behavior, only displays information
- **Refresh rate**: Limited by Claude Code's ~300ms invocation interval
- **No persistence**: HUD state resets between sessions (no historical data)
- **ANSI terminal required**: Colors and symbols may not display correctly in all terminals
