---
description: Create new Chakra UI component in sygnum-ui from Figma design
argument-hint: <figma-folder-path>
---

# Chakra Component Creation Command

Creates a complete Chakra UI component in sygnum-ui from a Figma design, including component implementation, recipe, tests, Storybook story, and knowledge documentation.

**Goal**: Enable incremental MUI → Chakra migration with consistent component structure.

## Prerequisites

User must provide:
- Path to folder containing Figma design images (screenshots/exports)
- Component name (e.g., "Chip", "Card", "Switch")
- Target Chakra category (buttons, feedback, forms, layout, media, typography)

## Step 0: Load Figma Images

List all images in the provided folder:

```bash
# List all images in folder
fd -e png -e jpg -e jpeg -e svg . <figma-folder-path>
```

Display all found images to user for reference during design analysis.

## Step 1: Analyze Figma Design

**Priority**: Visual design from Figma images is the source of truth.

With all images visible, ask:

### Required Design Questions

1. **Component name**: What is this component called? (PascalCase, e.g., "Chip", "Card")
2. **Category**: Which Chakra category? (buttons/feedback/forms/layout/media/typography)
3. **MUI equivalent**: Does this replace an existing MUI component? If yes, which one? (e.g., "MuiBadge", "MuiChip")
4. **Variants**: What visual variants do you see in Figma? (e.g., solid, outline, ghost)
5. **Sizes**: What sizes are shown? (e.g., xs, sm, md, lg, xl)
6. **Color schemes**: What color schemes are visible? (primary, success, error, etc.)
7. **States**: What states are shown? (default, hover, focus, active, disabled, loading)
8. **Compositional?**: Is this a single element or multiple sub-parts?

Extract from Figma:
- **Spacing** (padding, gaps) from visual inspection
- **Typography** (font size, weight) from visual inspection
- **Colors** (background, text, borders) from visual inspection
- **Border radius** from visual inspection
- **Shadows** if visible

**Output**: Design specification summary for user confirmation.

## Step 2: Investigate Existing Implementations (If MUI equivalent exists)

### A. Check suil (MUI version)

```bash
mcp__serena__find_symbol \
  --name_path_pattern <MuiComponentName> \
  --relative_path libs/suil/src/components
```

Read implementation to understand:
- Props structure (for compatibility)
- Variants and behavior
- Use cases (for knowledge docs)

**Note**: Figma design takes priority over MUI patterns. Only reference MUI for:
- Understanding existing prop names (for migration guide)
- Finding existing usage patterns

### B. Check sygnum-themes (default theme)

```bash
mcp__serena__search_for_pattern \
  --substring_pattern "<MuiComponent>" \
  --relative_path libs/sygnum-themes/src/themes/sygnum-default
```

Identify MUI theme overrides that should inform Chakra recipe colors.

## Step 3: Create Component Files

### File Structure

```
libs/sygnum-ui/src/components/<category>/<ComponentName>/
├── <ComponentName>.tsx          # Implementation
├── <ComponentName>.type.ts      # TypeScript types
├── <ComponentName>.story.tsx    # Storybook story
├── index.ts                      # Exports
└── tests/
    └── <ComponentName>.spec.tsx # Unit tests
```

### A. Create Types File

```typescript
// <ComponentName>.type.ts
import type { <ChakraComponent>Props } from '@chakra-ui/react';

export type Sygnum<ComponentName>Props = <ChakraComponent>Props;
```

### B. Create Component Implementation

**Simple component** (most cases):
```typescript
// <ComponentName>.tsx
import { <ChakraComponent> } from '@chakra-ui/react';
import type { Sygnum<ComponentName>Props } from './<ComponentName>.type';

export const <ComponentName> = ({ ...props }: Sygnum<ComponentName>Props) => (
  <<ChakraComponent> data-testid="<component-name>" {...props} />
);
```

**Compositional component** (if needed):
```typescript
// <ComponentName>.tsx
import { <Component> as Chakra<Component> } from '@chakra-ui/react';

export const <ComponentName> = Chakra<Component>.Root;
export const <ComponentName>Body = Chakra<Component>.Body;
// ... other parts
```

### C. Create Index Export

```typescript
// index.ts
export { <ComponentName> } from './<ComponentName>';
export type { Sygnum<ComponentName>Props } from './<ComponentName>.type';
```

### D. Update Category Index

```typescript
// libs/sygnum-ui/src/components/<category>/index.ts
export * from './<ComponentName>';
```

## Step 4: Create Recipe (Based on Figma Visual Design)

