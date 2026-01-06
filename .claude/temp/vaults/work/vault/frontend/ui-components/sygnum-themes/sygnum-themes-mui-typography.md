# Sygnum Themes Typography

<!--
Migrated from: temp-FE-Mono/technical/sygnum-themes/sygnum-themes-typography.md
Migration date: 2025-12-08
Original category: technical/sygnum-themes
New category: patterns/sygnum/sygnum-themes
Source repo: temp-FE-Mono
-->

# Sygnum Themes - Typography

Typography system and font styles.

## Typography System

```typescript
const { typography } = useTheme();

// Font families
typography.fontFamily        // Main font
typography.fontFamilyMono    // Monospace font

// Font sizes
typography.fontSize.xs       // Extra small
typography.fontSize.sm       // Small
typography.fontSize.md       // Medium
typography.fontSize.lg       // Large
typography.fontSize.xl       // Extra large

// Font weights
typography.fontWeight.light     // 300
typography.fontWeight.regular   // 400
typography.fontWeight.medium    // 500
typography.fontWeight.bold      // 700

// Line heights
typography.lineHeight.tight     // 1.2
typography.lineHeight.normal    // 1.5
typography.lineHeight.relaxed   // 1.75
```

## Typography Variants

```typescript
import { Typography } from '@sygnum/suil/components/atoms/Typography';

<Typography variant="h1">Heading 1</Typography>
<Typography variant="h2">Heading 2</Typography>
<Typography variant="h3">Heading 3</Typography>
<Typography variant="body1">Body text</Typography>
<Typography variant="body2">Small body text</Typography>
<Typography variant="caption">Caption text</Typography>
```

## In Style Objects

```typescript
const textSx: SxProps = {
  fontFamily: typography.fontFamily,
  fontSize: transformPxToRem(16),
  fontWeight: typography.fontWeight.medium,
  lineHeight: typography.lineHeight.normal,
};
```
