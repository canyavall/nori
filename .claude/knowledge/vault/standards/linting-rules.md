# Linting Rules

ESLint and TypeScript configuration for Sygnum frontend. All rules are MANDATORY.

## ESLint Protocol

**File-level lint with auto-fix**:
```bash
npx nx lint my-project --fix
```

**Zero violations required** before commit.

## TypeScript Type Checking

**Type check command**:
```bash
npx nx run my-project:tsCheck
```

Must pass with **zero errors**.

## Key ESLint Rules

**Imports/Exports**:
- ✅ Named exports only (NO default exports)
- ✅ No console.log in src files
- ✅ Import order auto-fixed (external → internal → relative)
- ✅ Unused imports auto-removed

**Functions**:
- ✅ Maximum 3 parameters (use object for more)
- ✅ No nested ternaries
- ✅ Arrow body style - implicit return when possible

**React**:
- ✅ Use `FC` from react (not `React.FC`)
- ✅ Self-closing components
- ✅ Keys in lists required

**File Naming** (singular, not plural):
- ✅ `UserProfile.tsx`, `UserProfile.hook.ts`, `UserProfile.type.ts`
- ✅ `UserProfile.spec.tsx` in `tests/` subfolder
- ✅ `.style.ts` (NOT `.styles.ts`)
- ❌ Barrel files (`index.ts` re-exports) forbidden
- ❌ Namespace imports (`import * as`) forbidden

## Prettier Configuration

Auto-formats on save:
- **printWidth**: 140
- **tabWidth**: 2 (spaces, not tabs)
- **singleQuote**: true
- **trailingComma**: 'all'
- **arrowParens**: 'avoid'

## Common Pitfalls

- ❌ Using default exports
- ❌ Type casting with `as`
- ❌ Hardcoding user-facing strings (use i18n)
- ❌ Inline event handlers
- ❌ Missing keys in lists
