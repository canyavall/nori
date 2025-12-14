# Chakra Theme Config

<!--
Migrated from: temp-FE-Mono/technical/chakra/chakra-theme-config.md
Migration date: 2025-12-08
Original category: technical/chakra
New category: patterns/frontend/chakra
Source repo: temp-FE-Mono
-->

# Chakra Theme Config

Project-specific pattern for creating and organizing Chakra UI theme systems.

## File Structure

```
libs/sygnum-themes/src/themes/[theme-name]/
├── config.ts              # Main theme system (exports chakraDefaultConfig)
├── tokens.ts              # Design tokens
├── semantic-tokens.ts     # Semantic tokens
└── recipes/
    ├── badge.ts
    ├── avatar.ts
    └── icon-button.ts
```

## Config Pattern

Use `createSystem()` to combine `defaultConfig` with custom theme:

```typescript
import { createSystem, defaultConfig } from '@chakra-ui/react';
import { badgeRecipe } from './recipes/badge';
import { avatarRecipe } from './recipes/avatar';
import { semanticTokens } from './semantic-tokens';
import { tokens } from './tokens';

export const chakraDefaultConfig = createSystem(defaultConfig, {
  theme: {
    tokens,
    semanticTokens,
    recipes: {
      badge: badgeRecipe,
      avatar: avatarRecipe,
    },
  },
});
```

## Naming Convention

- Config export: `[themeName]Config` (e.g., `chakraDefaultConfig`)
- Directory: `kebab-case` (e.g., `chakra-default/`)
- Recipe imports: Named exports matching component name

## Integration with Existing Themes

Import color palettes from existing themes:

```typescript
import { sygnumDefaultColor } from '../sygnum-default/sygnumDefault.color';

export const tokens = defineTokens({
  colors: {
    primary: {
      500: { value: sygnumDefaultColor.primary500 },
    },
  },
});
```

## DO NOT

- ❌ Modify `defaultConfig` directly
- ❌ Mix theme organization patterns
- ❌ Create theme configs without semantic tokens
- ❌ Forget to export the config with descriptive name
