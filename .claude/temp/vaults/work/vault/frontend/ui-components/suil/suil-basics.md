# Suil Basics

<!--
Migrated from: temp-FE-Mono/technical/suil/suil-basics.md
Migration date: 2025-12-08
Original category: technical/suil
New category: patterns/frontend/suil
Source repo: temp-FE-Mono
-->

# Suil - Basics

Sygnum's design system and UI component library built on MUI.

## When to Use

- Implementing UI components with Sygnum's design system
- Creating layouts with Box, Stack, Grid components
- Using form inputs and controls
- Working with buttons, dialogs, alerts
- Building responsive interfaces

## Core Principles

### NEVER Import MUI Directly

❌ Wrong: `import { Button } from '@mui/material';`
✅ Correct: `import { Button } from '@sygnum/suil/components/atoms/Button';`

### Always Use Direct Imports

❌ Wrong: `import { Box, Typography } from '@sygnum/suil';`
✅ Correct:

```typescript
import { Box } from '@sygnum/suil/components/layout/Box';
import { Typography } from '@sygnum/suil/components/atoms/Typography';
```

## Mandatory Styling Pattern

Always use separate `.style.ts` file with `useComponentNameStyle()` hook:

```typescript
// ComponentName.style.ts
import { SxProps } from '@sygnum/suil';
import { useTheme } from '@sygnum/sygnum-themes';

export const useComponentNameStyle = () => {
  const { spacings, palette, transformPxToRem } = useTheme();

  const containerSx: SxProps = {
    padding: spacings.spacing2,
    backgroundColor: palette.background.paper,
    fontSize: transformPxToRem(16),
  };

  return { containerSx };
};
```

## MUI System Exports

```typescript
import {
  styled,           // Styled components
  alpha,            // Color opacity helper
  hexToRgb,         // Color conversion
  GlobalStyles,     // Global CSS
  SxProps,          // Type for sx prop
  CSSObject         // Type for CSS objects
} from '@sygnum/suil';
```

## Testing

Use `dataTestId` prop:

```typescript
<Button dataTestId="submit-btn" onClick={handleSubmit}>Submit</Button>

// In test
const button = screen.getByTestId('submit-btn');
```