### A. Create Recipe File

Map Figma visual design to recipe styles:

```typescript
// libs/sygnum-themes/src/themes/chakra-default/recipes/<component-name>.ts
import { defineRecipe } from '@chakra-ui/react';

export const <componentName>Recipe = defineRecipe({
  base: {
    // Base styles extracted from Figma
    display: '...',
    fontWeight: '...',
    fontSize: '...',
    borderRadius: '...', // From Figma visual
  },
  variants: {
    variant: {
      solid: {
        bg: 'colorPalette.600',        // From Figma colors
        color: 'white',
        _hover: { bg: 'colorPalette.700' },
        _active: { bg: 'colorPalette.800' },
        _dark: { /* dark mode from Figma if shown */ },
      },
      outline: {
        borderWidth: '1px',
        borderColor: 'colorPalette.600',
        color: 'colorPalette.600',
        _hover: { bg: 'colorPalette.50' },
      },
      // ... other variants from Figma
    },
    size: {
      sm: {
        px: '...',   // From Figma spacing
        py: '...',
        fontSize: '...', // From Figma
      },
      md: { /* ... */ },
      lg: { /* ... */ },
      // ... sizes from Figma
    },
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md',
    colorPalette: 'gray',
  },
});
```

**Key rules**:
- Use `colorPalette.*` tokens (not hardcoded colors)
- Match Figma spacing, typography, borders exactly
- Include all states shown in Figma

### B. Register Recipe in Theme Config

```typescript
// libs/sygnum-themes/src/themes/chakra-default/config.ts
import { <componentName>Recipe } from './recipes/<component-name>';

export const chakraDefaultConfig = createSystem(defaultConfig, {
  theme: {
    // ...
    recipes: {
      // ... existing
      <componentName>: <componentName>Recipe,
    },
  },
});
```

## Step 5: Create Storybook Story (Match Existing Pattern)

**Required stories**:
1. **Default** (Playground) - Interactive controls
2. **FigmaGrid** - Exact Figma layout replication
3. **AllVariants** - All variants in a row
4. **AllSizes** - All sizes in a row
5. **AllColors** - All color palettes

