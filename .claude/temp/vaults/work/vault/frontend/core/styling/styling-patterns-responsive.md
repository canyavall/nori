# Styling Patterns - Responsive & Layout

Responsive design patterns, media queries, and layout components using SX props.

## Responsive Design

```typescript
import { useMediaQuery } from '@sygnum/suil';

const isMobile = useMediaQuery(breakpoints.down('sm'));
const isTablet = useMediaQuery(breakpoints.between('sm', 'md'));
const isDesktop = useMediaQuery(breakpoints.up('md'));

// Responsive SX
const responsiveSx: SxProps = {
  padding: {
    xs: spacings.spacing2,  // Mobile: 16px
    sm: spacings.spacing3,  // Tablet: 24px
    md: spacings.spacing4,  // Desktop: 32px
  },
  fontSize: {
    xs: transformPxToRem(14),
    md: transformPxToRem(16),
  },
};

// Conditional rendering
{isMobile ? <MobileView /> : <DesktopView />}
```

## Layout Patterns

```typescript
// Card/Container
const cardSx: SxProps = {
  padding: spacings.spacing3,
  backgroundColor: palette.background.paper,
  borderRadius: '8px',
  boxShadow: shadows[1],
};

// Flex: Row / Column / Centered
const rowSx: SxProps = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacings.spacing2,
};

const columnSx: SxProps = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacings.spacing2,
};

const centeredSx: SxProps = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
};

// Grid (responsive)
const gridSx: SxProps = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(3, 1fr)',
  },
  gap: spacings.spacing3,
};
```
