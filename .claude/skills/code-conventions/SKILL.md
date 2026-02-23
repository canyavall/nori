---
name: code-conventions
description: Naming conventions, filename postfixes, linting rules, import/export patterns, and constants organization. Reference when writing or reviewing any TypeScript/JavaScript file.
globs: '**/*.{ts,tsx}'
alwaysApply: false
---

# Code Conventions

Naming conventions, filename rules, linting standards, and constants organization. All rules are MANDATORY.

---

## Naming Conventions

**camelCase** — Variables, functions, components, hooks:
```typescript
const userName = 'John';
const getUserData = () => {};
const UserProfile = () => {};
```

**UPPERCASE_WITH_UNDERSCORES** — Constants:
```typescript
const API_BASE_URL = 'https://api.example.com';
```

**lowercase** — Acronyms:
```typescript
const getFaq = () => {};
```

**Boolean prefixes** — `is`, `has`, `should`, `can`:
```typescript
const isLoading = true;
```

**Enums** — Plural name, camelCase keys:
```typescript
enum TransactionTypes {
  deposit = 'Deposit',
  withdrawal = 'Withdrawal',
}
```

---

## Code Patterns

**Always use braces** (never omit):
```typescript
if (!user) {
  return false;
}
```

**Named exports only** (NO default exports):
```typescript
export { UserProfile };
export const USER_CONSTANTS = {};
```

**ZERO comments/JSDoc** — Write self-documenting code:
```typescript
const isValidAdmin = (user: User) => {
  const hasAdminRole = user.role === 'admin';
  const hasActiveSubscription = user.subscription?.isActive === true;
  return hasAdminRole && hasActiveSubscription;
};
```

---

## Filename Postfix Conventions

All TypeScript/JavaScript files MUST follow these patterns:

1. `filename.postfix.{ts,tsx}` (e.g., `user.type.ts`)
2. `filename.postfix.spec.{ts,tsx}` (e.g., `user.type.spec.ts`)
3. Files without dots (e.g., `index.ts`, `App.tsx`)
4. TypeScript definitions: `filename.d.ts`

### Approved Postfixes

| Category | Postfixes |
|----------|-----------|
| Types & Data | `type` `dto` `schema` `enum` |
| Hooks | `hook` `sideHook` |
| Testing | `spec` `mock` `fixture` |
| Components & UI | `component` `icon` `element` `item` `page` `hoc` `provider` |
| Styling | `style` `palette` `theme` `color` `typography` |
| Configuration | `config` `formConfig` `tableConfig` `constant` `option` |
| Data & API | `query` `mutation` `api` `service` `route` |
| State | `state` `store` `context` |
| Utilities | `util` `transformer` `transform` `generator` `validation` |

**NEVER plural**: `.style.ts` NOT `.styles.ts`, `.type.ts` NOT `.types.ts`

### basics/ Folder Rules

Files in `basics/` subfolders MUST use lowercase filenames with specific postfixes:
- `basics/constants/` → `.constant` postfix
- `basics/utils/` → `.util` postfix
- `basics/types/` → `.type` postfix
- `basics/enums/` → `.enum` postfix

---

## Linting Rules & Import/Export Patterns

Zero violations required before commit.

### NO Barrel Files (CRITICAL)

**FORBIDDEN**: `index.ts` re-exporting from other files.

```typescript
// ❌ FORBIDDEN
export { ComponentA } from './ComponentA';
export * from './utils';

// ✅ CORRECT: Import directly from source
import { UserProfile } from './UserProfile/UserProfile';
```

**Exception**: Package entry points can use `index.ts` for controlled public API.

### Export Rules

- Named exports only (NO default exports)
- One export per component/hook file
- Multiple exports OK for utilities/types/validators

### Import Order

```typescript
// 1. External packages
import { createSignal } from 'solid-js';
// 2. Internal packages (@nori/*)
import { SomeType } from '@nori/shared';
// 3. Relative imports
import { useUserData } from './hooks/useUserData';
```

### Key Rules

- Max 3 function params (use object for more)
- No nested ternaries
- Self-closing tags when no children
- `import type` for type-only imports

### Common Pitfalls

- ❌ Default exports
- ❌ Type casting with `as`
- ❌ Hardcoded user-facing strings
- ❌ Inline event handlers
- ❌ Barrel files (`index.ts` re-exports)

---

## Constants Organization

### UPPER_SNAKE_CASE in `.constant.ts` files

```typescript
// ✅ .constant.ts
export const API_BASE_URL = 'https://api.example.com';
export const MAX_RETRY_ATTEMPTS = 3;

// ❌ Wrong in .constant.ts
export const apiBaseUrl = 'https://api.example.com';
```

### 7 Constant Categories

| Category | Example |
|----------|---------|
| API Endpoints | `GATEWAY_API` |
| Routes | `APP_ROUTES` |
| Magic Numbers | `MAX_UPLOAD_FILE_SIZE` |
| Regex | `EMAIL_REGEX` |
| Arrays/Lists | `SUPPORTED_CURRENCIES` |
| Enum Mappings | `STATUS_LABELS: Record<Status, string>` |
| Form Configs | `onboardingConfig` |

### Organization Hierarchy

1. **Shared** — used by 3+ modules
2. **Module-level** — domain-specific
3. **Component-level** — single component only (`ComponentName.constant.ts`)

### Anti-Patterns

- ❌ camelCase in `.constant.ts` files
- ❌ Inline magic numbers — extract to constants
- ❌ Constants in component files — use `.constant.ts`
- ❌ Mix constants with logic — constants only
