# Component Architecture

Complete guide for React component organization, structure, and patterns in Sygnum frontend.

## MANDATORY Rules

### Code Standards

**Named exports only** - Never use default exports (except Storybook meta):
```typescript
// ✅ Correct
export const UserProfile: FC<Props> = (props) => {};

// ❌ Wrong
export default UserProfile;
```
*Why: Enables better IDE support, refactoring, and prevents naming inconsistencies.*

**Use MUI only through @sygnum/suil** - Never import HTML elements or MUI directly:
```typescript
// ✅ Correct
import { Box, Typography } from '@sygnum/suil';

// ❌ Wrong
import { Box } from '@mui/material';
import <div> directly in JSX
```
*Why: Ensures design system consistency and centralized theme control.*

**Financial calculations with BigNumber.js** - Never use native number arithmetic for money:
```typescript
// ✅ Correct
import BigNumber from 'bignumber.js';
const total = BigNumber(price).multipliedBy(quantity);

// ❌ Wrong
const total = price * quantity; // Precision loss!
```
*Why: Prevents floating-point precision errors in financial calculations.*

**Always use i18n** - Never hardcode user-facing strings:
```typescript
// ✅ Correct
const { t } = useTranslation();
<Typography>{t('user.profile.title')}</Typography>

// ❌ Wrong
<Typography>User Profile</Typography>
```
*Why: Supports internationalization and centralized content management.*

**Minimize type casting** - Prefer type guards over `as`:
```typescript
// ✅ Correct - Type guard
if (typeof value === 'string') {
  return value.toUpperCase();
}

// ⚠️ Use sparingly - const assertions, DOM refs only
const config = { readonly: true } as const;
const ref = useRef() as RefObject<HTMLDivElement>;

// ❌ Wrong - Bypasses type safety
const data = response as UserData;
```
*Why: Type guards maintain type safety; `as` bypasses TypeScript's checks and hides bugs.*

## File Structure

### Standard Component Organization

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

### File Naming Conventions

**Component files** use this pattern:
- `.tsx` - Component UI
- `.hook.ts` - Custom hooks (NOT `.hooks.ts`)
- `.type.ts` - TypeScript types (NOT `.types.ts`)
- `.style.ts` - Styling logic (NOT `.styles.ts`)
- `.constant.ts` - Constants
- `.spec.tsx` - Tests

### Organization Rules

**One component per folder** - Each folder contains ONE main component:
```
✅ Correct
UserProfile/
├── UserProfile.tsx
└── UserProfile.type.ts

❌ Wrong - Multiple components in one folder
User/
├── UserProfile.tsx
├── UserSettings.tsx
└── UserAvatar.tsx
```

**One export per file** - Component/hook/constant files export ONE thing:
```typescript
// ✅ ComponentName.tsx
export const UserProfile: FC<Props> = (props) => {};

// ✅ ComponentName.hook.ts
export const useUserProfile = () => {};
```

**Multiple exports allowed** - For utils, types, validators, transformers, configs:
```typescript
// ✅ validation.util.ts
export const validateEmail = (email: string) => boolean;
export const validatePhone = (phone: string) => boolean;
export const validateZip = (zip: string) => boolean;
```

**Subcomponents in subfolder** - Never at same level as parent:
```
✅ Correct
UserProfile/
├── UserProfile.tsx
└── components/
    ├── UserHeader/
    │   ├── UserHeader.tsx
    │   └── UserHeader.type.ts
    └── UserDetails/
        ├── UserDetails.tsx
        └── UserDetails.type.ts

❌ Wrong
UserProfile/
├── UserProfile.tsx
├── UserHeader.tsx       # Don't put subcomponents here
└── UserDetails.tsx      # They belong in components/
```

**No barrel files** - Never use `index.ts` for re-exports:
```typescript
// ❌ Wrong - No index.ts barrel files
// index.ts
export { UserProfile } from './UserProfile';
export { UserSettings } from './UserSettings';
```
*Why: Barrel files obscure imports, hurt tree-shaking, and slow down builds.*

## Component Implementation Pattern

### Component File (.tsx)

```typescript
import type { FC } from 'react';
import { Box, Typography } from '@sygnum/suil';
import { useComponentName } from './ComponentName.hook';
import { useComponentNameStyle } from './ComponentName.style';
import type { ComponentNameProps } from './ComponentName.type';

export const ComponentName: FC<ComponentNameProps> = ({
  title,
  onClick,
  variant = 'primary'
}) => {
  const { handleClick, isActive } = useComponentName({ onClick });
  const { containerSx } = useComponentNameStyle({ variant, isActive });

  return (
    <Box sx={containerSx} onClick={handleClick}>
      <Typography>{title}</Typography>
    </Box>
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

export interface ComponentNameStyleProps {
  variant: 'primary' | 'secondary';
  isActive: boolean;
}
```

### Hook File (.hook.ts)

```typescript
import { useState, useCallback } from 'react';
import type { ComponentNameProps } from './ComponentName.type';

export const useComponentName = ({
  onClick
}: Pick<ComponentNameProps, 'onClick'>) => {
  const [isActive, setIsActive] = useState(false);

  const handleClick = useCallback(() => {
    setIsActive(true);
    onClick('item-id');
  }, [onClick]);

  return { handleClick, isActive };
};
```

### Style File (.style.ts)

```typescript
import { useTheme } from '@sygnum/suil';
import type { SxProps } from '@sygnum/suil';
import type { ComponentNameStyleProps } from './ComponentName.type';

export const useComponentNameStyle = ({
  variant,
  isActive
}: ComponentNameStyleProps) => {
  const { palette } = useTheme();

  const containerSx: SxProps = {
    padding: 2,
    backgroundColor: isActive
      ? palette.primary.main
      : palette.background.paper,
  };

  return { containerSx };
};
```

## TypeScript Patterns

**Import types separately**:
```typescript
// ✅ Correct
import type { FC } from 'react';
import { useState } from 'react';

// ❌ Wrong
import React, { FC } from 'react'; // Don't use React namespace
```

**Extract props types for hooks**:
```typescript
// ✅ Correct
export const useComponentName = ({
  onClick
}: Pick<ComponentNameProps, 'onClick'>) => {
  // ...
};

// ❌ Wrong - Duplicating type definitions
export const useComponentName = ({
  onClick
}: { onClick: (id: string) => void }) => {
  // ...
};
```

**Explicit prop types**:
```typescript
// ✅ Correct
export const ComponentName: FC<ComponentNameProps> = (props) => {};

// ❌ Wrong - Implicit any
export const ComponentName = (props) => {};
```

## Design Documentation

**When to create design docs**:
- ❌ Do NOT create for straightforward components
- ✅ Only create for complex features requiring architectural decisions
- ✅ Create when: multiple approaches exist, significant tradeoffs, system-wide impact

**What to document**:
- Problem statement
- Approaches considered (with pros/cons)
- Chosen solution (with reasoning)
- Risks and mitigations
- Future considerations

Focus on "why" not "how" - code should be self-documenting for "how".

## Common Pitfalls

- ❌ Multiple components in one folder
- ❌ Barrel files (`index.ts` re-exports)
- ❌ Subcomponents at same level as parent (use `components/` subfolder)
- ❌ Using `.styles.ts` or `.types.ts` (wrong suffix - use `.style.ts`, `.type.ts`)
- ❌ Creating documentation for simple components
- ❌ Default exports (except Storybook meta)
- ❌ Direct MUI imports (use `@sygnum/suil`)
- ❌ Hardcoded strings (use i18n)
- ❌ Native number arithmetic for financial calculations (use BigNumber.js)
