# Chakra Dialog

<\!--
Migrated from: libraries/chakra-dialog.md
Migration date: 2025-12-07
Original category: libraries
New category: patterns/frontend
-->

# Chakra UI Dialog Component

## Basic Usage

```tsx
import { Dialog } from '@chakra-ui/react'
import { useState } from 'react'

function BasicDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>Open Dialog</Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Content>
        <Dialog.Header>Dialog Title</Dialog.Header>
        <Dialog.Body>
          Dialog content goes here.
        </Dialog.Body>
        <Dialog.Footer>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>
            Confirm
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
```

## Component Structure

- `Dialog.Root` - Container managing dialog state
- `Dialog.Trigger` - Element that opens the dialog
- `Dialog.Backdrop` - Semi-transparent overlay
- `Dialog.Content` - Modal container
- `Dialog.Header` - Title area
- `Dialog.Body` - Main content section
- `Dialog.Footer` - Action buttons area
- `Dialog.CloseTrigger` - Close button

## Controlled Dialog

```tsx
const [isOpen, setIsOpen] = useState(false)

<Dialog.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
  {/* ... */}
</Dialog.Root>
```

## Key Props

- `open`: Controlled open state
- `onOpenChange`: Callback when open state changes
- `size`: Dialog size (sm, md, lg, xl, full)
- `placement`: Position (center, top, bottom)
- `closeOnOverlayClick`: Close when clicking backdrop
- `closeOnEsc`: Close on Escape key
