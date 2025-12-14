# Chakra V3 Component Patterns

<!--
Migrated from: temp-FE-Mono/technical/chakra/chakra-v3-component-patterns.md
Migration date: 2025-12-08
Original category: technical/chakra
New category: patterns/frontend/chakra
Source repo: temp-FE-Mono
-->

# Chakra UI v3 Component Patterns

Component wrapping patterns for Chakra UI v3.3.x in the Sygnum design system.

## Key v3 Changes

**API Changes from v2**:
- `colorScheme` → `colorPalette`
- `extendTheme` → `createSystem + defineConfig`
- Compositional patterns (e.g., `Avatar.Root`, `Avatar.Image`)
- Recipe-based styling (not style props)

## Component Wrapper Structure

**File organization** (atomic design):
```
src/components/atoms/[Component]/
├── [Component].tsx         # Main implementation
├── [Component].type.ts     # TypeScript interfaces
├── [Component].style.ts    # Styling hook (useStyleConfig)
└── [Component].story.tsx   # Storybook stories
```

## Pattern: Simple Component (Badge)

**Type definition**:
```typescript
// Badge.type.ts
import { BadgeProps as ChakraBadgeProps } from '@chakra-ui/react';

export interface SygnumBadgeProps extends ChakraBadgeProps {
  textColor?: string;
  backgroundColor?: string;
  traceEventName?: string;  // Analytics
}
```

**Implementation**:
```typescript
// Badge.tsx
import { Badge as ChakraBadge } from '@chakra-ui/react';

export const Badge: FC<SygnumBadgeProps> = ({
  variant = 'solid',
  colorPalette = 'primary',
  children,
  ...rest
}) => (
  <ChakraBadge
    variant={variant}
    colorPalette={colorPalette}
    {...rest}
  >
    {children}
  </ChakraBadge>
);
```

## Pattern: Compositional Component (Avatar)

**v3 uses composition** (not monolithic):
```typescript
// Avatar.tsx
import { Avatar as ChakraAvatar, Float, Circle } from '@chakra-ui/react';

export const Avatar: FC<SygnumAvatarProps> = ({ src, name, isOnline }) => (
  <Float>
    <ChakraAvatar.Root>
      <ChakraAvatar.Image src={src} />
      <ChakraAvatar.Fallback>{name}</ChakraAvatar.Fallback>
    </ChakraAvatar.Root>
    {isOnline && <Circle bg="green.500" size="3" />}
  </Float>
);
```

**Note**: No `AvatarBadge` in v3 - use `Float + Circle` pattern.
