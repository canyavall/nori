---
tags:
  - component-patterns
  - mandatory-rules
  - best-practices
  - tsx
  - jsx
description: >-
  Mandatory React component patterns: named exports only, @sygnum/suil usage,
  BigNumber.js for financial calculations, i18n for all user-facing text, and
  type safety rules
required_knowledge: []
rules:
  - "**/*.tsx"
  - "!**/*.test.tsx"
  - "!**/*.spec.tsx"
  - "!**/*.story.tsx"
---
# Component Implementation Patterns

React component coding standards, patterns, and MANDATORY rules for Sygnum frontend.

## MANDATORY Rules

### Named Exports Only

Never use default exports (except Storybook meta):

```typescript
// ✅ CORRECT
export const UserProfile: FC<Props> = (props) => {};

// ❌ WRONG
export default UserProfile;
```

**Why**: Enables better IDE support, refactoring, and prevents naming inconsistencies.

### Use MUI Only Through @sygnum/suil

Never import HTML elements or MUI directly:

```typescript
// ✅ CORRECT
import { Box, Typography } from '@sygnum/suil';

// ❌ WRONG
import { Box } from '@mui/material';
import <div> directly in JSX
```

**Why**: Ensures design system consistency and centralized theme control.

### Financial Calculations with BigNumber.js

Never use native number arithmetic for money:

```typescript
// ✅ CORRECT
import BigNumber from 'bignumber.js';
const total = BigNumber(price).multipliedBy(quantity);

// ❌ WRONG
const total = price * quantity; // Precision loss!
```

**Why**: Prevents floating-point precision errors in financial calculations.

### Always Use i18n

Never hardcode user-facing strings:

```typescript
// ✅ CORRECT
const { t } = useTranslation();
<Typography>{t('user.profile.title')}</Typography>

// ❌ WRONG
<Typography>User Profile</Typography>
```

**Why**: Supports internationalization and centralized content management.

### Minimize Type Casting

Prefer type guards over `as`:

```typescript
// ✅ CORRECT - Type guard
if (typeof value === 'string') {
  return value.toUpperCase();
}

// ⚠️ Use sparingly - const assertions, DOM refs only
const config = { readonly: true } as const;
const ref = useRef() as RefObject<HTMLDivElement>;

// ❌ WRONG - Bypasses type safety
const data = response as UserData;
```

**Why**: Type guards maintain type safety; `as` bypasses TypeScript's checks and hides bugs.

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

### Import Types Separately

```typescript
// ✅ CORRECT
import type { FC } from 'react';
import { useState } from 'react';

// ❌ WRONG
import React, { FC } from 'react'; // Don't use React namespace
```

### Extract Props Types for Hooks

```typescript
// ✅ CORRECT
export const useComponentName = ({
  onClick
}: Pick<ComponentNameProps, 'onClick'>) => {
  // ...
};

// ❌ WRONG - Duplicating type definitions
export const useComponentName = ({
  onClick
}: { onClick: (id: string) => void }) => {
  // ...
};
```

### Explicit Prop Types

```typescript
// ✅ CORRECT
export const ComponentName: FC<ComponentNameProps> = (props) => {};

// ❌ WRONG - Implicit any
export const ComponentName = (props) => {};
```

## Design Documentation

**When to create design docs:**
- ❌ Do NOT create for straightforward components
- ✅ Only create for complex features requiring architectural decisions
- ✅ Create when: multiple approaches exist, significant tradeoffs, system-wide impact

**What to document:**
- Problem statement
- Approaches considered (with pros/cons)
- Chosen solution (with reasoning)
- Risks and mitigations
- Future considerations

Focus on "why" not "how" - code should be self-documenting for "how".

## Common Pitfalls

- ❌ Default exports (except Storybook meta)
- ❌ Direct MUI imports (use `@sygnum/suil`)
- ❌ Hardcoded strings (use i18n)
- ❌ Native number arithmetic for financial calculations (use BigNumber.js)
- ❌ Creating documentation for simple components
- ❌ Type casting with `as` (use type guards)
- ❌ Importing React namespace (`import React`)
