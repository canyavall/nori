---
tags:
  - section-pattern
  - architecture
  - modules
  - components
  - boundaries
  - eslint
description: >-
  Section Pattern: three-layer architecture (Apps → Modules → Infrastructure),
  dependency rules, boundary enforcement, and decision criteria
required_knowledge:
  - component-file-structure
  - component-implementation-patterns
rules:
  - "**/sections/**/*.tsx"
  - "**/sections/**/*.ts"
  - "!**/sections/**/*.test.tsx"
---
# Section Pattern

Architectural pattern for organizing the React monorepo by functional domains with enforced boundaries.

## Core: Three-Layer Architecture

```
Apps → Modules → Infrastructure
```

**Apps** (`/apps/`): Pages (routing glue), routes, app-wide layout
**Modules** (`/libs/modules/`): Feature sections, domain components, API, state, translations
**Infrastructure** (`/libs/sygnum-*/`, `/libs/suil/`): SUIL, Sygnum-Query, shared utilities

## Two Section Types

### Feature Sections (`libs/modules/<domain>/<app>/sections/`)
- ✅ Domain-specific business logic, state + API calls
- ✅ Composes 3+ components, has route/page context
- ❌ NOT reusable across domains

### CMS Sections (`libs/sygnum-shared-components/src/sections/`)
- ✅ Pure presentation (props → UI), reusable across all domains
- ❌ NO business logic, NO API calls or state

## Route → Page → Section Flow

```typescript
// Route (config)
element: <ThankYou />

// Page (glue, 4-10 LOC)
export const ThankYou: FC = () => <ThankYouSection />;

// Section (full implementation)
export const ThankYouSection: FC = () => {
  const { translations, handleAction } = useThankYouSection();
  return <Box>{/* Complete UI */}</Box>;
};
```

## Dependency Rules (CRITICAL)

### Module-to-Module Isolation
```typescript
// ❌ Cross-module import
import { BankingUtil } from '@modules/banking/bank-client';
// ✅ Use shared libraries
import { formatCurrency } from '@sygnum/sutils';
```

**Within same domain** (`banking/*`):
- ✅ `banking/bank-client` → `banking/local-shared` / `banking/global-shared-api`
- ❌ `banking/bank-client` → `banking/admin-panel`

### App-to-Module: Import sections only (public API)
```typescript
// ✅ Import section
import { TransactionsSection } from '@modules/banking/bank-client';
// ❌ Import internals
import { useHook } from '@modules/banking/bank-client/hooks';
```

### UI Library: Direct imports only
```typescript
// ✅ Direct SUIL import
import { Box } from '@sygnum/suil/components/layout/Box';
// ❌ Barrel import (breaks tree-shaking)
import { Box } from '@sygnum/suil';
// ❌ Direct MUI
import { Button } from '@mui/material';
```

## ESLint Boundary Enforcement

```json
{
  "@nx/enforce-module-boundaries": ["error", {
    "depConstraints": [
      { "sourceTag": "type:app", "onlyDependOnLibsWithTags": ["type:modules", "type:shared", "type:infrastructure"] },
      { "sourceTag": "type:modules", "onlyDependOnLibsWithTags": ["type:shared", "type:infrastructure"] }
    ]
  }]
}
```

## Module Public API

Export sections and types only:
```typescript
// libs/modules/banking/bank-client/src/index.ts
export * from './sections/transactions';
export type * from './basics/types/digitalBalances.type';
export * from './basics/constants/routes.constant';
// ❌ DO NOT export: internal components, hooks, utilities
```

## Decision Tree

```
Complete feature with business logic?
├─ YES → Feature Section (modules/*/sections/)
├─ NO → Generic presentation for CMS?
│   ├─ YES → CMS Section (shared/sections/)
│   └─ NO → Component (modules/*/components/)
└─ Pure UI primitive? → SUIL (libs/suil/)
```

## Verification

```bash
# Cross-module imports
grep -r "@modules/" libs/modules/banking/bank-client/src/ | grep -v "from '@modules/banking"
# Circular dependencies
npx madge --circular --extensions ts,tsx libs/modules/
# Barrel import audit
grep -r "from '@sygnum/suil'" libs/modules | grep -v "from '@sygnum/suil/components/"
```
