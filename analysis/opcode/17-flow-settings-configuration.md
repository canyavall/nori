# Flow: Settings & Configuration

> The complete journey of configuring the application: themes, Claude binary, hooks, proxy, slash commands, and storage.

---

## Flow Diagram

```
┌──────────────┐
│   Settings   │
│   (Tab)      │
├──────────────┤
│ Theme        │ → Dark / Gray / Light / Custom (with color picker)
│ Claude Binary│ → Auto-detect / Manual path / Version display
│ Hooks        │ → User / Project / Local scope editors
│ Proxy        │ → HTTP/HTTPS proxy configuration
│ Slash Cmds   │ → Custom command management
│ Storage      │ → Database viewer/editor
│ Analytics    │ → Enable/disable telemetry
│ Startup      │ → Show/hide intro animation
└──────────────┘
```

---

## Theme Configuration

**User action**: Opens Settings → Theme section

**Available themes**:
- **Dark** (default) → Dark background, light text
- **Gray** → Medium gray background
- **Light** → White background, dark text
- **Custom** → Full color picker

**Custom theme fields**:
- Background, Foreground, Card, Card Foreground
- Primary, Primary Foreground
- Secondary, Secondary Foreground
- Muted, Muted Foreground
- Accent, Accent Foreground
- Border, Input, Ring

**How it works**:
```
1. User selects theme
2. ThemeContext updates CSS custom properties on <html>
3. api.setSetting('theme', themeName)
4. Also cached in localStorage for instant load
5. For custom: each color saved individually
```

**CSS Variable Injection**:
```css
:root {
  --background: ${colors.background};
  --foreground: ${colors.foreground};
  --primary: ${colors.primary};
  /* ... etc */
}
```

---

## Claude Binary Management

**User sees**:
- Current binary path and version
- List of detected installations (with source labels)
- "Refresh" to re-scan
- "Set Custom Path" for manual entry

**Backend flow**:
```
1. api.listClaudeInstallations()
   → Scans all known locations (see Technical Knowledge §1)
   → Returns: [{ path, version, source, installation_type }]

2. api.checkClaudeVersion()
   → Runs: claude --version
   → Returns: version string

3. api.setClaudeBinaryPath(path)
   → Stores in app_settings table
   → Verified on next use
```

**Installation sources shown**:
- "System (which)" → Found via `which claude`
- "Homebrew" → `/opt/homebrew/bin/claude`
- "NVM" → `~/.nvm/versions/node/*/bin/claude`
- "NPM Global" → `~/.npm-global/bin/claude`
- "Bun" → `~/.bun/bin/claude`
- "Custom" → User-specified path

---

## Hooks Editor

**User action**: Opens Settings → Hooks section

**User sees**: Three-scope tab interface

### Scope Tabs
| Scope | File | Applies To |
|-------|------|-----------|
| User | `~/.claude/settings.json` | All projects |
| Project | `{project}/.claude/settings.json` | Shared in repo |
| Local | `{project}/.claude/settings.local.json` | This machine only |

### Editor
- JSON textarea for hooks configuration
- "Validate" button → runs `bash -n -c` on each command
- "Save" button → writes to scope file
- Syntax highlighting (optional)

### Hook Format
```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "command",
          "command": "echo 'About to run bash'"
        }
      ]
    }
  ],
  "PostToolUse": [...],
  "Notification": [...]
}
```

### Hook Events
- **PreToolUse** → Before any tool executes
- **PostToolUse** → After any tool executes
- **Notification** → On specific notifications

### Matcher Types
Match on tool name: "Bash", "Read", "Write", "Edit", "Glob", "Grep", etc.

---

## Proxy Configuration

**User action**: Opens Settings → Proxy section

**User sees**: Form with fields:

| Field | Type | Example |
|-------|------|---------|
| HTTP Proxy | URL input | `http://proxy.company.com:8080` |
| HTTPS Proxy | URL input | `https://proxy.company.com:8443` |
| No Proxy | Comma-separated | `localhost,127.0.0.1,.internal.com` |
| All Proxy | URL input | `socks5://proxy.company.com:1080` |

**How it works**:
```
1. User fills in proxy fields
2. api.saveProxySettings(settings)
3. Backend stores in app_settings table (plaintext)
4. On every Claude process spawn:
   - Set HTTP_PROXY, HTTPS_PROXY, NO_PROXY, ALL_PROXY env vars
   - localhost always added to NO_PROXY
```

---

## Slash Command Management

**User action**: Opens Settings → Slash Commands (or via project settings)

**User sees**: List of custom slash commands for the project

**Each command shows**:
- Name (e.g., `/deploy`)
- Namespace (optional grouping)
- Description
- Content preview

### Create/Edit Command

**User sees**: Form with:
| Field | Type | Notes |
|-------|------|-------|
| Name | Text | Must start with `/` |
| Namespace | Text | Optional grouping |
| Content | Markdown textarea | The command body |
| Description | Text | Short description |
| Allowed Tools | Multi-select | Which Claude tools can be used |

**Backend calls**:
```
api.slashCommandsList(projectPath) → List commands
api.slashCommandSave(scope, name, namespace, content, description, allowedTools, projectPath) → Save
api.slashCommandGet(name, projectPath) → Read single command
api.slashCommandDelete(name, projectPath) → Delete
```

**Storage**: Slash commands stored as markdown files with YAML frontmatter in project's `.claude/` directory.

---

## Storage Browser (Admin)

**User action**: Opens Settings → Storage tab

**User sees**: Database table viewer

### Available Operations
1. **List Tables** → `api.storageListTables()` → Shows all SQLite tables
2. **Read Table** → `api.storageReadTable(tableName, page, pageSize, search)` → Paginated rows
3. **Insert Row** → `api.storageInsertRow(tableName, data)` → Add new record
4. **Update Row** → `api.storageUpdateRow(tableName, rowId, data)` → Modify record
5. **Delete Row** → `api.storageDeleteRow(tableName, rowId)` → Remove record
6. **Execute SQL** → `api.storageExecuteSql(sql)` → Run arbitrary query
7. **Reset Database** → `api.storageResetDatabase()` → Drop and recreate all tables

**UI**:
- Table selector dropdown
- Paginated data grid
- Search filter
- Row editor (click to edit inline)
- SQL console textarea

**Security note**: This exposes full database access. In a production app, this should be gated behind an admin mode or removed entirely.

---

## Analytics Consent

**User action**: Opens Settings → Analytics section

**User sees**: Toggle switch

- **Enabled**: PostHog analytics active, events sent with PII sanitization
- **Disabled**: No tracking, no events, PostHog not initialized

**How consent works**:
```
1. On first launch: analytics disabled by default
2. User toggles on: localStorage.setItem('analytics_consent', 'true')
3. PostHog initialized with consent
4. Events batched (flush every 5 seconds)
5. User toggles off: PostHog shutdown, future events discarded
```

---

## Startup Intro Toggle

**User action**: Opens Settings → toggle "Show startup animation"

**How it works**:
```
1. api.setSetting('startup_intro_enabled', 'true' | 'false')
2. Also cached in localStorage for instant read on next launch
3. On app mount: check localStorage first, then async check setting
4. If enabled: show StartupIntro overlay for 2 seconds
5. If disabled: skip overlay entirely
```
