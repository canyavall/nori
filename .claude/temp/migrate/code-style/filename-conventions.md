---
tags:
  - filename
  - naming
  - conventions
  - eslint
description: Filename postfix conventions enforced by ESLint. 51 approved postfixes for TypeScript/JavaScript files.
required_knowledge: []
rules:
  - "**/*.ts"
  - "**/*.tsx"
---
# Filename Conventions

Filename postfix conventions enforced by ESLint. All TypeScript/JavaScript files must follow these patterns.

## Allowed Patterns

1. `filename.postfix.{ts,tsx,js,jsx}` (e.g., `user.type.ts`)
2. `filename.postfix.spec.{ts,tsx,js,jsx}` (e.g., `user.type.spec.ts`)
3. `filename.dto.postfix.{ts,tsx,js,jsx}` (e.g., `user.dto.type.ts`)
4. `filename.dto.postfix.spec.{ts,tsx,js,jsx}` (e.g., `user.dto.type.spec.ts`)
5. Files without dots (e.g., `index.ts`, `App.tsx`, `Component.tsx`)
6. TypeScript definitions: `filename.d.ts` (e.g., `i18next.d.ts`)

## Approved Postfixes (51 Total)

### Types & Data
**type** **dto** **schema** **enum** - Type definitions and data structures

### Hooks
**hook** **sideHook** - React hooks (sideHook has special rules below)

### Testing
**spec** **mock** **fixture** **msw** - Tests, mocks, fixtures, MSW handlers

### Components & UI
**component** **icon** **element** **item** **page** **hoc** **provider** - UI components and wrappers

### Styling
**style** **palette** **theme** **color** **typography** **shadow** - Styles and theme definitions

### Configuration
**config** **formConfig** **tableConfig** **fieldsConfig** **constant** **option** - Configuration files

### Data & API
**query** **mutation** **api** **service** **websocket** **subscribe** **route** - Data layer and API interactions

### State Management
**state** **store** **context** - State management files

### Utilities
**util** **transformer** **transform** **generator** **validation** - Utility functions and transformers

### Environment
**stage** **production** **local** **development** **uat** - Environment-specific configs

### Other
**story** **method** - Storybook stories and method definitions

## Special Rules: sideHooks Folder

Files in `**/sideHooks/**` MUST:
- Use `.sideHook` postfix OR be named `index`
- Hook names MUST start with `use`
- Tests use `.sideHook.spec` pattern

**Valid**:
```
components/UserProfile/sideHooks/useDataSync.sideHook.ts
components/UserProfile/sideHooks/index.ts
```

**Invalid**:
```
components/UserProfile/sideHooks/dataSync.ts (missing .sideHook)
components/UserProfile/sideHooks/syncData.sideHook.ts (must start with 'use')
```

## Special Rules: basics Folder

Files in `basics/` subfolders MUST use lowercase filenames with specific postfixes:

### Standard basics folders
- `basics/constants/` - `.constant` postfix
- `basics/enums/` - `.enum` postfix
- `basics/mocks/` - `.mock` postfix
- `basics/utils/` - `.util` postfix
- `basics/types/` - `.type` postfix
- `basics/options/` - `.option` postfix
- `basics/generators/` - `.generator` postfix
- `basics/transformers/` - `.transformer` postfix

**Example**: `basics/utils/formatDate.util.ts`

### DTO chains in basics
- `basics/dtos/enums/` - `.dto.enum` postfix
- `basics/dtos/mocks/` - `.dto.mock` postfix
- `basics/dtos/utils/` - `.dto.util` postfix
- `basics/dtos/types/` - `.dto.type` postfix
- `basics/dtos/options/` - `.dto.option` postfix
- `basics/dtos/generators/` - `.dto.generator` postfix
- `basics/dtos/transformers/` - `.dto.transformer` postfix

**Example**: `basics/dtos/types/user.dto.type.ts`

## Blocklist Rules

**Component tests** - Must be in `tests/` subfolder:
```
❌ components/UserProfile/UserProfile.spec.tsx
✅ components/UserProfile/tests/UserProfile.spec.tsx
```

**Component sideHooks** - Must be in `sideHooks/` subfolder:
```
❌ components/UserProfile/useDataSync.sideHook.ts
✅ components/UserProfile/sideHooks/useDataSync.sideHook.ts
```

## Glob Pattern Syntax

ESLint uses GLOB syntax (not regex):
- `*` - Match any characters except `/`
- `**` - Match any characters including `/`
- `@(a|b)` - Match a OR b
- `!(pattern)` - NOT pattern

**ESLint Config**: `eslint.filenameRules.config.mjs`
