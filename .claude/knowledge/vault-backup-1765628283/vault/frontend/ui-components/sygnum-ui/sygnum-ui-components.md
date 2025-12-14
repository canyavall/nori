# Chakra Components

<\!--
Migrated from: libraries/chakra-components.md
Migration date: 2025-12-07
Original category: libraries
New category: patterns/frontend
-->

# Chakra UI Components Overview

## Component Categories

### Layout
- **Box**: Base building block with style props
- **Flex**: Flexbox container
- **Grid**: CSS Grid container
- **Stack**: Vertical/horizontal stacking (VStack, HStack)
- **Container**: Max-width centered container
- **Center**: Centers content

### Typography
- **Text**: Text content with style props
- **Heading**: Heading elements (h1-h6)
- **Code**: Inline code styling

### Form Controls
- **Input**: Text input fields
- **Button**: Interactive buttons
- **Checkbox**: Check/uncheck options
- **Radio**: Single selection from options
- **Select**: Dropdown selection
- **Textarea**: Multi-line text input
- **Switch**: Toggle on/off

### Feedback
- **Alert**: Status messages
- **Toast**: Temporary notifications
- **Spinner**: Loading indicator
- **Skeleton**: Loading placeholder
- **Progress**: Progress indicator

### Overlay
- **Dialog**: Modal dialogs
- **Drawer**: Slide-out panels
- **Popover**: Contextual overlays
- **Tooltip**: Hover information
- **Menu**: Dropdown menus

### Disclosure
- **Tabs**: Tabbed content
- **Accordion**: Collapsible sections

## Style Props Pattern

All components accept style props directly:

```tsx
<Box
  p={4}           // padding
  m={2}           // margin
  bg="blue.500"   // background
  color="white"   // text color
  borderRadius="md"
>
  Content
</Box>
```

## Composition Pattern

Chakra components use dot notation for sub-components:

```tsx
<Dialog.Root>
  <Dialog.Backdrop />
  <Dialog.Content>
    <Dialog.Header>Title</Dialog.Header>
    <Dialog.Body>Content</Dialog.Body>
    <Dialog.Footer>Actions</Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```
