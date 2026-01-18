# Nori Code Style & Conventions

## TypeScript Configuration

**Strict mode enabled** (tsconfig.json):
- `strict: true`
- `forceConsistentCasingInFileNames: true`
- Target: ES2022
- Module: ESNext
- Module resolution: bundler

## ESLint Rules

### Core Rules (all files)
- `@typescript-eslint/no-explicit-any`: **error** (no `any` types allowed)
- `@typescript-eslint/no-unused-vars`: **error** (unused vars pattern: `^_`)
- `no-console`: **off** (console allowed)

### Test Files (*.test.ts)
- `@typescript-eslint/no-explicit-any`: **warn** (relaxed for tests)

## Naming Conventions

Based on codebase analysis:

### Components (React)
- **PascalCase** for component names
- Interface props: `{ComponentName}Props`
- Example: `ChatMessage` component with `ChatMessageProps` interface

### Files
- Components: PascalCase (e.g., `ChatMessage.tsx`)
- Utilities/hooks: camelCase (e.g., `useChat.ts`)
- Tests: `*.test.ts` or `*.test.tsx`

### Variables & Functions
- **camelCase** for variables, functions, methods
- **PascalCase** for interfaces, types, classes
- Unused parameters: prefix with `_` (e.g., `_unusedParam`)

## File Organization

### Directory Structure
```
app/src/
├── main/              # Electron main process
├── preload/           # Context bridge
├── renderer/          # React frontend
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks
│   ├── stores/        # Zustand stores
│   ├── types/         # TypeScript types
│   ├── pages/         # Page components
│   └── lib/           # Utilities
└── server/            # Express backend
    ├── auth/          # Authentication
    ├── claude/        # Claude AI integration
    ├── db/            # Database layer
    ├── hooks/         # Hooks system
    ├── knowledge/     # Knowledge management
    ├── roles/         # Role management
    ├── sessions/      # Session management
    └── workspaces/    # Workspace management
```

### Component Structure
- Component definition
- Props interface above component
- Export at end of file

## Type Safety

- **No `any` types** (enforced by ESLint)
- **Explicit return types** for functions when non-obvious
- **Interface over type** for object shapes (convention)
- **Strict null checks** enabled

## Import Style

ES modules (ESM):
- Use `import/export` syntax
- File extensions optional (bundler resolution)
- Named exports preferred (easier to refactor)
