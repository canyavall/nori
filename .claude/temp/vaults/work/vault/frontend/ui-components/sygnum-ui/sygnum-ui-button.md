# Chakra Button

<\!--
Migrated from: libraries/chakra-button.md
Migration date: 2025-12-07
Original category: libraries
New category: patterns/frontend
-->

# Chakra UI Button Component

## Basic Usage

```tsx
import { Button } from '@chakra-ui/react'

function BasicButton() {
  return <Button>Click me</Button>
}
```

## Variants

```tsx
<Button variant="solid">Solid</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="subtle">Subtle</Button>
```

## Sizes

```tsx
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

## Color Schemes

```tsx
<Button colorScheme="blue">Blue</Button>
<Button colorScheme="red">Red</Button>
<Button colorScheme="green">Green</Button>
<Button colorScheme="gray">Gray</Button>
```

## Loading State

```tsx
<Button loading loadingText="Saving...">
  Save
</Button>

// Or just spinner
<Button loading>Save</Button>
```

## Disabled State

```tsx
<Button disabled>Disabled</Button>
```

## With Icons

```tsx
import { FiPlus, FiArrowRight } from 'react-icons/fi'

<Button>
  <FiPlus /> Add Item
</Button>

<Button>
  Next <FiArrowRight />
</Button>
```

## Button Group

```tsx
import { Group } from '@chakra-ui/react'

<Group attached>
  <Button>Left</Button>
  <Button>Center</Button>
  <Button>Right</Button>
</Group>
```

## Key Props

- `variant`: "solid" | "outline" | "ghost" | "subtle"
- `size`: "xs" | "sm" | "md" | "lg"
- `colorScheme`: Color palette (blue, red, green, etc.)
- `loading`: Show loading state
- `loadingText`: Text during loading
- `disabled`: Disable the button
- `type`: "button" | "submit" | "reset"
