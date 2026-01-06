# Styling Theme Tokens

Theme system tokens for colors, spacing, typography, and other design primitives.

## Theme System

```typescript
const {
  palette,          // Colors
  spacings,         // Spacing values
  shadows,          // Box shadows
  typography,       // Fonts
  breakpoints,      // Responsive breakpoints
  transformPxToRem, // px → rem
} = useTheme();
```

## Colors (Palette)

```typescript
// ✅ Use palette, never hardcoded colors
const cardSx: SxProps = {
  backgroundColor: palette.background.paper,
  color: palette.text.primary,
  borderColor: palette.divider,
};

// Common palette properties
palette.background.default / palette.background.paper
palette.text.primary / palette.text.secondary / palette.text.disabled
palette.primary.main / palette.primary.light / palette.primary.dark
palette.error.main / palette.warning.main / palette.success.main / palette.info.main
palette.divider / palette.common.white / palette.common.black
```

## Spacing

```typescript
// ✅ Use spacings, never magic numbers
const containerSx: SxProps = {
  padding: spacings.spacing4,      // 32px
  marginBottom: spacings.spacing2, // 16px
  gap: spacings.spacing1,          // 8px
};

// Available spacings:
// spacing0_5 (4px), spacing1 (8px), spacing1_5 (12px)
// spacing2 (16px), spacing3 (24px), spacing4 (32px)
// spacing5 (40px), spacing6 (48px)
```

## Typography

```typescript
// ✅ Use transformPxToRem for font sizes
const textSx: SxProps = {
  fontSize: transformPxToRem(16),
  fontWeight: typography.fontWeightMedium, // 500
  fontFamily: typography.fontFamily,
};

// Font weights:
// fontWeightLight (300), fontWeightRegular (400)
// fontWeightMedium (500), fontWeightBold (700)
```

## Shadows

```typescript
// Use predefined shadows
const cardSx: SxProps = {
  boxShadow: shadows[1], // Subtle elevation
  // shadows[0] through shadows[24] available
};
```

## Breakpoints

```typescript
// Breakpoint values
breakpoints.values.xs  // 0px
breakpoints.values.sm  // 600px
breakpoints.values.md  // 960px
breakpoints.values.lg  // 1280px
breakpoints.values.xl  // 1920px

// Helper methods
breakpoints.up('sm')      // @media (min-width: 600px)
breakpoints.down('md')    // @media (max-width: 959px)
breakpoints.between('sm', 'md') // Between 600px and 960px
```