```typescript
// <ComponentName>.story.tsx
import { useState } from 'react';
import { Checkbox } from '../../forms/Checkbox';
import { FormLabel } from '../../forms/FormLabel';
import { Input } from '../../forms/Input';
import { NativeSelect } from '../../forms/NativeSelect';
import { Box } from '../../layout/Box';
import { Flex } from '../../layout/Flex';
import { Grid } from '../../layout/Grid';
import { Stack } from '../../layout/Stack';
import { Heading } from '../../typography/Heading';
import { <ComponentName> } from './<ComponentName>';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof <ComponentName>> = {
  title: '<Category>/<ComponentName>',
  component: <ComponentName>,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [/* variants from Figma */],
    },
    size: {
      control: 'select',
      options: [/* sizes from Figma */],
    },
    colorPalette: {
      control: 'select',
      options: [
        'primary', 'slate', 'gray', 'gray-cool', 'red', 'green',
        'blue', 'indigo', 'amber', 'yellow', 'cyan', 'teal',
        'jade', 'green-light',
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof <ComponentName>>;

// DEFAULT STORY = PLAYGROUND (Interactive controls)
const DefaultStory = () => {
  const [label, setLabel] = useState('Component Text');
  const [colorPalette, setColorPalette] = useState</* type */>('primary');
  const [variant, setVariant] = useState</* type */>('solid');
  const [size, setSize] = useState</* type */>('md');
  const [disabled, setDisabled] = useState(false);

  return (
    <Box padding="24px">
      {/* CONTROLS BOX - Gray background */}
      <Box backgroundColor="#f5f5f5" padding="20px" borderRadius="8px" marginBottom="32px">
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="16px">
          <Stack direction="column" gap="8px">
            <FormLabel>Label</FormLabel>
            <Input value={label} onChange={e => setLabel(e.target.value)} />
          </Stack>

          <Stack direction="column" gap="8px">
            <FormLabel>Color</FormLabel>
            <NativeSelect
              value={colorPalette}
              onChange={e => setColorPalette(e.target.value as typeof colorPalette)}>
              <option value="primary">Primary</option>
              {/* ... all colors */}
            </NativeSelect>
          </Stack>

          <Stack direction="column" gap="8px">
            <FormLabel>Variant</FormLabel>
            <NativeSelect value={variant} onChange={e => setVariant(e.target.value as typeof variant)}>
              {/* All variants from Figma */}
            </NativeSelect>
          </Stack>

          <Stack direction="column" gap="8px">
            <FormLabel>Size</FormLabel>
            <NativeSelect value={size} onChange={e => setSize(e.target.value as typeof size)}>
              {/* All sizes from Figma */}
            </NativeSelect>
          </Stack>

          <Stack direction="column" gap="8px">
            <FormLabel>Disabled</FormLabel>
            <Checkbox checked={disabled} onChange={e => setDisabled(e.target.checked)}>
              Disable component
            </Checkbox>
          </Stack>
        </Grid>
      </Box>

      {/* PREVIEW BOX - White with dashed border */}
      <Flex
        padding="40px"
        backgroundColor="white"
        borderRadius="8px"
        border="2px dashed #e0e0e0"
        justify="center"
        align="center">
        <<ComponentName>
          colorPalette={colorPalette}
          variant={variant}
          size={size}
          disabled={disabled}>
          {label}
        </<ComponentName>>
      </Flex>
    </Box>
  );
};

export const Default: Story = {
  render: () => <DefaultStory />,
};

// FIGMA GRID STORY - Exact Figma layout
export const FigmaGrid: Story = {
  render: () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const;
    const designRows = [
      // Map exactly what you see in Figma
      // Each row shows variant/color combination across all sizes
      { label: 'Label A', palette: 'primary', variant: 'solid' as const },
      { label: 'Label B', palette: 'slate', variant: 'outline' as const },
      // ... copy exact Figma layout
    ];

    return (
      <Box padding="24px" backgroundColor="#fafafa" minHeight="100vh">
        <Heading as="h1" size="2xl" fontWeight={300} marginBottom="32px">
          <ComponentName>s
        </Heading>
        <Grid
          templateColumns="repeat(8, 1fr)"
          gap="1px"
          backgroundColor="#e0e0e0"
          border="2px dashed #9c27b0"
          borderRadius="8px"
          overflow="hidden">
          {designRows.map((row, rowIndex) =>
            sizes.map((size, colIndex) => (
              <Flex
                key={`${rowIndex}-${colIndex}`}
                backgroundColor="white"
                padding="12px 16px"
                align="center"
                justify="center">
                <<ComponentName>
                  colorPalette={row.palette}
                  variant={row.variant}
                  size={size as /* type */}>
                  {row.label}
                </<ComponentName>>
              </Flex>
            )),
          )}
        </Grid>
      </Box>
    );
  },
};

// ALL VARIANTS
export const AllVariants: Story = {
  render: () => (
    <Flex gap="8px" wrap="wrap">
      <<ComponentName> variant="solid">Solid</<ComponentName>>
      <<ComponentName> variant="outline">Outline</<ComponentName>>
      {/* ... all variants */}
    </Flex>
  ),
};

// ALL SIZES
export const AllSizes: Story = {
  render: () => (
    <Flex gap="8px" wrap="wrap" align="center">
      <<ComponentName> size="xs">XS</<ComponentName>>
      <<ComponentName> size="sm">SM</<ComponentName>>
      {/* ... all sizes */}
    </Flex>
  ),
};

// ALL COLORS
export const AllColors: Story = {
  render: () => (
    <Stack direction="column" gap="8px">
      <Flex gap="8px" wrap="wrap">
        <<ComponentName> colorPalette="primary">Primary</<ComponentName>>
        <<ComponentName> colorPalette="slate">Slate</<ComponentName>>
        {/* ... all colors */}
      </Flex>
    </Stack>
  ),
};
```

**Critical**: FigmaGrid must replicate the exact Figma layout (8-column grid with sizes, rows matching design).

## Step 6: Create Unit Tests

```typescript
// tests/<ComponentName>.spec.tsx
import { render, screen } from '@testing-library/react';
import { <ComponentName> } from '../<ComponentName>';
import { ChakraProvider } from '@sygnum/sygnum-themes/chakra-index';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider>{children}</ChakraProvider>
);

describe('<ComponentName>', () => {
  it('renders with default props', () => {
    render(<<ComponentName>>Content</<ComponentName>>, { wrapper });
    expect(screen.getByTestId('<component-name>')).toBeInTheDocument();
  });

  it('renders all variants', () => {
    // Test each variant from Figma
  });

  it('renders all sizes', () => {
    // Test each size from Figma
  });

  it('applies color palette', () => {
    // Test color palette application
  });
});
```

## Step 7: Run Verification

