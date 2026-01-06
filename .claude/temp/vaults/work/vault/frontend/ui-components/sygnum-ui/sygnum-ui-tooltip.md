# Sygnum UI Tooltip

Chakra UI Tooltip component for Sygnum platform.

## Import

```tsx
import { Tooltip } from '@sygnum/sygnum-ui/components/overlay/Tooltip';
```

## Usage

```tsx
<Tooltip.Root>
  <Tooltip.Trigger asChild>
    <Button>Hover me</Button>
  </Tooltip.Trigger>
  <Tooltip.Positioner>
    <Tooltip.Content>
      <Tooltip.Arrow />
      Tooltip text
    </Tooltip.Content>
  </Tooltip.Positioner>
</Tooltip.Root>
```

## Variants

```tsx
<Tooltip.Content variant="slate">Slate (default)</Tooltip.Content>
<Tooltip.Content variant="base">Base</Tooltip.Content>
```

## Positioning

```tsx
<Tooltip.Root positioning={{ placement: 'top' }}>  {/* Default */}
  <Tooltip.Root positioning={{ placement: 'bottom' }}>
    <Tooltip.Root positioning={{ placement: 'left' }}>
      <Tooltip.Root positioning={{ placement: 'right' }}>
```

## With Headline

```tsx
<Tooltip.Content>
  <Tooltip.Arrow />
  <Box fontWeight="bold" marginBottom="4px">Headline</Box>
  Tooltip text
</Tooltip.Content>
```

## Migration from MUI

**MUI**:

```tsx
<Tooltip title="My tooltip" arrow>
  <Button>Hover</Button>
</Tooltip>
```

**Chakra**:

```tsx
<Tooltip.Root>
  <Tooltip.Trigger asChild>
    <Button>Hover</Button>
  </Tooltip.Trigger>
  <Tooltip.Positioner>
    <Tooltip.Content>
      <Tooltip.Arrow />
      My tooltip
    </Tooltip.Content>
  </Tooltip.Positioner>
</Tooltip.Root>
```
