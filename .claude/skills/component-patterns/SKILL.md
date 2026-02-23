---
name: component-patterns
description: Component file structure, one-component-per-folder organization, hook/style/type file conventions, subcomponent patterns, and mandatory implementation rules.
globs: 'packages/app/src/**/*.tsx'
alwaysApply: false
---

# Component Patterns

File structure, organization rules, and implementation patterns for UI components.

---

## CRITICAL: Component Work is NOT Complete Until Integration

**ANY component work is ONLY complete when**:
1. ✅ New files created with correct structure
2. ✅ New component is imported and used (not dead code)
3. ✅ Old component/code is replaced (if refactoring)
4. ✅ Old files are deleted (if refactoring)
5. ✅ Tests verify component works

---

## Standard Component Organization

```
ComponentName/
├── ComponentName.tsx              # UI (required)
├── ComponentName.hook.ts          # Logic (optional; .tsx if hook returns JSX)
├── ComponentName.type.ts          # Types (required)
├── ComponentName.style.ts         # Styles (optional)
├── ComponentName.constant.ts      # Constants (optional)
├── components/                    # Subcomponents (optional)
│   ├── SubComponent/
│   └── AnotherSubComponent/
└── tests/
    └── ComponentName.spec.tsx     # Tests (required)
```

---

## File Naming Conventions

- Folder name MUST match component name exactly (PascalCase)
- `.tsx` — Component UI
- `.hook.ts` / `.hook.tsx` — Custom hook (use `.tsx` when hook contains JSX)
- `.type.ts` — TypeScript types (NOT `.types.ts`)
- `.style.ts` — Styling logic (NOT `.styles.ts`)
- `.constant.ts` — Constants
- `.spec.tsx` — Tests

### Hook File Extension Rule

**Use `.hook.tsx`** when hook returns JSX elements or renders icons/components.
**Use `.hook.ts`** when hook contains only logic (no JSX).

---

## Organization Rules

### One Component Per Folder

```
✅ CORRECT
UserProfile/
├── UserProfile.tsx
└── UserProfile.type.ts

❌ WRONG — Multiple components in one folder
User/
├── UserProfile.tsx
├── UserSettings.tsx
└── UserAvatar.tsx
```

### One Export Per Component/Hook File

```typescript
// ✅ ComponentName.tsx
export const UserProfile: Component<Props> = (props) => {};

// ✅ ComponentName.hook.ts
export const useUserProfile = () => {};
```

### Multiple Exports Allowed

For utils, types, validators, transformers, configs:
```typescript
// ✅ validation.util.ts
export const validateEmail = (email: string) => boolean;
export const validatePhone = (phone: string) => boolean;
```

### Subcomponents in Subfolder

```
✅ CORRECT
UserProfile/
├── UserProfile.tsx
└── components/
    ├── UserHeader/
    │   ├── UserHeader.tsx
    │   └── UserHeader.type.ts
    └── UserDetails/
        ├── UserDetails.tsx
        └── UserDetails.type.ts

❌ WRONG
UserProfile/
├── UserProfile.tsx
├── UserHeader.tsx       # Subcomponents must go in components/
└── UserDetails.tsx
```

### NO Barrel Files (CRITICAL)

```typescript
// ❌ FORBIDDEN — Barrel file pattern
// index.ts
export { UserProfile } from './UserProfile';
export { UserSettings } from './UserSettings';

// ✅ CORRECT — Import directly from implementation
import { UserProfile } from './UserProfile/UserProfile';
```

---

## Implementation Patterns

### Component File (.tsx)

```typescript
import type { Component } from 'solid-js';
import { useComponentName } from './ComponentName.hook';
import type { ComponentNameProps } from './ComponentName.type';

export const ComponentName: Component<ComponentNameProps> = (props) => {
  const { handleClick, isActive } = useComponentName(props);

  return (
    <div onClick={handleClick}>
      {props.title}
    </div>
  );
};
```

### Types File (.type.ts)

```typescript
export interface ComponentNameProps {
  title: string;
  onClick: (id: string) => void;
  variant?: 'primary' | 'secondary';
}
```

### Hook File (.hook.ts)

```typescript
import { createSignal } from 'solid-js';
import type { ComponentNameProps } from './ComponentName.type';

export const useComponentName = (props: ComponentNameProps) => {
  const [isActive, setIsActive] = createSignal(false);

  const handleClick = () => {
    setIsActive(true);
    props.onClick('item-id');
  };

  return { handleClick, isActive };
};
```

---

## MANDATORY Rules

### Named Exports Only

```typescript
// ✅ CORRECT
export const UserProfile: Component<Props> = (props) => {};

// ❌ WRONG
export default UserProfile;
```

### Minimize Type Casting

Prefer type guards over `as`:
```typescript
// ✅ CORRECT — Type guard
if (typeof value === 'string') {
  return value.toUpperCase();
}

// ❌ WRONG — Bypasses type safety
const data = response as UserData;
```

### Import Types Separately

```typescript
// ✅ CORRECT
import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
```

### Extract Props Types for Hooks

```typescript
// ✅ CORRECT
export const useComponentName = (props: Pick<ComponentNameProps, 'onClick'>) => {};

// ❌ WRONG — Duplicating type definitions
export const useComponentName = (props: { onClick: (id: string) => void }) => {};
```

---

## Common Pitfalls

- ❌ Multiple components in one folder
- ❌ Barrel files (`index.ts` re-exports)
- ❌ Subcomponents at same level as parent (use `components/` subfolder)
- ❌ Using `.styles.ts` or `.types.ts` (wrong suffix)
- ❌ Plural filenames (`.hooks.ts`, `.constants.ts`)
- ❌ Default exports
- ❌ Importing framework namespace directly
