# Flow: Bubble Tea TUI Architecture

> The complete architecture of the terminal user interface: pages, components, dialogs, keybindings, and rendering.

---

## Architecture Overview

```
+--------------------------------------------------------------------+
|                        appModel (root)                              |
|                                                                     |
|  +---------------------------+    +------------------------------+  |
|  |      Active Page          |    |     Dialog Overlays          |  |
|  |                           |    |                              |  |
|  |  +-- ChatPage ----------+ |    |  +-- PermissionDialog      |  |
|  |  |  +-- Editor         | |    |  +-- HelpDialog            |  |
|  |  |  +-- MessageList    | |    |  +-- QuitDialog            |  |
|  |  |  +-- Sidebar        | |    |  +-- SessionDialog         |  |
|  |  +----------------------+ |    |  +-- CommandDialog         |  |
|  |                           |    |  +-- ModelDialog           |  |
|  |  +-- LogsPage ----------+ |    |  +-- InitDialog           |  |
|  |  |  +-- LogTable       | |    |  +-- FilepickerDialog      |  |
|  |  |  +-- LogDetails     | |    |  +-- ThemeDialog           |  |
|  |  +----------------------+ |    |  +-- MultiArgsDialog       |  |
|  +---------------------------+    +------------------------------+  |
|                                                                     |
|  +---------------------------------------------------------------+  |
|  |                     StatusBar                                  |  |
|  +---------------------------------------------------------------+  |
+--------------------------------------------------------------------+
```

---

## Step 1: Root Model (appModel)

The root model manages:
- **Pages**: Two pages (Chat, Logs) with lazy initialization
- **Dialogs**: 11 dialog overlays, each with a boolean visibility flag
- **Status bar**: Info/warn/error messages with TTL
- **Global keybindings**: Ctrl+C, Ctrl+L, Ctrl+A, Ctrl+K, Ctrl+O, Ctrl+T, Ctrl+F, Ctrl+?, Esc

### State Management
```go
type appModel struct {
    width, height   int
    currentPage     page.PageID
    pages           map[page.PageID]tea.Model
    loadedPages     map[page.PageID]bool
    status          core.StatusCmp
    app             *app.App

    // 11 dialog visibility flags
    showPermissions          bool
    showHelp                 bool
    showQuit                 bool
    showSessionDialog        bool
    showCommandDialog        bool
    showModelDialog          bool
    showInitDialog           bool
    showFilepicker           bool
    showThemeDialog          bool
    showMultiArgumentsDialog bool
    isCompacting             bool

    // Dialog models
    permissions          dialog.PermissionDialogCmp
    help                 dialog.HelpCmp
    quit                 dialog.QuitDialog
    sessionDialog        dialog.SessionDialog
    commandDialog        dialog.CommandDialog
    modelDialog          dialog.ModelDialog
    initDialog           dialog.InitDialogCmp
    filepicker           dialog.FilepickerCmp
    themeDialog          dialog.ThemeDialog
    multiArgumentsDialog dialog.MultiArgumentsDialogCmp

    commands          []dialog.Command
    selectedSession   session.Session
}
```

---

## Step 2: Message Flow (Bubble Tea Elm Architecture)

```
tea.Msg arrives
    |
    v
appModel.Update(msg)
    |
    +-- Is it a global key? (Ctrl+C, Ctrl+L, etc.)
    |   YES -> Handle at root level
    |
    +-- Is a dialog visible?
    |   YES -> Route to dialog's Update()
    |          If it's a KeyMsg, BLOCK propagation to page
    |
    +-- Is it a pubsub event?
    |   YES -> Handle (permission request, session update, agent event)
    |
    +-- Otherwise
        -> Route to current page's Update()
        -> Route to status bar's Update()
```

### Key Message Types

