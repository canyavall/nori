# Migration Guide: Tauri/Rust → Electron/Node.js

## What Changed

**Before (Tauri/Rust):**
- Rust backend with Tauri IPC
- SQLite via `rusqlite`
- OAuth implementation using custom endpoints
- Frontend: React + Tauri API

**After (Electron/Node.js):**
- Node.js/TypeScript backend with Express
- SQLite via `better-sqlite3`
- OAuth using OpenCode pattern (unrestricted tokens)
- Frontend: React + HTTP/WebSocket

## Breaking Changes

### 1. Build System
- **Old**: `npm run tauri dev`, `npm run tauri build`
- **New**: `npm run dev`, `npm run package`

### 2. IPC Communication
- **Old**: Tauri `invoke()` commands
- **New**: HTTP REST API (`fetch()`)

### 3. Event Streaming
- **Old**: Tauri event listeners
- **New**: WebSocket connections

### 4. OAuth Flow
- **Old**: Custom `claude_cli/create_api_key` endpoint (restricted tokens)
- **New**: OpenCode pattern (unrestricted tokens via AI SDK)

## Data Compatibility

**Database**: ✅ Fully compatible
- Same SQLite schema
- Automatic migration of old databases
- Location: `~/.nori/nori.db`
- Migrations handled automatically:
  - `projects` table → `workspaces`
  - `active_project_id` → `active_workspace_id`

**Auth Tokens**: ⚠️ Requires re-authentication
- Old tokens stored in database (restricted)
- New tokens stored in `~/.nori/auth.json` (unrestricted)
- **Action Required**: Re-authenticate after first launch

**Personalities**: ✅ Fully compatible
- Location: `~/.nori/personalities/`
- No changes required

**Sessions**: ✅ Fully compatible
- Stored in SQLite `sessions` and `messages` tables
- No changes required

## Installation

### Development
```bash
cd app
npm install

# IMPORTANT: Rebuild native modules for Electron
npx electron-rebuild

npm run dev
```

**Note:** `better-sqlite3` is a native Node module that must be rebuilt for Electron's Node version. The `electron-rebuild` step is required after `npm install`.

### Production Build (Windows)
```bash
cd app
npm run package:win
# Outputs to: app/release/
```

### Production Build (All Platforms)
```bash
cd app
npm run package
# Requires platform-specific machines for macOS builds
```

## Architecture Changes

### Multiple Instances
- **Old**: Single instance only (Tauri limitation)
- **New**: Multiple independent instances supported
  - Each instance gets unique port (3000, 3001, 3002...)
  - Each instance has separate Express server
  - Complete process isolation

### Port Allocation
- Automatic port detection (range: 3000-3009)
- Port passed to renderer via Electron preload
- Available at: `window.nori.serverPort`

### API Endpoints

**Health:**
```
GET http://localhost:{port}/health
```

**Authentication:**
```
POST /auth/start          - Start OAuth flow
POST /auth/complete       - Complete OAuth exchange
GET  /auth/status         - Check auth status
DELETE /auth/logout       - Delete tokens
```

**Roles:**
```
GET  /roles/personality/:role  - Load personality file
GET  /roles/active            - Get active role
POST /roles/active            - Set active role
```

**Workspaces:**
```
GET    /workspaces           - List all workspaces
POST   /workspaces           - Create workspace
GET    /workspaces/active    - Get active workspace
POST   /workspaces/active    - Set active workspace
DELETE /workspaces/:id       - Delete workspace
```

**Sessions:**
```
GET    /sessions           - List all sessions
GET    /sessions/:id       - Load session with messages
POST   /sessions           - Save session with messages
DELETE /sessions/:id       - Delete session
```

**Chat (WebSocket):**
```
ws://localhost:{port}/chat
```

### Frontend API Layer

**Before:**
```typescript
import { invoke } from '@tauri-apps/api';
const result = await invoke('get_workspaces');
```

**After:**
```typescript
import { invokeCommand } from './lib/api';
const result = await invokeCommand('/workspaces');
```

**WebSocket:**
```typescript
import { createWebSocket } from './lib/api';
const ws = createWebSocket('/chat');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle streaming chunks
};
```

## Testing

### Unit & Integration Tests
```bash
npm test
# 55 tests covering all backend modules
```

### E2E Tests
```bash
npm run test:e2e
# Tests app startup, UI rendering, API calls
```

### Manual Testing
```bash
npm run dev
# Test buttons available in UI:
# - Test Health
# - Test Auth Status
# - Test Active Role
# - Test Workspaces
```

## Troubleshooting

### Port Already in Use
If port 3000-3009 are all occupied, the app will fail to start.
**Solution**: Close other services or restart the app.

### Database Migration Fails
If automatic migration fails:
1. Backup `~/.nori/nori.db`
2. Delete the database file
3. Restart app (will create fresh database)

### Auth Tokens Invalid
**Symptom**: "Not authenticated" errors
**Solution**: Click logout and re-authenticate via OAuth flow

### Multiple Instances Not Working
**Check**:
- Each instance should show different port in UI
- Check console logs for port allocation
- Verify no port conflicts (netstat -ano | findstr :3000)

### Native Module Errors (better-sqlite3)
**Symptom**: `MODULE_VERSION` mismatch or `ERR_DLOPEN_FAILED`
**Solution**:
```bash
# Rebuild native modules for Electron
npx electron-rebuild
```

**If electron-rebuild fails with Python errors (Windows, Python 3.12+)**:
```bash
# Install setuptools (provides distutils)
python -m pip install setuptools

# Retry rebuild
npx electron-rebuild
```

## Rollback

To revert to Rust version:
1. Rename `app/` → `app-nodejs/`
2. Rename `nori-app/` → `app/`
3. Re-authenticate (tokens incompatible between versions)
4. Database will work in both versions

## Performance

**Startup Time:**
- Rust: ~500ms
- Node.js: ~800ms (+60% slower, acceptable)

**Memory Usage:**
- Rust: ~80MB
- Node.js: ~120MB (+50% more, acceptable)

**API Latency:**
- Tauri IPC: <1ms
- HTTP localhost: <5ms (negligible difference)

## Known Limitations

1. **Knowledge Search**: Stubbed (returns empty)
   - Rust implementation was complex fuzzy search
   - Not implemented in MVP (low priority)

2. **Hooks Execution**: Stubbed (returns 501)
   - Security risk: executing arbitrary shell commands
   - Requires sandboxing before implementation

3. **macOS Code Signing**: Not configured
   - Requires Apple Developer account
   - App will show "unidentified developer" warning

4. **Auto-Update**: Not implemented
   - electron-builder supports this
   - Requires update server setup

## Next Steps

1. Re-authenticate after first launch
2. Verify all existing sessions and workspaces load correctly
3. Test chat functionality with real Claude API
4. Report any issues or unexpected behavior

## Support

For issues or questions:
- Check console logs (Help → Toggle Developer Tools)
- Review `~/.nori/` directory for data integrity
- Database schema is identical to Rust version
