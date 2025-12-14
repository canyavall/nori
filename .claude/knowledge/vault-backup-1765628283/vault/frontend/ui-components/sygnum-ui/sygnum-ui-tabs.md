# Chakra Tabs

<\!--
Migrated from: libraries/chakra-tabs.md
Migration date: 2025-12-07
Original category: libraries
New category: patterns/frontend
-->

# Chakra UI Tabs Component

## Basic Usage

```tsx
import { Tabs } from '@chakra-ui/react'

function BasicTabs() {
  return (
    <Tabs.Root defaultValue="tab1">
      <Tabs.List>
        <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
        <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
        <Tabs.Trigger value="tab3">Tab 3</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="tab1">
        Content for Tab 1
      </Tabs.Content>
      <Tabs.Content value="tab2">
        Content for Tab 2
      </Tabs.Content>
      <Tabs.Content value="tab3">
        Content for Tab 3
      </Tabs.Content>
    </Tabs.Root>
  )
}
```

## Component Structure

- `Tabs.Root` - Container with state management
- `Tabs.List` - Tab trigger container
- `Tabs.Trigger` - Individual tab button
- `Tabs.Content` - Content panel for each tab
- `Tabs.Indicator` - Visual indicator for active tab

## Controlled Tabs

```tsx
const [activeTab, setActiveTab] = useState('tab1')

<Tabs.Root
  value={activeTab}
  onValueChange={(e) => setActiveTab(e.value)}
>
  {/* ... */}
</Tabs.Root>
```

## Vertical Orientation

```tsx
<Tabs.Root orientation="vertical">
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  {/* ... */}
</Tabs.Root>
```

## Key Props

- `defaultValue`: Initial active tab (uncontrolled)
- `value`: Active tab (controlled)
- `onValueChange`: Callback when tab changes
- `orientation`: "horizontal" | "vertical"
- `variant`: Visual style variant
- `fitted`: Tabs fill available width