| Message | Source | Handler |
|---------|--------|---------|
| `tea.WindowSizeMsg` | Terminal resize | Resize all components |
| `tea.KeyMsg` | User keyboard | Route through key map |
| `pubsub.Event[permission.PermissionRequest]` | Agent tool execution | Show permission dialog |
| `pubsub.Event[agent.AgentEvent]` | Agent completion | Check auto-compact, update UI |
| `pubsub.Event[session.Session]` | Session CRUD | Update selected session |
| `pubsub.Event[logging.LogMessage]` | Logger | Show persistent messages in status |
| `chat.SendMsg` | Editor | Send prompt to agent |
| `chat.SessionSelectedMsg` | Session dialog | Load session messages |
| `dialog.PermissionResponseMsg` | Permission dialog | Grant/deny permission |
| `dialog.ModelSelectedMsg` | Model dialog | Hot-switch model |
| `dialog.CommandSelectedMsg` | Command dialog | Execute custom command |
| `dialog.ThemeChangedMsg` | Theme dialog | Apply new theme |
| `startCompactSessionMsg` | Auto-compact trigger | Begin summarization |

---

## Step 3: Pages

### Chat Page
The primary page containing:
- **Message list**: Scrollable list of conversation messages
- **Editor**: Multi-line text input at the bottom
- **Sidebar**: File changes tracked during the session

```go
type chatModel struct {
    app          *app.App
    messages     []message.Message
    editor       editorModel
    messageList  listModel
    sidebar      sidebarModel
    sessionID    string
    isGenerating bool
}
```

### Logs Page
Shows application log entries:
- **Log table**: List of log entries with level, timestamp, message
- **Log details**: Expanded view of selected log entry

Navigation: Backspace or 'q' returns to chat page.

---

## Step 4: Dialog System

### Dialog Lifecycle
```
1. Trigger (keypress, event) sets showXxxDialog = true
2. View() renders overlay on top of page
3. Dialog captures all KeyMsg events (blocks page)
4. Dialog emits close message -> sets showXxxDialog = false
5. Dialog may emit action message (selected model, granted permission, etc.)
```

### Overlay Rendering
```go
func (a appModel) View() string {
    // Base view
    appView := lipgloss.JoinVertical(lipgloss.Top,
        a.pages[a.currentPage].View(),
        a.status.View(),
    )

    // Center each dialog overlay
    if a.showModelDialog {
        overlay := a.modelDialog.View()
        row := lipgloss.Height(appView)/2 - lipgloss.Height(overlay)/2
        col := lipgloss.Width(appView)/2 - lipgloss.Width(overlay)/2
        appView = layout.PlaceOverlay(col, row, overlay, appView, true)
    }
    // ... repeat for each visible dialog
}
```

### Permission Dialog
- Shows tool name, action, command/file path
- Three options: Allow (a), Allow for Session (A), Deny (d)
- Arrow keys to switch between options
- Enter/Space to confirm
- Emits `PermissionResponseMsg`

### Session Dialog
- Lists all sessions sorted by most recent
- j/k navigation, Enter to select
- Shows session title, message count, cost
- Emits `SessionSelectedMsg`

### Model Dialog
- Two-dimensional navigation: h/l for provider, j/k for model
- Shows provider name as header, models as list items
- Current model marked with indicator
- Emits `ModelSelectedMsg`

### Command Dialog
- Lists all registered commands (built-in + custom)
- Fuzzy search filtering
- Shows command title and description
- For commands with arguments: shows `MultiArgumentsDialog`
- Emits `CommandSelectedMsg`

### Theme Dialog
- Lists all available themes
- Preview of theme colors
- Emits `ThemeChangedMsg`
- Persists selection to config file

---

## Step 5: Keybinding Map

### Global (Always Active)
| Key | Action | Handler |
|-----|--------|---------|
| `Ctrl+C` | Toggle quit dialog | `showQuit = !showQuit` |
| `Ctrl+?` (`Ctrl+H`) | Toggle help | `showHelp = !showHelp` |
| `Ctrl+L` | Switch to logs page | `moveToPage(LogsPage)` |
| `Ctrl+S` | Switch session | Open session dialog |
| `Ctrl+K` | Commands | Open command dialog |
| `Ctrl+O` | Model selection | Open model dialog |
| `Ctrl+T` | Switch theme | Open theme dialog |
| `Ctrl+F` | File picker | Open file attachment picker |
| `Esc` | Close dialog / blur editor | Context-dependent |
| `?` | Toggle help (when not editing) | `showHelp = !showHelp` |

