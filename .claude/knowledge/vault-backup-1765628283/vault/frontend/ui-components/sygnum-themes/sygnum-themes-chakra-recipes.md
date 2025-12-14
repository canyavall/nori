# Chakra Theme Recipes

<!--
Migrated from: temp-FE-Mono/technical/chakra/chakra-theme-recipes.md
Migration date: 2025-12-08
Original category: technical/chakra
New category: patterns/frontend/chakra
Source repo: temp-FE-Mono
-->

# Chakra Theme Recipes

Project-specific patterns for creating component recipes with multi-variant styles.

## Recipe Location

```
libs/sygnum-themes/src/themes/[theme-name]/recipes/[component].ts
```

Example: `libs/sygnum-themes/src/themes/chakra-default/recipes/badge.ts`

## Recipe Structure

Use `defineRecipe()` with `base`, `variants`, and `defaultVariants`:

```typescript
import { defineRecipe } from '@chakra-ui/react';

export const badgeRecipe = defineRecipe({
  base: {
    display: 'inline-flex',
    fontWeight: 'semibold',
    fontSize: 'xs',
    borderRadius: '4px',
  },
  variants: {
    variant: {
      solid: {
        bg: 'colorPalette.500',
        color: 'white',
      },
      outline: {
        borderWidth: '1px',
        borderColor: 'colorPalette.500',
      },
    },
    size: {
      sm: { px: '1.5', py: '0.5' },
      md: { px: '2', py: '0.5' },
    },
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md',
  },
});
```

## Registering Recipes

Add to theme config:

```typescript
import { createSystem, defaultConfig } from '@chakra-ui/react';
import { badgeRecipe } from './recipes/badge';

export const config = createSystem(defaultConfig, {
  theme: {
    tokens,
    semanticTokens,
    recipes: {
      badge: badgeRecipe,
    },
  },
});
```

## Dark Mode Pattern

Use `_dark` condition for dark mode variants:

```typescript
subtle: {
  bg: 'colorPalette.100',
  color: 'colorPalette.800',
  _dark: {
    bg: 'colorPalette.800',
    color: 'colorPalette.100',
  },
},
```

## DO NOT

- ❌ Use slot recipes for single-element components
- ❌ Omit `defaultVariants` (always define defaults)
- ❌ Hardcode colors (use `colorPalette` or token references)
