---
tags:
  - linting
  - eslint
  - prettier
  - imports
  - exports
  - code-quality
description: >-
  ESLint rules, Prettier config, import/export patterns, barrel file
  prohibition, and lint-compliant code patterns
required_knowledge: []
rules:
  - "**/*.ts"
  - "**/*.tsx"
---
# Linting Rules & Import/Export Patterns

All rules are MANDATORY. Zero violations required before commit.

## Commands

```bash
npx nx lint my-project --fix    # ESLint with auto-fix
npx nx run my-project:tsCheck   # TypeScript type check
```

## Prettier Configuration

- **printWidth**: 140
- **tabWidth**: 2 (spaces)
- **singleQuote**: true
- **trailingComma**: 'all'
- **arrowParens**: 'avoid'

**Line length determines formatting** — count total chars to decide single vs multi-line:

```typescript
// Short (<140 chars) → single line
const items = ['item1', 'item2', 'item3'];
<Component name="value" isActive disabled />

// Long (≥140 chars) → multi-line
const items = [
  'very-long-item-name-that-makes-line-exceed-140-characters',
  'another-long-item',
];
```

## Critical Rule: NO Barrel Files

**FORBIDDEN**: `index.ts` re-exporting from other files.

```typescript
// ❌ FORBIDDEN
export { ComponentA } from './ComponentA';
export * from './utils';

// ✅ CORRECT: Import directly from source
import { UserProfile } from '@sygnum/suil/UserProfile/UserProfile';
```

**Why**: Hard to find implementation, prevents tree-shaking, circular dependencies, slows builds.

**Exception**: Package entry points can use `index.ts` for controlled public API via `package.json` subpath exports.

## Export Rules

- **Named exports only** (NO default exports)
- **One export per component/hook file**
- **Multiple exports OK** for utilities/types/validators

## Import Order

Auto-fixed, but write correctly:
```typescript
// 1. External packages
import { FC } from 'react';
import BigNumber from 'bignumber.js';
// 2. Internal packages (@sygnum/*)
import { Button } from '@sygnum/suil';
// 3. Relative imports
import { useUserData } from './hooks/useUserData';
```

## Key ESLint Rules

**Functions**: Max 3 params (use object for more), no nested ternaries, implicit return when possible
**React**: `FC` from react (not `React.FC`), self-closing tags, keys in lists
**File naming**: Singular (`UserProfile.tsx`), `.style.ts` not `.styles.ts`
**Forbidden**: `console.log` in src, namespace imports (`import * as`), default exports

## Common Pitfalls

- ❌ Default exports
- ❌ Type casting with `as`
- ❌ Hardcoding user-facing strings (use i18n)
- ❌ Inline event handlers
- ❌ Explicit return for single expression arrows