### Chat Page (When Editor Focused)
| Key | Action |
|-----|--------|
| `Ctrl+S` | Send message |
| `Ctrl+E` | Open external editor |
| `Esc` | Blur editor, focus messages |

### Chat Page (When Messages Focused)
| Key | Action |
|-----|--------|
| `i` | Focus editor |
| `Ctrl+N` | New session |
| `Ctrl+X` | Cancel generation |
| `Enter` | Send message |

### Session Dialog
| Key | Action |
|-----|--------|
| `j` / `Down` | Next session |
| `k` / `Up` | Previous session |
| `Enter` | Select session |
| `Esc` | Close |

### Model Dialog
| Key | Action |
|-----|--------|
| `j` / `Down` | Next model |
| `k` / `Up` | Previous model |
| `h` / `Left` | Previous provider |
| `l` / `Right` | Next provider |
| `Esc` | Close |

### Permission Dialog
| Key | Action |
|-----|--------|
| `a` | Allow |
| `A` | Allow for session |
| `d` | Deny |
| `Left` / `Right` / `Tab` | Switch options |
| `Enter` / `Space` | Confirm selection |

### Logs Page
| Key | Action |
|-----|--------|
| `q` / `Backspace` / `Esc` | Return to chat |

---

## Step 6: Message Rendering

### Message Types Rendered
- **User messages**: Text content with attachments
- **Assistant messages**: Markdown content (rendered via Glamour), thinking content, tool calls
- **Tool result messages**: Tool output (may include code, file diffs)

### Markdown Rendering
Uses Glamour (Charmbracelet markdown renderer) with custom style:
```go
renderer, _ := glamour.NewTermRenderer(
    glamour.WithStyles(customStyle),
    glamour.WithWordWrap(width),
)
rendered, _ := renderer.Render(content)
```

### Code Highlighting
Uses Chroma for syntax highlighting within markdown code blocks:
```go
lexer := chroma.Match(filename)
formatter := chroma.TerminalFormatter
```

### Diff Display
File changes shown with unified diff format, using go-diff/go-udiff:
- Added lines in green
- Removed lines in red
- Context lines in default color

---

## Step 7: Status Bar

The status bar sits at the bottom of the screen (1 line height):

```
[Model: Claude 4 Sonnet] [Session: Fix authentication bug] [Tokens: 12,345] [Cost: $0.04]
```

Also shows timed info/warn/error messages:
```go
type InfoMsg struct {
    Type util.InfoType    // info, warn, error
    Msg  string
    TTL  time.Duration    // auto-dismiss after TTL
}
```

---

## Step 8: Layout System

### Container
Wraps content with border, padding, and title:
```go
layout.NewContainer(content, layout.ContainerOptions{
    Border: lipgloss.RoundedBorder(),
    Title:  "Messages",
})
```

### Split Layout
Horizontal split for chat page (messages | sidebar):
```go
layout.NewSplit(
    leftContent,   // message list
    rightContent,  // file changes sidebar
    layout.SplitOptions{
        Ratio: 0.75,  // 75% left, 25% right
    },
)
```

### Overlay
Centers a dialog on top of existing content:
```go
layout.PlaceOverlay(col, row, overlay, background, withShadow)
```

---

## Step 9: Theme Application

Themes define a color palette that is applied globally:
```go
type Theme interface {
    Primary() lipgloss.Color
    Secondary() lipgloss.Color
    Background() lipgloss.Color
    Text() lipgloss.Color
    TextMuted() lipgloss.Color
    Border() lipgloss.Color
    BorderFocused() lipgloss.Color
    Success() lipgloss.Color
    Warning() lipgloss.Color
    Error() lipgloss.Color
    Accent() lipgloss.Color
    // ... more colors
}
```

**Runtime theme switching**:
1. User selects theme via Ctrl+T dialog
2. `theme.SetTheme(name)` updates global theme reference
3. `config.UpdateTheme(name)` persists to config file
4. All subsequent `View()` calls use new theme colors via `theme.CurrentTheme()`

**Available themes**: OpenCode (default), Catppuccin, Dracula, Flexoki, Gruvbox, Monokai, OneDark, Tokyo Night, Tron.