```bash
# Run tests
npx nx test sygnum-ui --testFile=<ComponentName>.spec.tsx

# Type check
npx nx typecheck sygnum-ui

# Lint
npx nx lint sygnum-ui

# Verify Storybook
npx nx storybook sygnum-ui-storybook
```

Fix any issues before proceeding.

## Step 8: Create Knowledge Documentation (Concise)

**IMPORTANT**: Knowledge files must be **concise** (≤70 lines total). Focus on essential usage only.

Create: `.claude/knowledge/vault/frontend/ui-components/sygnum-ui/sygnum-ui-<component-name>.md`

```markdown
# Sygnum UI <ComponentName>

Chakra UI <ComponentName> component for Sygnum platform.

## Import

```tsx
import { <ComponentName> } from '@sygnum/sygnum-ui/components/<category>/<ComponentName>';
```

## Usage

```tsx
<<ComponentName>>Content</<ComponentName>>
```

## Variants

```tsx
<<ComponentName> variant="solid">Solid</<ComponentName>>
<<ComponentName> variant="outline">Outline</<ComponentName>>
```

## Sizes

```tsx
<<ComponentName> size="sm">SM</<ComponentName>>
<<ComponentName> size="md">MD</<ComponentName>>  {/* Default */}
<<ComponentName> size="lg">LG</<ComponentName>>
```

## Color Palettes

```tsx
<<ComponentName> colorPalette="primary">Primary</<ComponentName>>
<<ComponentName> colorPalette="error">Error</<ComponentName>>
```

## Props

| Prop | Type | Default |
|------|------|---------|
| variant | [variants] | 'solid' |
| size | [sizes] | 'md' |
| colorPalette | string | 'gray' |

## Common Patterns

```tsx
// Pattern 1
<<ComponentName> colorPalette="success" variant="subtle">
  Active
</<ComponentName>>
```

## Migration from MUI

*[If MUI equivalent exists]*

**MUI**:
```tsx
<Mui<Component> color="primary">Label</Mui<Component>>
```

**Chakra**:
```tsx
<<ComponentName> colorPalette="primary">Label</<ComponentName>>
```

### Prop Changes

| MUI | Chakra |
|-----|--------|
| color | colorPalette |

## Storybook

```bash
npx nx storybook sygnum-ui-storybook
```

Navigate to: **<Category> / <ComponentName>**
```

**Token limit**: Keep docs **focused and concise** (≤70 lines). Prioritize:
1. Import path
2. Basic usage
3. Variants/sizes examples
4. MUI migration (if applicable)

## Step 9: Register Knowledge

Add to `.claude/knowledge/knowledge.json`:

```json
{
  "name": "sygnum-ui-<component-name>",
  "category": "frontend/ui-components/sygnum-ui",
  "description": "Sygnum-UI <ComponentName> component.",
  "tags": [
    "sygnum-ui",
    "<component-name>",
    "<category>",
    "react",
    "frontend",
    "chakra"
  ],
  "knowledge_path": ".claude/knowledge/vault/frontend/ui-components/sygnum-ui/sygnum-ui-<component-name>.md"
}
```

Validate:
```bash
node .claude/knowledge/scripts/validate-knowledge.mjs
```

## Step 10: Final Summary

```
✅ <ComponentName> component created

Files:
- libs/sygnum-ui/src/components/<category>/<ComponentName>/*
- libs/sygnum-themes/src/themes/chakra-default/recipes/<component-name>.ts
- .claude/knowledge/vault/frontend/ui-components/sygnum-ui/sygnum-ui-<component-name>.md

Updated:
- libs/sygnum-themes/src/themes/chakra-default/config.ts (recipe registered)
- libs/sygnum-ui/src/components/<category>/index.ts (export added)
- .claude/knowledge/knowledge.json (knowledge registered)

Verification:
✓ Tests passing
✓ Type check passing
✓ Lint passing
✓ Storybook rendering

Next:
1. Review Storybook: npx nx storybook sygnum-ui-storybook
2. Test in app:
   import { <ComponentName> } from '@sygnum/sygnum-ui/components/<category>/<ComponentName>';
3. Create migration ticket for MUI <MuiComponent> (if applicable)
```

## Priority Hierarchy

When conflicts arise:

1. **Figma visual design** - Source of truth for styling, spacing, colors
2. **Existing Storybook patterns** - Match Button/IconButton/Badge story structure exactly
3. **MUI implementation** - Reference for prop names in migration guide only

## Error Handling

**Component exists**: Warn and exit
**Category missing**: Ask to create new category
**Tests fail**: Show errors, allow manual fix
**Recipe conflicts**: Suggest alternative name
