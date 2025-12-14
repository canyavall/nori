# Sygnum Themes Colors

<!--
Migrated from: temp-FE-Mono/technical/sygnum-themes/sygnum-themes-colors.md
Migration date: 2025-12-08
Original category: technical/sygnum-themes
New category: patterns/sygnum/sygnum-themes
Source repo: temp-FE-Mono
-->

# Sygnum Themes - Colors

Color system and palette usage.

## Color Palette

```typescript
const { palette } = useTheme();

// Primary colors
palette.primary.main       // Main brand color
palette.primary.light      // Lighter variant
palette.primary.dark       // Darker variant
palette.primary.contrastText  // Text on primary

// Secondary colors
palette.secondary.main
palette.secondary.light
palette.secondary.dark

// Status colors
palette.success.main       // Green
palette.error.main         // Red
palette.warning.main       // Orange
palette.info.main          // Blue

// Neutral colors
palette.grey[50]           // Lightest grey
palette.grey[100]
// ... through
palette.grey[900]          // Darkest grey

// Background
palette.background.default // Page background
palette.background.paper   // Card/surface background

// Text
palette.text.primary       // Main text color
palette.text.secondary     // Secondary text
palette.text.disabled      // Disabled text
```

## Usage in Styles

```typescript
const containerSx: SxProps = {
  backgroundColor: palette.background.paper,
  borderColor: palette.grey[300],
  color: palette.text.primary,

  '&:hover': {
    backgroundColor: palette.primary.light,
  },
};
```

## Dark Mode Colors

Colors automatically adjust in dark mode.

```typescript
// Automatically adapts to dark mode
backgroundColor: palette.background.paper
```
