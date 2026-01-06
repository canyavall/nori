# Storybook Fundamentals

Storybook setup, configuration, and basic story patterns.

## Configuration

- **Location**: `libs/frontend-storybook/`
- **Config**: `libs/frontend-storybook/.storybook/`
- **Story files**: `*.story.tsx` (not `*.stories.tsx`)
- **Pattern**: `libs/**/*/src/**/*.story.@(js|jsx|ts|tsx)`
- **Features**: React Vite, multi-theme, autodocs, React Router

## Basic Story Pattern

```typescript
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Category/Subcategory/ComponentName',
  component: MyComponent,
  parameters: {
    version: { major: 'v1', minor: '0', patch: '0' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {
  args: {
    title: 'Hello World',
    onClick: () => console.log('clicked'),
  },
};
```

## Required Elements

1. **Meta Object**: `title`, `component`, `parameters`, `tags`
2. **Default Export**: Export meta as default
3. **Story Type**: `StoryObj<typeof Component>`
4. **Named Exports**: Each export is a story variant

## Naming Conventions

### Title Organization

```typescript
// Sygnum libraries
'Sygnum-Charts/ChartPie'
'Sygnum Shared Components/Layouts/CommonLayout'

// SUIL
'SUIL/Atoms/Button'
'SUIL/Layout/Grid'
```

### Story Names

```typescript
export const Default: Story = {};
export const WithIcon: Story = {};
export const Disabled: Story = {};
export const LargeSize: Story = {};
```

## Running Storybook

```bash
# Start Storybook
npx nx storybook frontend-storybook

# Build static Storybook
npx nx build-storybook frontend-storybook

# Output: dist/storybook/frontend-storybook
```

## Simple Story Examples

```typescript
// Basic variants
export const Primary: Story = {
  args: { variant: 'primary', children: 'Click me' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Click me' },
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, children: 'Disabled' },
};
```
