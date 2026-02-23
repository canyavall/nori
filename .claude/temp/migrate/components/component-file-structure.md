---
tags:
  - component-architecture
  - file-structure
  - organization
  - naming-conventions
  - barrel-files
  - tsx
  - jsx
description: >-
  React component file organization: one component per folder, file naming
  conventions (.hook.ts, .type.ts, .style.ts), subcomponent structure, and
  barrel file prohibition
required_knowledge: []
rules:
  - "**/*.tsx"
  - "!**/*.test.tsx"
  - "!**/*.spec.tsx"
  - "!**/*.story.tsx"
---
# Component File Structure

React component organization, file structure, and naming conventions for Sygnum frontend.

## 🔴 CRITICAL: Creating Components is NOT Complete Until Integration

**UNIVERSAL RULE: Applies to ALL React code**

When creating OR refactoring components, pages, sections, or hooks:

**ANY component work is ONLY complete when**:
1. ✅ New files created with correct structure
2. ✅ New component is imported and used (not dead code)
3. ✅ Old component/code is replaced (if refactoring)
4. ✅ Old files are deleted (if refactoring)
5. ✅ Tests verify component works

**Verification** (mandatory for refactoring):
```bash
# Verify new component is used
grep -r "YourNewComponent" libs/ apps/
# Must find imports! If not → dead code

# Verify old component is gone (if refactoring)
grep -r "YourOldComponent" libs/ apps/
# Must find nothing! If matches → incomplete
```

## Standard Component Organization

```
ComponentName/
├── ComponentName.tsx              # UI (required)
├── ComponentName.hook.ts          # Logic (optional)
├── ComponentName.type.ts          # Types (required)
├── ComponentName.style.ts         # Styles (optional)
├── ComponentName.constant.ts      # Constants (optional)
├── components/                    # Subcomponents (optional)
│   ├── SubComponent/
│   └── AnotherSubComponent/
└── tests/
    └── ComponentName.spec.tsx     # Tests (required)
```

## File Naming Conventions

**Component folder naming**:
- Folder name MUST match component name exactly (PascalCase)
- Example: `UserProfile/` contains `UserProfile.tsx` (NOT `userProfile/` or `user-profile/`)

**Component files use this pattern:**
- `.tsx` - Component UI
- `.hook.ts` OR `.hook.tsx` - Custom hooks (see extension rule below)
- `.type.ts` - TypeScript types (NOT `.types.ts`)
- `.style.ts` - Styling logic (NOT `.styles.ts`)
- `.constant.ts` - Constants
- `.spec.tsx` - Tests

**NEVER plural**: Use `.style.ts` NOT `.styles.ts`, `.type.ts` NOT `.types.ts`

### Hook File Extension Rule (.ts vs .tsx)

**CRITICAL: Use correct extension based on content**

**Use `.hook.tsx` when**:
- Hook contains JSX (React elements)
- Hook returns JSX in data structures
- Hook renders icons or components

**Use `.hook.ts` when**:
- Hook contains only logic (no JSX)
- Hook only manages state/data
- No React elements used

**Examples**:

```typescript
// ✅ MUST be .hook.tsx (contains JSX)
export const useSlides = () => {
  return [
    {
      icon: <CheckIcon />,        // ← JSX! Must be .tsx
      title: 'Slide 1',
    },
  ];
};

// ✅ Can be .hook.ts (no JSX)
export const useFormLogic = () => {
  const [value, setValue] = useState('');
  return { value, setValue };
};
```

## Organization Rules

### One Component Per Folder

Each folder contains ONE main component:

```
✅ CORRECT
UserProfile/
├── UserProfile.tsx
└── UserProfile.type.ts

❌ WRONG - Multiple components in one folder
User/
├── UserProfile.tsx
├── UserSettings.tsx
└── UserAvatar.tsx
```

### One Export Per File

Component/hook/constant files export ONE thing:

```typescript
// ✅ ComponentName.tsx
export const UserProfile: FC<Props> = (props) => {};

// ✅ ComponentName.hook.ts
export const useUserProfile = () => {};
```

### Multiple Exports Allowed

For utils, types, validators, transformers, configs:

```typescript
// ✅ validation.util.ts
export const validateEmail = (email: string) => boolean;
export const validatePhone = (phone: string) => boolean;
export const validateZip = (zip: string) => boolean;
```

### Subcomponents in Subfolder

Never at same level as parent:

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
├── UserHeader.tsx       # Don't put subcomponents here
└── UserDetails.tsx      # They belong in components/
```

### NO Barrel Files (CRITICAL)

**FORBIDDEN**: Never use `index.ts` for re-exports:

```typescript
// ❌ FORBIDDEN - Barrel file pattern
// index.ts
export { UserProfile } from './UserProfile';
export { UserSettings } from './UserSettings';
export * from './utils';
```

**Why forbidden**:
- Hard to find actual implementation
- Prevents tree-shaking
- Creates circular dependencies
- Slows down builds
- Confuses IDE navigation

**Use direct imports** from source files:

```typescript
// ✅ CORRECT - Import directly from implementation
import { UserProfile } from '@sygnum/suil/UserProfile/UserProfile';
import { validateEmail } from '@sygnum/utils/validators/email';
```

**Exception**: Package entry points can use `index.ts` for controlled public API, defined in `package.json` subpath exports:

```json
{
  "exports": {
    ".": "./src/main-entry.ts",
    "./utils": "./src/utils/index.ts"
  }
}
```

## File Structure Examples

### Simple Component

```
Button/
├── Button.tsx
├── Button.type.ts
└── tests/
    └── Button.spec.tsx
```

### Component with Logic

```
UserForm/
├── UserForm.tsx
├── UserForm.hook.ts
├── UserForm.type.ts
└── tests/
    └── UserForm.spec.tsx
```

### Component with Styles

```
Card/
├── Card.tsx
├── Card.hook.ts
├── Card.type.ts
├── Card.style.ts
└── tests/
    └── Card.spec.tsx
```

### Complex Component with Subcomponents

```
Dashboard/
├── Dashboard.tsx
├── Dashboard.hook.ts
├── Dashboard.type.ts
├── Dashboard.constant.ts
├── components/
│   ├── DashboardHeader/
│   │   ├── DashboardHeader.tsx
│   │   └── DashboardHeader.type.ts
│   ├── DashboardContent/
│   │   ├── DashboardContent.tsx
│   │   └── DashboardContent.type.ts
│   └── DashboardFooter/
│       ├── DashboardFooter.tsx
│       └── DashboardFooter.type.ts
└── tests/
    └── Dashboard.spec.tsx
```

## Common Pitfalls

- ❌ Multiple components in one folder
- ❌ Barrel files (`index.ts` re-exports)
- ❌ Subcomponents at same level as parent (use `components/` subfolder)
- ❌ Using `.styles.ts` or `.types.ts` (wrong suffix - use `.style.ts`, `.type.ts`)
- ❌ Plural filenames (`.hooks.ts`, `.constants.ts`)
