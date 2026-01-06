# Tooltip UX Guidelines

**Source**: Figma Design System
**Component**: Tooltip (Chakra UI)

## Properties

| Property | Values | Default |
|----------|--------|---------|
| variant | slate / base | slate |
| direction | top / bottom / left / right | bottom |
| headline | false / true | false |

## Variants

**Slate (default)**: Dark background (slate/600), white text, strong contrast
**Base**: Light background (background.surface), white text, border (border/700), subtle appearance

## Usage

### Label
- All tooltips must have text
- Keep concise (1-2 lines max, <60 chars)
- Use sentence case
- No period unless multiple sentences

### Headline
- Optional, use only for grouped/categorized info
- Appears bold above main text
- Example: Category name as headline, description as body

### Direction
- Auto-aligns arrow based on placement
- **bottom** (default): slides up from below
- **top**: slides down from above
- **left/right**: slides from respective side

### Offset
- Default: 8px on desktop between tip and target

## Behaviors

**Animation**: Smooth fade and slide from trigger element
**Timing**: Consistent duration for show/hide
**Trigger**: Hover (desktop), focus (keyboard), tap (touch if supported)
**Auto-dismiss**: On escape key

## Accessibility

- Appear on hover and focus
- No interactive elements (use Popover instead)
- Brief text for screen readers
- Min touch target: 44x44px (WCAG 2.1)

## Best Practices

**Do:**
- Supplementary information only
- Keep under 60 characters
- Position to avoid obscuring UI
- Use headline sparingly

**Don't:**
- Critical information (show directly instead)
- Interactive content
- Repeat visible labels
- Use when info always needed

## Implementation

```tsx
// Basic
<Tooltip.Root>
  <Tooltip.Trigger asChild><IconButton>?</IconButton></Tooltip.Trigger>
  <Tooltip.Positioner>
    <Tooltip.Content><Tooltip.Arrow />Info text</Tooltip.Content>
  </Tooltip.Positioner>
</Tooltip.Root>

// With headline
<Tooltip.Content>
  <Tooltip.Arrow />
  <Box fontWeight="bold" marginBottom="4px">Headline</Box>
  Description text
</Tooltip.Content>

// Base variant
<Tooltip.Content variant="base">
  <Tooltip.Arrow />Less prominent info
</Tooltip.Content>

// Position
<Tooltip.Root positioning={{ placement: 'top' }}>
  <Tooltip.Trigger asChild><Button>Top</Button></Tooltip.Trigger>
  <Tooltip.Positioner>
    <Tooltip.Content><Tooltip.Arrow />Above</Tooltip.Content>
  </Tooltip.Positioner>
</Tooltip.Root>
```
