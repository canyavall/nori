# Chakra Setup

<\!--
Migrated from: libraries/chakra-setup.md
Migration date: 2025-12-07
Original category: libraries
New category: patterns/frontend
-->

# Chakra UI Setup

## Installation

```bash
npm i @chakra-ui/react @emotion/react
```

**Requirements:** Node 20.x or higher

## Add UI Snippets

```bash
npx @chakra-ui/cli snippet add
```

## Provider Setup

Wrap your app root with the Provider component:

```tsx
import { Provider } from "@/components/ui/provider"

function App({ children }) {
  return <Provider>{children}</Provider>
}
```

The Provider bundles:
- Chakra theme configuration
- Emotion CSS-in-JS setup
- Default styling layer composition
- Reset and base styles
- Design tokens (colors, spacing, typography)
- Light/dark mode support

## Vite Configuration

For Vite projects, ensure proper setup in `vite.config.ts`:

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
})
```

## Key Concepts

- **Emotion**: Chakra uses Emotion for CSS-in-JS styling
- **Design Tokens**: Pre-configured spacing, colors, typography scales
- **Recipes**: Component variant patterns
- **Color Modes**: Built-in light/dark theme support
