---
description: Start Electron dev server and open the app
allowed-tools: Bash(*)
---

# Serve Command - Start Nori App

Starts the Electron development server, which:
1. Runs Express backend on auto-allocated port (3000-3009)
2. Runs Vite dev server (frontend on port 5173)
3. Opens the Electron app window

## Usage

```bash
/serve
```

No arguments required.

---

## Execution

### Step 1: Navigate to App Directory

```bash
cd app
```

### Step 2: Check Native Modules (First Run Only)

If this is the first run after `npm install`, rebuild native modules:

```bash
npx electron-rebuild
```

**Why**: `better-sqlite3` is a native Node module that must be rebuilt for Electron's Node version.

**When to run**:
- After `npm install`
- After updating Electron version
- If you see `MODULE_VERSION` mismatch errors

### Step 3: Run Electron Dev

```bash
npm run dev
```

This command (via concurrently):
- Compiles TypeScript main process
- Starts Express backend (auto port: 3000-3009)
- Launches Electron window
- Starts Vite dev server for renderer hot reload
- Watches for file changes

### Step 3: Report Status

Once the app window opens, report to user:

```
🚀 Nori app running

Backend: http://localhost:{port} (auto-allocated)
WebSocket: ws://localhost:{port}/chat
Frontend: Electron renderer (hot reload enabled)
Window: Electron v28 (1280x800)

📋 Dev tools open in app window
🔄 Hot reload enabled

Press Ctrl+C to stop
```

---

## Notes

- **First run**: ~5-10 seconds (npm install already done)
- **Subsequent runs**: ~3-5 seconds
- **Console logs**:
  - Terminal: Express/Node.js logs
  - App window console: React/renderer logs
- **Stop server**: Ctrl+C in Terminal (graceful shutdown)
- **Port allocation**: Automatic (3000-3009 range)
- **Multiple instances**: Supported (each gets different port)

---

## Troubleshooting

**All ports 3000-3009 in use:**
```bash
# Find processes
netstat -ano | findstr :3000

# Kill specific PID
taskkill /PID <pid> /F
```

**TypeScript compilation errors:**
```bash
npm run typecheck
npm run build
```

**Window doesn't open:**
- Check Terminal for Express startup errors
- Verify build succeeds: `npm run build`
- Check database permissions: `~/.nori/nori.db`
- Try clean build: `rm -rf dist && npm run build && npm run dev`

**Database locked errors:**
```bash
# Close all Nori instances
taskkill /IM electron.exe /F

# Remove lock file
rm ~/.nori/nori.db-wal
```
