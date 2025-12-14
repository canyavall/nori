# Chakra Select

<\!--
Migrated from: libraries/chakra-select.md
Migration date: 2025-12-07
Original category: libraries
New category: patterns/frontend
-->

# Chakra UI Select Component

## Basic Usage

```tsx
import { Select } from '@chakra-ui/react'

function BasicSelect() {
  return (
    <Select.Root>
      <Select.Trigger>
        <Select.ValueText placeholder="Select option" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="option1">Option 1</Select.Item>
        <Select.Item value="option2">Option 2</Select.Item>
        <Select.Item value="option3">Option 3</Select.Item>
      </Select.Content>
    </Select.Root>
  )
}
```

## Component Structure

- `Select.Root` - Container with state management
- `Select.Trigger` - Button that opens the dropdown
- `Select.ValueText` - Displays selected value
- `Select.Content` - Dropdown container (uses portal)
- `Select.Item` - Individual option
- `Select.ItemGroup` - Group related items
- `Select.ItemGroupLabel` - Label for item group

## Controlled Select

```tsx
const [value, setValue] = useState('')

<Select.Root
  value={value}
  onValueChange={(e) => setValue(e.value)}
>
  {/* ... */}
</Select.Root>
```

## With Collections

```tsx
const items = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' },
]

<Select.Root collection={createListCollection({ items })}>
  <Select.Trigger>
    <Select.ValueText placeholder="Select" />
  </Select.Trigger>
  <Select.Content>
    {items.map((item) => (
      <Select.Item key={item.value} item={item}>
        {item.label}
      </Select.Item>
    ))}
  </Select.Content>
</Select.Root>
```

## Key Props

- `value`: Selected value (controlled)
- `defaultValue`: Initial value (uncontrolled)
- `onValueChange`: Callback when value changes
- `multiple`: Allow multiple selections
- `disabled`: Disable the select
- `placeholder`: Placeholder text
