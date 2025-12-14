# Sygnum Themes Basics

<!--
Migrated from: temp-FE-Mono/technical/sygnum-themes/sygnum-themes-basics.md
Migration date: 2025-12-08
Original category: technical/sygnum-themes
New category: patterns/sygnum/sygnum-themes
Source repo: temp-FE-Mono
-->

# Sygnum Themes - Basics

Theme design system with colors, typography, and dark mode.

## Core Hook: useTheme

```typescript
import { useTheme } from '@sygnum/sygnum-themes';

const {
  palette,
  spacings,
  typography,
  transformPxToRem,
  breakpoints,
  shadows,
  mode,
  toggleMode,
} = useTheme();
```

## Design Token System

All styling MUST use theme tokens, never hardcoded values.

```typescript
// ❌ Wrong
const style = {
  padding: '16px',
  color: '#1976d2',
  fontSize: '14px',
};

// ✅ Correct
const style = {
  padding: spacings.spacing2,
  color: palette.primary.main,
  fontSize: transformPxToRem(14),
};
```

## Pixel to Rem Conversion (MANDATORY)

```typescript
// Always convert px to rem
const fontSize = transformPxToRem(16); // '1rem'
const padding = transformPxToRem(24); // '1.5rem'

// In style objects
const containerSx: SxProps = {
  padding: transformPxToRem(16),
  fontSize: transformPxToRem(14),
  lineHeight: transformPxToRem(20),
};
```
