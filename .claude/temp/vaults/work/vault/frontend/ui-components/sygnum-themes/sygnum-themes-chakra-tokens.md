# Chakra Theme Tokens

<!--
Migrated from: temp-FE-Mono/technical/chakra/chakra-theme-tokens.md
Migration date: 2025-12-08
Original category: technical/chakra
New category: patterns/frontend/chakra
Source repo: temp-FE-Mono
-->

# Chakra Theme Tokens

Project-specific patterns for defining design tokens in Chakra UI themes.

## Location Pattern

```
libs/sygnum-themes/src/themes/[theme-name]/
├── config.ts              # System config
├── tokens.ts              # Design tokens
├── semantic-tokens.ts     # Semantic tokens
└── recipes/               # Component recipes
```

## Token Structure

Use `defineTokens()` with nested objects. Each token requires a `value` key:

```typescript
import { defineTokens } from '@chakra-ui/react';

export const tokens = defineTokens({
  colors: {
    primary: {
      50: { value: '#f0f9ff' },
      500: { value: '#0ea5e9' },
      900: { value: '#0c4a6e' },
    },
  },
  fonts: {
    heading: { value: 'Neusa, Roboto, sans-serif' },
    body: { value: 'Roboto, sans-serif' },
  },
  fontSizes: {
    xs: { value: '0.75rem' },
    md: { value: '1rem' },
  },
});
```

## Semantic Tokens

Use `defineSemanticTokens()` for context-aware tokens with light/dark modes:

```typescript
import { defineSemanticTokens } from '@chakra-ui/react';

export const semanticTokens = defineSemanticTokens({
  colors: {
    bg: {
      DEFAULT: {
        value: { _light: '{colors.white}', _dark: '{colors.secondary.900}' },
      },
      subtle: {
        value: { _light: '{colors.secondary.50}', _dark: '{colors.secondary.800}' },
      },
    },
    fg: {
      DEFAULT: {
        value: { _light: '{colors.secondary.900}', _dark: '{colors.white}' },
      },
    },
  },
});
```

**Pattern:** Use `DEFAULT` for base nested token, reference tokens with `{colors.name.shade}`.

## DO NOT

- ❌ Define token values directly without `value` key
- ❌ Mix token types in wrong categories
- ❌ Use inline values in semantic tokens (always reference)
