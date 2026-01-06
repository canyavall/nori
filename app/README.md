# Nori - Electron + Node.js Backend

AI-powered development assistant with Electron frontend and Express backend.

## Architecture

- **Desktop**: Electron (multiple independent instances)
- **Backend**: Express server with automatic port allocation (3000-3009)
- **Frontend**: Vite-powered renderer process
- **IPC**: HTTP REST + WebSocket (no Tauri invoke)

## Development

```bash
# Install dependencies
npm install

# Run in development mode (hot reload)
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Build

```bash
# Build for production
npm run build

# Package for distribution
npm run package
```

## Project Structure

```
app/
├── src/
│   ├── main/         # Electron main process
│   ├── server/       # Express backend
│   ├── preload/      # Electron preload script
│   └── renderer/     # Frontend (Vite)
├── dist/             # Compiled output
└── release/          # Distribution packages
```

## Multiple Instances

Each app instance runs:
- Independent Electron window
- Separate Express server (different port)
- Isolated state

Launch the app multiple times to test multi-instance behavior.
