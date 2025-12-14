# Suil Layouts

<!--
Migrated from: temp-FE-Mono/technical/suil/suil-layouts.md
Migration date: 2025-12-08
Original category: technical/suil
New category: patterns/frontend/suil
Source repo: temp-FE-Mono
-->

# Suil - Layouts & Responsive Design

Layout components and responsive design patterns.

## Layout Components

```typescript
import { Box } from '@sygnum/suil/components/layout/Box';
import { Stack } from '@sygnum/suil/components/layout/Stack';
import { Grid } from '@sygnum/suil/components/layout/Grid';

<Box sx={containerSx}>Content</Box>

<Stack spacing={3} direction="column">{children}</Stack>

<Grid container spacing={2}>
  <Grid item xs={12} md={6}>Left</Grid>
  <Grid item xs={12} md={6}>Right</Grid>
</Grid>
```

## Breakpoints

- **xs**: 0px (mobile)
- **sm**: 600px (tablet)
- **md**: 900px (desktop)
- **lg**: 1200px (large desktop)
- **xl**: 1536px (extra large)

## Responsive Styling

```typescript
const containerSx: SxProps = {
  display: { xs: 'none', md: 'block' },
  padding: {
    xs: spacings.spacing1,
    sm: spacings.spacing2,
    md: spacings.spacing3
  },
  flexDirection: { xs: 'column', md: 'row' },
};
```

## Screen Size Hooks

```typescript
import { useCurrentBreakpointKey } from '@sygnum/suil/hooks/useCurrentBreakpointKey';
import { useScreenSize } from '@sygnum/suil/hooks/useScreenSize';

const breakpoint = useCurrentBreakpointKey(); // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
const { isMobile, isTabletOrMobile, isDesktop } = useScreenSize();

return isMobile ? <MobileView /> : <DesktopView />;
```

## Common Pitfalls

**Importing from MUI directly** - Always import from `@sygnum/suil`
**Importing from root package** - Use direct imports for tree shaking
**Inline sx objects** - Always use `.style.ts` file with hooks
**Using px values directly** - Use `transformPxToRem()` from `useTheme()`
**Hardcoded spacing values** - Use `spacings` from `useTheme()`
**Hardcoded colors** - Use `palette` from `useTheme()`
