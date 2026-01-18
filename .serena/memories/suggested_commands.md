# Nori Development Commands

## Development (Most Common)

### Start Development Server
```bash
cd app && npm run dev
```
**What it does**:
- Compiles TypeScript (main process)
- Starts Express backend (auto port: 3000-3009)
- Launches Electron window
- Starts Vite dev server (hot reload)

**Use when**: Starting work on Nori

### Rebuild Native Modules
```bash
cd app && npx electron-rebuild
```
**What it does**: Rebuilds `better-sqlite3` for Electron's Node version

**Use when**:
- After `npm install`
- After updating Electron version
- If you see `MODULE_VERSION` mismatch errors

## Testing

### Run Unit Tests
```bash
cd app && npm run test
```
**What it does**: Runs Vitest tests once

### Watch Mode (Tests)
```bash
cd app && npm run test:watch
```
**What it does**: Runs tests in watch mode (re-runs on file changes)

### Run E2E Tests
```bash
cd app && npm run test:e2e
```
**What it does**: Builds app, then runs Playwright E2E tests

## Build & Package

### Type Check
```bash
cd app && npm run typecheck
```
**What it does**: Runs TypeScript compiler without emitting files (checks for type errors)

**Use when**: Before committing, or debugging type issues

### Build
```bash
cd app && npm run build
```
**What it does**: Builds both main and renderer processes

### Package (All Platforms)
```bash
cd app && npm run package
```
**What it does**: Builds and packages Electron app (output: `release/`)

### Package (Windows Only)
```bash
cd app && npm run package:win
```
**What it does**: Builds and packages for Windows (NSIS + MSI installers)

## Code Quality

### Lint
```bash
cd app && npm run lint
```
**What it does**: Runs ESLint on `src/`

**Use when**: Before committing

## Database (Manual Operations)

### Inspect Database
```bash
sqlite3 ~/.nori/nori.db
```
**What it does**: Opens SQLite CLI for inspecting database

**Common queries**:
```sql
.tables                    -- List tables
SELECT * FROM workspaces;  -- View workspaces
SELECT * FROM sessions;    -- View sessions
```

### Delete Database (Reset)
```bash
rm ~/.nori/nori.db
rm ~/.nori/nori.db-wal
```
**What it does**: Removes database (will be recreated on next run)

**Use when**: Database is corrupted or you want a fresh start

## Windows-Specific System Commands

### Find Processes on Port
```bash
netstat -ano | findstr :3000
```

### Kill Process by PID
```bash
taskkill /PID <pid> /F
```

### Kill All Electron Instances
```bash
taskkill /IM electron.exe /F
```

## Git Operations

Standard git commands work as expected:
```bash
git status
git add .
git commit -m "message"
git push
```

## File Operations (Windows)

- **List files**: `dir` or `ls` (if Git Bash/PowerShell)
- **Change directory**: `cd path`
- **Read file**: `type file.txt` or `cat file.txt`
- **Find files**: Use `where` or `dir /s /b *.ts`
- **Search content**: Use `findstr` or install `ripgrep` (rg)
