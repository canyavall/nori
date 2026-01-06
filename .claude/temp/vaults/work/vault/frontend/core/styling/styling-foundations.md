# Styling Foundations

Core principles and patterns for component styling with Sygnum theme system and SX props.

## Core Principles

### 1. Always Use Theme System

```typescript
// ✅ Correct
import { useTheme } from '@sygnum/sygnum-themes';

// ❌ Wrong
import { useTheme } from '@mui/material';
```

### 2. Use SUIL Components

```typescript
// ✅ Correct
import { Box, Typography, Button } from '@sygnum/suil';

// ❌ Wrong
<div><p>Text</p><button>Click</button></div>
```

### 3. Styling Approaches (in order of preference)

1. **Inline props** - Simple, one-off styles
2. **SX objects in style hooks** - Reusable styles (preferred)
3. **Media queries** - Use `useMediaQuery` hook

## Style File Pattern

```
ComponentName/
├── ComponentName.tsx
├── ComponentName.style.ts    # Export useComponentNameStyle hook
├── ComponentName.type.ts
```

### Style Hook

```typescript
// ComponentName.style.ts
import { SxProps } from '@sygnum/suil';
import { useTheme } from '@sygnum/sygnum-themes';

export const useComponentNameStyle = () => {
  const { palette, spacings, transformPxToRem } = useTheme();

  const wrapperSx: SxProps = {
    padding: spacings.spacing4,
    backgroundColor: palette.background.paper,
    borderRadius: '8px',
  };

  const titleSx: SxProps = {
    fontSize: transformPxToRem(24),
    fontWeight: 600,
    color: palette.text.primary,
    marginBottom: spacings.spacing2,
  };

  return { wrapperSx, titleSx };
};
```

### Using Style Hook

```typescript
// ComponentName.tsx
import { Box, Typography } from '@sygnum/suil';
import { useComponentNameStyle } from './ComponentName.style';

export const ComponentName = () => {
  const { wrapperSx, titleSx } = useComponentNameStyle();

  return (
    <Box sx={wrapperSx}>
      <Typography sx={titleSx}>Title</Typography>
    </Box>
  );
};
```
