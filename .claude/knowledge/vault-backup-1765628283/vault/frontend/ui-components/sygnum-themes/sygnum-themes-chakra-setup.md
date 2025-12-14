# Chakra Theme Setup

<!--
Migrated from: temp-FE-Mono/technical/chakra/chakra-theme-setup.md
Migration date: 2025-12-08
Original category: technical/chakra
New category: patterns/frontend/chakra
Source repo: temp-FE-Mono
-->

# Chakra UI Theme - Setup & Tokens

Theme system setup, color token mapping, and semantic tokens for Chakra UI v3.3.x.

## Theme Creation (v3 API)

**Use `createSystem + defineConfig`** (not `extendTheme`):
```typescript
import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    tokens: { /* colors, fonts, spacing */ },
    semanticTokens: { /* light/dark responsive tokens */ },
    recipes: { /* component variants */ }
  }
});

export const system = createSystem(defaultConfig, config);
```

## Color Token Mapping

**Sygnum uses 50-900 scales** (matches Chakra):
```typescript
// Existing: sygnumDefaultColor
primary50: '#FCE4E9'
primary100: '#F7B6C6'
// ... primary500, primary900

// Maps to Chakra tokens:
tokens: {
  colors: {
    primary: {
      '50': { value: '#FCE4E9' },
      '100': { value: '#F7B6C6' },
      '500': { value: '{primary500}' },  // Main color
      '900': { value: '{primary900}' }
    }
  }
}
```

**Semantic tokens** (light/dark responsive):
```typescript
semanticTokens: {
  colors: {
    'colorPalette.solid': {
      value: {
        _light: '{colors.colorPalette.500}',
        _dark: '{colors.colorPalette.200}'
      }
    }
  }
}
```
