---
tags:
  - chakra-ui
  - sx-props
  - theme-tokens
  - style
  - styles
  - styling
  - ts
description: >-
  Sygnum styling patterns: style hook pattern, theme tokens, dynamic styles,
  and Chakra UI token usage
required_knowledge: []
rules:
  - "**/themes/**/*.ts"
  - "**/*.style.{ts,tsx}"
---
# Styling Project Conventions

Sygnum-specific styling patterns with theme system and SX props.

## MANDATORY: Import Rules

```typescript
// ✅ Always @sygnum/sygnum-themes (NOT MUI directly)
import { useTheme } from '@sygnum/sygnum-themes';
// ✅ Always @sygnum/suil components (NOT HTML)
import { Box, Typography, Button } from '@sygnum/suil';
```

## MANDATORY: Style Hook Pattern

```
ComponentName/
├── ComponentName.tsx
├── ComponentName.style.ts    # Export useComponentNameStyle hook
├── ComponentName.type.ts
```

```typescript
// ComponentName.style.ts
import { SxProps } from '@sygnum/suil';
import { useTheme } from '@sygnum/sygnum-themes';

export const useComponentNameStyle = () => {
  const { palette, spacings, transformPxToRem } = useTheme();

  const wrapperSx: SxProps = {
    padding: spacings.spacing4,
    backgroundColor: palette.background.paper,
  };

  const titleSx: SxProps = {
    fontSize: transformPxToRem(24),
    color: palette.text.primary,
    marginBottom: spacings.spacing2,
  };

  return { wrapperSx, titleSx };
};
```

## Theme Tokens (MUI)

```typescript
const { palette, spacings, shadows, typography, breakpoints, transformPxToRem } = useTheme();

// Spacing: spacing0_5 (4px), spacing1 (8px), spacing2 (16px), spacing3 (24px), spacing4 (32px)
// Breakpoints: xs (0), sm (600), md (960), lg (1280), xl (1920)
// Typography: transformPxToRem(16), typography.fontWeightMedium
// Palette: palette.background.default/paper, palette.text.primary/secondary, palette.primary.main/light/dark
```

## Dynamic Styles Based on Props

```typescript
export const useCardStyle = ({ isActive, variant }: StyleProps) => {
  const { palette, spacings } = useTheme();
  const cardSx: SxProps = {
    padding: spacings.spacing3,
    backgroundColor: isActive ? palette.primary.light : palette.background.paper,
    border: variant === 'outlined' ? `1px solid ${palette.divider}` : 'none',
  };
  return { cardSx };
};
```

## Chakra UI Token Usage (sygnum-ui)

When using Chakra components, always use named tokens:

```typescript
// ✅ Tokens          // ❌ Hardcoded
padding="4"           // padding="16px"
borderRadius="md"     // borderRadius="6px"
bg="primary.500"      // bg="#DF2A4F"
```

Token categories: spacing (`0`-`32`), radii (`none`-`full`), colors (`{palette}.{shade}`), typography (`md`, `medium`).

For full token reference, see `sygnum-themes-chakra-tokens`.

## Common Pitfalls

- Hardcoded colors/spacing → Use theme tokens
- Import `useTheme` from MUI → Use `@sygnum/sygnum-themes`
- Raw HTML elements → Use `@sygnum/suil`
- `styled-components` or CSS files → Use SX props + style hooks
- Complex SX in JSX → Move to style hook
- Hardcoded px → Use `transformPxToRem()` (MUI) or tokens (Chakra)
