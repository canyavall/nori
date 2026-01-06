# Chakra Theme Recipes Provider

<!--
Migrated from: temp-FE-Mono/technical/chakra/chakra-theme-recipes-provider.md
Migration date: 2025-12-08
Original category: technical/chakra
New category: patterns/frontend/chakra
Source repo: temp-FE-Mono
-->

# Chakra UI Theme - Recipes & Provider

Component recipes, theme factory pattern, and provider setup for Chakra UI v3.3.x.

## Component Recipes

**Override default Chakra styles**:
```typescript
recipes: {
  badge: {
    base: { fontWeight: 'semibold' },  // Base styles
    variants: {
      variant: {
        solid: {
          bg: 'colorPalette.solid',
          color: 'colorPalette.contrast'
        },
        subtle: {
          bg: 'colorPalette.50',
          color: 'colorPalette.700'
        }
      }
    }
  }
}
```

## Theme Factory Pattern

**Match MUI pattern** (theme factory function):
```typescript
// src/themes/chakra-default/chakraDefault.theme.ts
export const createChakraDefaultSystem = (mode: 'light' | 'dark' = 'light') => {
  return createSystem(defaultConfig, defineConfig({
    theme: {
      semanticTokens: {
        colors: {
          bg: { value: mode === 'light' ? 'white' : 'gray.900' }
        }
      }
    }
  }));
};
```

## Provider Setup

```typescript
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@sygnum/sygnum-themes/chakra';

<ChakraProvider value={system}>
  <App />
</ChakraProvider>
```
