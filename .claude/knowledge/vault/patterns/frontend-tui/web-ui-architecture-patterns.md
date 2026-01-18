---
tags:
  - frontend
  - web-ui
  - architecture
  - react
  - websocket
description: >-
  Web UI architecture patterns for AI coding tools: ClaudeCodeUI analysis showing
  React frontend, WebSocket streaming, Express backend, and SDK integration
category: patterns/frontend-tui
required_knowledge: []
---
# Web UI Architecture Patterns

Architecture patterns for building web-based interfaces for AI coding tools, extracted from ClaudeCodeUI analysis.

## Technology Stack

**Frontend**:
- React 18 + Vite (modern build tooling)
- CodeMirror 6 (code editor with syntax highlighting)
- Tailwind CSS (utility-first styling)
- Xterm.js (integrated terminal)
- WebSocket client (real-time streaming)

**Backend**:
- Node.js + Express (REST API)
- WebSocket server (real-time communication)
- `@anthropic-ai/claude-agent-sdk` (official SDK integration)
- Better-sqlite3 (session/user storage)
- Node-pty (terminal emulation)
- Chokidar (file system watching)

## Architecture Pattern

```
┌─────────────┐     WebSocket      ┌─────────────┐     SDK      ┌─────────────┐
│   Browser   │ ←──────────────→ │   Express   │ ──────────→ │  Claude API │
│  (React)    │                   │   Server    │              │             │
└─────────────┘                   └─────────────┘              └─────────────┘
      │                                  │
      │ REST API                         │
      ├─ Projects list                   ├─ File operations
      ├─ Git operations                  ├─ Session management
      ├─ MCP config                      ├─ Tool permissions
      └─ Settings                        └─ Project discovery
```

## Key Components

### 1. Chat Interface
**File**: `ChatInterface.jsx`
**Responsibilities**:
- Message rendering (user messages, AI responses, tool calls)
- Streaming response handling
- Message history display
- Input handling

**Pattern**: Controlled component with WebSocket integration

```jsx
const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const ws = useWebSocket('/chat');

  ws.onmessage = (event) => {
    const chunk = JSON.parse(event.data);
    // Append streaming chunk to current message
    setMessages(prev => appendChunk(prev, chunk));
  };

  const sendMessage = (content) => {
    ws.send(JSON.stringify({ type: 'message', content }));
  };

  return <MessageList messages={messages} onSend={sendMessage} />;
};
```

### 2. File Tree
**File**: `FileTree.jsx`
**Responsibilities**:
- Interactive directory navigation
- File selection
- Quick file preview
- Git status indicators

**Pattern**: Virtual scrolling for large directories

### 3. Code Editor
**File**: `CodeEditor.jsx`
**Responsibilities**:
- Syntax highlighting
- Code editing
- File saving
- Diff viewing

**Integration**: CodeMirror 6 with custom extensions

### 4. Git Panel
**File**: `GitPanel.jsx`
**Responsibilities**:
- Status display
- Diff viewing
- Commit/push/pull operations
- Branch management

**Pattern**: Polling for status updates (could use file watchers instead)

## Backend Architecture

### Session Management

```javascript
// projects.js - Discover Claude Code sessions
const discoverProjects = () => {
  const projectsDir = path.join(os.homedir(), '.claude', 'projects');
  const projects = fs.readdirSync(projectsDir)
    .filter(name => fs.existsSync(path.join(projectsDir, name, 'session.jsonl')));

  return projects.map(name => ({
    name,
    path: resolveProjectPath(name),
    sessionPath: path.join(projectsDir, name, 'session.jsonl')
  }));
};
```

### SDK Integration

```javascript
// claude-sdk.js - Direct SDK usage (not CLI subprocess)
import { ClaudeAgent } from '@anthropic-ai/claude-agent-sdk';

const agent = new ClaudeAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  projectPath: '/path/to/project'
});

// Stream responses via WebSocket
const chat = async (message, ws) => {
  const stream = await agent.chat(message);

  for await (const chunk of stream) {
    ws.send(JSON.stringify(chunk));
  }
};
```

### WebSocket Streaming

```javascript
// WebSocket server for real-time chat
wss.on('connection', (ws, req) => {
  const projectId = req.url.split('/').pop();

  ws.on('message', async (data) => {
    const { type, content } = JSON.parse(data);

    if (type === 'message') {
      await streamResponse(content, projectId, ws);
    }
  });
});
```

## File Operations API

**REST endpoints**:
- `GET /api/files/:project/:path` - Read file
- `PUT /api/files/:project/:path` - Write file
- `GET /api/files/:project/tree` - File tree
- `POST /api/git/:project/status` - Git status
- `POST /api/git/:project/commit` - Create commit

## Session Visualization

**Session Loading**:
1. Parse JSONL session file
2. Reconstruct conversation history
3. Display messages with tool calls
4. Show file changes and diffs

**Challenge**: Large sessions (1000+ messages) require pagination or virtual scrolling

## Mobile Considerations

**Responsive Design**:
- Collapsible sidebar (file tree, git panel)
- Touch-friendly controls
- Mobile-optimized editor (limited CodeMirror features)
- Simplified terminal for mobile

**Performance**:
- Lazy load large files
- Virtual scrolling for message history
- Debounced file tree updates

## Security Considerations

**Authentication**:
- User credentials in SQLite
- API key management
- Session tokens

**Isolation**:
- Project sandboxing
- File access restrictions
- Git operation validation

## Advantages of Web UI

1. **Remote Access**: Use from any device with browser
2. **Mobile Support**: Phone/tablet access
3. **Visual File Management**: GUI vs CLI
4. **Session Sharing**: Multiple users can view (read-only mode)
5. **Custom UI**: Tailored to specific workflows

## Disadvantages

1. **Complexity**: More infrastructure (web server, DB, auth)
2. **Latency**: Network overhead vs local CLI
3. **Security**: Web attack surface
4. **State Management**: More complex than CLI
5. **Offline**: Requires server connection

## Nori Application

Nori implementation (Electron desktop app):
- Electron desktop framework (Node.js backend)
- React frontend with TypeScript
- Express backend + WebSocket (AI streaming)
- Local SQLite for settings/sessions (~/.nori/nori.db)
- Native file watchers and OS integration
- Cross-platform (Mac, Windows, Linux)

**Architecture choice**:
- Chose Electron over web-only for native OS integration
- Express backend enables REST API + WebSocket streaming
- Context isolation via preload script (security)
- Hot reload via Vite (developer experience)

## Source

Extracted from `claudecodeui-assessment.md` - Web UI architecture analysis
