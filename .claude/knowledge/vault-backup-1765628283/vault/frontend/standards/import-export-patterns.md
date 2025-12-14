# Import/Export Patterns

Import and export standards for Sygnum frontend. All rules are MANDATORY.

## Critical Rule: NO Barrel Files

**FORBIDDEN**: Barrel files (`index.ts` re-exporting from other files)

```typescript
// ❌ FORBIDDEN: Barrel file pattern
export { ComponentA } from './ComponentA';
export { ComponentB } from './ComponentB';
export * from './utils';
```

**Why forbidden**: Hard to find implementation, prevents tree-shaking, creates circular dependencies, slows builds, confuses IDE.

**Use direct imports** from source files:
```typescript
// ✅ CORRECT: Import directly from implementation
import { UserProfile } from '@sygnum/suil/UserProfile/UserProfile';
import { validateEmail } from '@sygnum/utils/validators/email';
```

## Export Rules

**Named exports only** (NO default exports):
```typescript
// ✅ CORRECT: Named export
export const UserProfile: FC<Props> = (props) => { };

// ❌ FORBIDDEN: Default export
export default UserProfile;
```

**One export per component/hook file**:
```typescript
// UserProfile.tsx
export const UserProfile: FC<Props> = (props) => { };
```

**Multiple exports OK** for utilities/types/validators:
```typescript
// validators.ts
export const validateEmail = (email: string) => boolean;
export const validatePhone = (phone: string) => boolean;
```

## Library Entry Points

**Use package.json subpath exports** (NOT barrel files):
```json
{
  "exports": {
    ".": "./src/main-entry.ts",
    "./utils": "./src/utils/index.ts"
  }
}
```

**Exception**: Package entry points can use `index.ts` for controlled public API.

## Common Violations

- ❌ Creating `index.ts` to re-export components
- ❌ Using `export * from` patterns
- ❌ Default exports anywhere
- ❌ Namespace imports (`import * as Utils`)
