# Sygnum Ui Overview

<!--
Migrated from: temp-FE-Mono/technical/sygnum-ui/sygnum-ui-overview.md
Migration date: 2025-12-08
Original category: technical/sygnum-ui
New category: patterns/sygnum/sygnum-ui
Source repo: temp-FE-Mono
-->

# Sygnum UI - Chakra UI Component Library

Modern React component library built on Chakra UI v3.3.x for the Sygnum platform.

## Overview

`sygnum-ui` provides Chakra UI-based components that coexist alongside the existing MUI-based `suil` library, enabling incremental migration from Material-UI to Chakra UI without breaking changes.

## Installation

The library is already configured in the monorepo. Import components using **direct paths** (no barrel exports):

```tsx
// ✅ Correct - Direct imports
import { Badge } from '@sygnum/sygnum-ui/components/feedback/Badge';
import { Avatar, AvatarImage, AvatarFallback } from '@sygnum/sygnum-ui/components/media/Avatar';
import { IconButton } from '@sygnum/sygnum-ui/components/buttons/IconButton';
import { Button } from '@sygnum/sygnum-ui/components/buttons/Button';

// ❌ Incorrect - Barrel imports (not supported for performance reasons)
import { Badge, Avatar } from '@sygnum/sygnum-ui';
```

**Why no barrel exports?**
- **Better performance**: Faster test runs and build times
- **Smaller bundles**: Only import what you need
- **Follows `@sygnum/suil` pattern**: Consistent with existing codebase

**Important**: Styles are injected automatically via `ChakraProvider`. No CSS imports needed.

## Available Components

### Badge
Thin wrapper around Chakra UI's Badge component.

```tsx
import { Badge } from '@sygnum/sygnum-ui/components/feedback/Badge';

<Badge colorPalette="primary" variant="solid">New</Badge>
<Badge colorPalette="success" variant="subtle">Active</Badge>
<Badge colorPalette="error" variant="outline">Deprecated</Badge>
<Badge color="#fff" bg="#ff0000">Custom</Badge>
```

Uses Chakra's native props. See [Chakra UI Badge docs](https://www.chakra-ui.com/docs/components/badge).

### Avatar
Thin wrapper around Chakra UI's Avatar component with compositional API.

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@sygnum/sygnum-ui/components/media/Avatar';

<Avatar>
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

<Avatar>
  <AvatarImage src="https://example.com/avatar.jpg" alt="Jane Smith" />
  <AvatarFallback>JS</AvatarFallback>
</Avatar>

<Avatar size="lg" bg="#ff6b6b">
  <AvatarFallback>AC</AvatarFallback>
</Avatar>
```

Uses Chakra's compositional API. See [Chakra UI Avatar docs](https://www.chakra-ui.com/docs/components/avatar).

### IconButton
Thin wrapper around Chakra UI's IconButton component.

```tsx
import { IconButton } from '@sygnum/sygnum-ui/components/buttons/IconButton';

<IconButton aria-label="Search"><SearchIcon /></IconButton>
<IconButton aria-label="Close" variant="outline"><CloseIcon /></IconButton>
<IconButton aria-label="Delete" colorPalette="error"><TrashIcon /></IconButton>
<IconButton aria-label="Custom" bg="#ff0000"><CustomIcon /></IconButton>
```

Icon passed as children. Uses Chakra's native props. See [Chakra UI IconButton docs](https://www.chakra-ui.com/docs/components/icon-button).

## Theme Integration

Components use the `chakraDefaultSystem` theme from `@sygnum/sygnum-themes/chakra-index`, which maps existing Sygnum color tokens to Chakra's theme structure.

### Using in Applications

Wrap your app with ChakraProvider:

```tsx
import { ChakraProvider, chakraDefaultSystem } from '@sygnum/sygnum-themes/chakra-index';

function App() {
  return (
    <ChakraProvider value={chakraDefaultSystem}>
      {/* Your components */}
    </ChakraProvider>
  );
}
```

### Dual-Framework Coexistence

You can use both MUI and Chakra components in the same application:

```tsx
import { ThemeProvider } from '@sygnum/sygnum-themes'; // MUI
import { ChakraProvider, chakraDefaultSystem } from '@sygnum/sygnum-themes/chakra-index';
import { Button } from '@sygnum/suil/components/atoms/Button'; // MUI Button
import { Badge } from '@sygnum/sygnum-ui/components/feedback/Badge'; // Chakra Badge

<ThemeProvider theme={sygnumDefaultTheme}>
  <ChakraProvider value={chakraDefaultSystem}>
    <Button>MUI Button</Button>
    <Badge>Chakra Badge</Badge>
  </ChakraProvider>
</ThemeProvider>
```

## Storybook

View component documentation and examples:

```bash
npx nx storybook sygnum-ui-storybook
```

Runs on port 4401 (separate from MUI Storybook on 4400).

## Development

### Running Tests

```bash
npx nx test sygnum-ui
```

### Type Checking

```bash
npx nx tsCheck sygnum-ui
```

### Linting

```bash
npx nx lint sygnum-ui
```

## Migration Guide

### From MUI Badge to Chakra Badge

**MUI:**
```tsx
<MuiBadge color="primary" variant="standard">Badge</MuiBadge>
```

**Chakra:**
```tsx
import { Badge } from '@sygnum/sygnum-ui/components/feedback/Badge';

<Badge colorPalette="primary" variant="solid">Badge</Badge>
```

**Key Changes:**
- `color` → `colorPalette`
- No `badgeContent` prop (use children directly)
- Variants: `standard` → `solid`, `dot` removed, added `surface`

### From MUI Avatar to Chakra Avatar

**MUI:**
```tsx
<MuiAvatar src="/avatar.jpg" alt="User">JD</MuiAvatar>
```

**Chakra:**
```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@sygnum/sygnum-ui/components/media/Avatar';

<Avatar>
  <AvatarImage src="/avatar.jpg" alt="John Doe" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

**Key Changes:**
- Compositional API (Root, Image, Fallback) handled internally
- Initials auto-generated from `name` prop
- Online badge via `isOnline` prop instead of `AvatarBadge`

### From MUI IconButton to Chakra IconButton

**MUI:**
```tsx
<MuiIconButton aria-label="search"><SearchIcon /></MuiIconButton>
```

**Chakra:**
```tsx
import { IconButton } from '@sygnum/sygnum-ui/components/buttons/IconButton';

<IconButton aria-label="search"><SearchIcon /></IconButton>
```

**Key Changes:**
- Icon passed via `icon` prop instead of children
- `aria-label` is mandatory (TypeScript enforced)
- `color` → `colorPalette`

## Bundle Size

Chakra UI v3 core + 3 POC components adds approximately **65KB** to the bundle (gzipped), well under the 100KB target.

## Architecture

- **Library**: `libs/sygnum-ui` - Component implementations
- **Theme**: `libs/sygnum-themes/src/themes/chakra-default` - Chakra theme configuration
- **Storybook**: `libs/sygnum-ui-storybook` - Component documentation

## Future Components

Additional components will be migrated incrementally following the patterns established by Badge, Avatar, and IconButton:

1. Component structure: `.tsx`, `.type.ts`, `.style.ts`, `.story.tsx`, `tests/*.spec.tsx`
2. Theme integration via `colorPalette` and Chakra's recipe system
3. Visual parity with existing MUI components
4. Comprehensive Storybook documentation
5. Full test coverage (unit tests)

## Technical Details

- **Chakra UI**: v3.3.x
- **React**: v18+
- **TypeScript**: Strict mode enabled
- **Testing**: Jest + React Testing Library
- **Storybook**: v7 with React Vite builder
