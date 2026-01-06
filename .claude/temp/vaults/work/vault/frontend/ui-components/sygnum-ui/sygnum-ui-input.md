# Chakra Input

<\!--
Migrated from: libraries/chakra-input.md
Migration date: 2025-12-07
Original category: libraries
New category: patterns/frontend
-->

# Chakra UI Input Component

## Basic Usage

```tsx
import { Input } from '@chakra-ui/react'

function BasicInput() {
  return <Input placeholder="Enter text" />
}
```

## With Field (Label + Error)

```tsx
import { Field, Input } from '@chakra-ui/react'

function InputWithField() {
  return (
    <Field.Root>
      <Field.Label>Email</Field.Label>
      <Input type="email" placeholder="Enter email" />
      <Field.ErrorText>Email is required</Field.ErrorText>
    </Field.Root>
  )
}
```

## Controlled Input

```tsx
const [value, setValue] = useState('')

<Input
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

## Input Types

```tsx
<Input type="text" placeholder="Text" />
<Input type="email" placeholder="Email" />
<Input type="password" placeholder="Password" />
<Input type="number" placeholder="Number" />
<Input type="tel" placeholder="Phone" />
<Input type="search" placeholder="Search" />
```

## Sizes

```tsx
<Input size="xs" placeholder="Extra Small" />
<Input size="sm" placeholder="Small" />
<Input size="md" placeholder="Medium" />
<Input size="lg" placeholder="Large" />
```

## Variants

```tsx
<Input variant="outline" placeholder="Outline" />
<Input variant="filled" placeholder="Filled" />
<Input variant="flushed" placeholder="Flushed" />
```

## With Addons

```tsx
import { InputGroup, InputLeftAddon, InputRightAddon } from '@chakra-ui/react'

<InputGroup>
  <InputLeftAddon>https://</InputLeftAddon>
  <Input placeholder="website.com" />
</InputGroup>

<InputGroup>
  <Input placeholder="Amount" />
  <InputRightAddon>.00</InputRightAddon>
</InputGroup>
```

## Key Props

- `value`: Input value (controlled)
- `defaultValue`: Initial value (uncontrolled)
- `onChange`: Change handler
- `placeholder`: Placeholder text
- `type`: Input type
- `size`: "xs" | "sm" | "md" | "lg"
- `variant`: "outline" | "filled" | "flushed"
- `disabled`: Disable input
- `readOnly`: Read-only mode
- `invalid`: Show error state
