# Project Selector - First Screen

## Ticket Quality Assessment

**Domain Detected**: none
**Business Context**: ✅ Complete
**Technical Clarity**: ⚠️ Partial

**Missing Information**:
- UI framework/library preferences (terminal UI vs web UI)
- User settings storage location (OS-specific app data vs config file)
- Project validation rules beyond .nori folder existence
- Error handling for invalid/corrupted .nori folders

## Scope

### In-Scope

- **Apps**: TBD (need to discover existing Nori app structure)
- **Features**:
  - Project selector screen (first screen on app launch)
  - Create new project flow (folder picker + .nori initialization)
  - Open existing project flow (from stored project list)
  - .nori folder structure initialization (.settings, knowledge/, debug/)
  - User settings persistence for project list
  - Terminal/chat session opening in selected project context

### Out-of-Scope

- Actual terminal/chat implementation
- Knowledge system functionality beyond folder structure
- Debug mode implementation beyond folder creation
- Project migration or import from other systems
- Multi-workspace or workspace switching

### Verification Needed

- [ ] What UI framework is Nori using? (Ink for terminal, Electron/Tauri for desktop, web-based?)
- [ ] Where should user settings be stored? (OS app data, project root, home directory?)
- [ ] What happens if user selects a folder that already has .nori but with invalid structure?

## What

Build a project selector as the initial screen when launching Nori. Users can either create a new project by selecting a folder (which initializes .nori structure) or open an existing project from a stored list. The app maintains a persistent list of projects and opens the terminal/chat in the selected project's context with its settings loaded.

## Why

Nori needs project-level isolation similar to Claude Code and OpenCode, where each project has its own configuration (.settings), knowledge base (knowledge/), and debug data (debug/). This provides users with a clear entry point and project management capability.

## Acceptance Criteria

- [ ] On app launch, project selector screen appears first
- [ ] User can create new project by selecting a folder via folder picker
- [ ] Creating new project initializes .nori folder with .settings file, knowledge/ and debug/ subdirectories
- [ ] User can select existing project from a list of previously created/opened projects
- [ ] Selected project's path and settings are loaded into app context
- [ ] Project list persists across app restarts
- [ ] Selecting a project opens terminal/chat in that project's context
- [ ] .nori folder structure matches specification (.nori/.settings, .nori/knowledge/, .nori/debug/)

## Notes

- Emulating .claude (Claude Code) and .opencode (OpenCode) project structure patterns
- Project selection affects global app context (working directory, settings, knowledge base)
