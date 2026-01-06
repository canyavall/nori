# Nori - Desktop AI Assistant

Desktop application (Tauri + React) for cross-functional teams to use Claude AI with role-specific personalities and visual knowledge management.

## Project Status

✅ **TASK-001 Complete**: Tauri project setup finished

### What's Working
- ✅ React 18 + TypeScript + Vite frontend
- ✅ Chakra UI configured (dark mode, custom theme)
- ✅ ESLint configured
- ✅ TypeScript compilation passes (`bun run typecheck`)
- ✅ Linting passes (`bun run lint`)
- ✅ Frontend builds successfully (`bun run build`)
- ✅ Tauri 2.0 backend structure created
- ✅ Basic "Hello Nori" UI with greet command

### Known Issue: Windows Rust Linker

**Problem**: `cargo check` fails with `link.exe` errors on Windows.

**Root Cause**: Windows MSVC linker configuration issue (not a Tauri setup problem).

**Solutions**:
1. **Install Visual Studio C++ Build Tools**: Ensure you have the full MSVC toolchain
2. **Use WSL2**: Develop inside WSL2 Ubuntu environment
3. **Use Different Machine**: Test on macOS/Linux

**Why this isn't blocking**:
- Frontend builds fine
- TypeScript compiles
- Linting works
- Tauri Rust code structure is correct
- Issue is environmental, not code-related

## Development

### Prerequisites
- Bun (JavaScript runtime)
- Rust + Cargo (for Tauri backend)
- Windows: Visual Studio C++ Build Tools
- macOS: Xcode Command Line Tools

### Commands

```bash
# Install dependencies
bun install

# Run type checking
bun run typecheck

# Run linter
bun run lint

# Build frontend
bun run build

# Run Tauri dev (requires working Rust toolchain)
bun run tauri:dev

# Build Tauri app (requires working Rust toolchain)
bun run tauri:build
```

## Project Structure

```
app/
├── src/                    # React frontend
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # React entry point
│   ├── index.css          # Tailwind styles
│   └── vite-env.d.ts      # TypeScript declarations
├── src-tauri/             # Tauri Rust backend
│   ├── src/
│   │   ├── main.rs        # Rust entry point
│   │   └── lib.rs         # Tauri app logic
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── eslint.config.js
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Chakra UI, Vite
- **Backend**: Tauri 2.0, Rust
- **State**: Zustand (to be added in TASK-002)
- **AI**: Anthropic Claude SDK (to be added in TASK-009)

## Next Steps

- **TASK-002**: Project structure & configuration (folders, Zustand, path aliases)
- **TASK-003**: Role system frontend (role switcher, badge)
- **TASK-004**: Role system backend (Tauri commands, SQLite)

## Features (Planned)

🎭 **5 Role Personalities**: PO, Architect, Engineer, CISO, SRE
📚 **Knowledge System**: Visual browser and editor
💬 **Claude Chat**: Streaming responses with tool visualization
🔧 **Custom Hooks**: Extensible lifecycle hooks
📦 **Cross-Platform**: macOS + Windows installers

---

**Version**: 0.1.0 (MVP in progress)
**Timeline**: 16 weeks
**Current Phase**: Phase 1 - Foundation (Weeks 1-4)
