# Flow: Project & Session Management

> The complete journey of discovering, browsing, and managing projects and their sessions.

---

## Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Project     │────►│  Session     │────►│  Resume Session   │
│  List        │     │  List        │     │  (in new tab)     │
│  (Browse)    │     │  (History)   │     │                   │
└──────┬───────┘     └──────┬───────┘     └──────────────────┘
       │                    │
       ├───► Open Directory │───► Edit CLAUDE.md
       └───► Search         └───► View Session Details
```

---

## Step 1: Browse Projects

**User action**: Navigates to Projects view (from welcome screen or tab)

**What happens**:
```
1. api.listProjects()
   │
   ▼
2. Backend:
   a. Read ~/.claude/projects/ directory
   b. For each subdirectory:
      - Decode name (- → /) to get original project path
      - Count .jsonl files (= session count)
      - Get latest session modification time
   c. Return list sorted by last activity
   │
   ▼
3. Frontend renders ProjectList component
```

**User sees**: Scrollable list of project cards

**Each project card shows**:
- Project name (last path segment)
- Full path (muted, smaller text)
- Session count badge
- Last activity date
- Click to open → loads session list

**Additional actions**:
- "Open Directory" button → Opens native file picker to add new project
- Search input → Filters projects by name/path (client-side)

---

## Step 2: Open New Project Directory

**User action**: Clicks "Open Directory" button

**What happens**:
```
1. api.getHomeDirectory() → Get user home path
2. Show FilePicker modal starting at home directory
3. User navigates filesystem:
   - Each directory click: api.listDirectoryContents(path)
   - Shows folders and files with icons
   - Breadcrumb navigation at top
4. User selects a directory
5. api.createProject(selectedPath)
   │
   ▼
6. Backend:
   a. Encode path (/ → -)
   b. Create directory: ~/.claude/projects/{encoded_path}/
   c. Return Project object
   │
   ▼
7. Frontend:
   - Close file picker
   - Refresh project list
   - Auto-navigate to new project's session list
```

---

## Step 3: View Session List

**User action**: Clicks on a project card

**What happens**:
```
1. api.getProjectSessions(projectId)
   │
   ▼
2. Backend:
   a. List all .jsonl files in ~/.claude/projects/{encoded_path}/
   b. For each file:
      - Session ID = filename without .jsonl extension
      - Read first 10 lines to extract:
        - First user message (skip system/caveat messages)
        - Timestamp of first message
        - cwd (working directory)
      - Get file modification time
   c. Return sessions sorted by most recent first
   │
   ▼
3. Frontend renders SessionList component
```

**User sees**: List of session cards

**Each session card shows**:
- First user message (as title, truncated)
- Timestamp
- Session ID (muted, truncated)
- Resume button → Opens session in new tab
- Delete button (with confirmation)

**Back navigation**: Arrow button returns to project list

---

## Step 4: Resume Session

**User action**: Clicks "Resume" on a session card

**What happens**:
```
1. TabContext.addTab({
     type: 'chat',
     title: session.firstMessage,
     sessionId: session.id,
     sessionData: session
   })
2. ClaudeCodeSession mounts with session data
3. api.loadSessionHistory(sessionId, projectId)
   │
   ▼
4. Backend:
   a. Read ~/.claude/projects/{encoded_path}/{sessionId}.jsonl
   b. Parse each line as JSON
   c. Return array of message objects
   │
   ▼
5. Frontend:
   - Populate messages[] with history
   - Set claudeSessionId = sessionId
   - Set projectPath from session data
   - Register event listeners for this session
   - Ready for new prompts (will use resumeClaudeCode)
```

---

## Step 5: CLAUDE.md Management

**User action**: Clicks "Edit CLAUDE.md" in project context

**Discovery**:
```
1. api.findClaudeMdFiles(projectPath)
   │
   ▼
2. Backend:
   a. Walk project directory recursively
   b. Find all files named "CLAUDE.md" (case-sensitive)
   c. Return list with paths and sizes
   │
   ▼
3. Frontend shows list of found CLAUDE.md files
```

**Editing**:
```
1. User selects a CLAUDE.md file
2. api.readClaudeMdFile(filePath)
   │
   ▼
3. ClaudeFileEditor component opens:
   - Split view: editor on left, preview on right
   - Editor: @uiw/react-md-editor (markdown editor)
   - Preview: react-markdown with remark-gfm
   - Syntax highlighting for code blocks
4. User edits content
5. On save: api.saveClaudeMdFile(filePath, content)
   │
   ▼
6. Backend writes file to disk
7. Toast: "CLAUDE.md saved"
```

---

## Step 6: Project Settings

**User action**: Clicks settings icon on a project

**User sees**: ProjectSettings component with:

### Hooks Configuration
- Three scope tabs: User / Project / Local
- User scope: `~/.claude/settings.json`
- Project scope: `{project}/.claude/settings.json`
- Local scope: `{project}/.claude/settings.local.json`
- JSON editor for hooks configuration
- Validate button (runs `bash -n -c` syntax check)
- Save button

### Claude Version
- Current binary path and version
- List of detected installations
- Select preferred installation

### MCP Servers (Project-Scoped)
- Add/remove MCP servers for this project
- Import from Claude Desktop config

**Backend calls**:
- `api.getHooksConfig(scope, projectPath)` → Read hooks
- `api.updateHooksConfig(scope, hooks, projectPath)` → Write hooks
- `api.validateHookCommand(command)` → Syntax check
- `api.mcpReadProjectConfig(projectPath)` → Read project MCP config
- `api.mcpSaveProjectConfig(projectPath, config)` → Save project MCP config

---

## Step 7: Delete Session

**User action**: Clicks delete icon on session card

**Flow**:
1. Confirmation dialog: "Delete this session? This cannot be undone."
2. User confirms
3. Backend removes `.jsonl` file and associated `.timelines/` directory
4. Session list refreshes
5. Toast: "Session deleted"
