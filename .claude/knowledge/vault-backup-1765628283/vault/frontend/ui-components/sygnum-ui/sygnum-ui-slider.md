# Chakra Slider

<\!--
Migrated from: libraries/chakra-slider.md
Migration date: 2025-12-07
Original category: libraries
New category: patterns/frontend
-->

# Chakra UI Slider Component

## Basic Usage

```tsx
import { Slider } from '@chakra-ui/react'

function BasicSlider() {
  return (
    <Slider.Root defaultValue={[50]}>
      <Slider.Track>
        <Slider.Range />
      </Slider.Track>
      <Slider.Thumb index={0} />
    </Slider.Root>
  )
}
```

## Component Structure

- `Slider.Root` - Container with state management
- `Slider.Track` - Background track
- `Slider.Range` - Filled portion of track
- `Slider.Thumb` - Draggable handle
- `Slider.Label` - Label for the slider
- `Slider.ValueText` - Display current value
- `Slider.MarkerGroup` - Container for markers
- `Slider.Marker` - Individual marker

## Controlled Slider

```tsx
const [value, setValue] = useState([50])

<Slider.Root
  value={value}
  onValueChange={(e) => setValue(e.value)}
>
  <Slider.Track>
    <Slider.Range />
  </Slider.Track>
  <Slider.Thumb index={0} />
</Slider.Root>
```

## Range Slider (Two Thumbs)

```tsx
<Slider.Root defaultValue={[25, 75]}>
  <Slider.Track>
    <Slider.Range />
  </Slider.Track>
  <Slider.Thumb index={0} />
  <Slider.Thumb index={1} />
</Slider.Root>
```

## With Min/Max and Step

```tsx
<Slider.Root
  min={0}
  max={100}
  step={5}
  defaultValue={[50]}
>
  {/* ... */}
</Slider.Root>
```

## Key Props

- `value`: Current value array (controlled)
- `defaultValue`: Initial value array (uncontrolled)
- `onValueChange`: Callback when value changes
- `min`: Minimum value (default: 0)
- `max`: Maximum value (default: 100)
- `step`: Step increment (default: 1)
- `orientation`: "horizontal" | "vertical"
- `disabled`: Disable the slider
