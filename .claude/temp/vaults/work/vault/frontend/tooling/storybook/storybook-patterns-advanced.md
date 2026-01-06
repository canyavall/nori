# Storybook Advanced Patterns

Advanced story patterns including custom render, args, and decorators.

## Custom Render

```typescript
// With state
export const WithState: Story = {
  render: (args) => {
    const [count, setCount] = React.useState(0);
    return (
      <Button {...args} onClick={() => setCount(count + 1)}>
        Clicked {count}
      </Button>
    );
  },
};

// With layout
export const WithLayout: Story = {
  render: (args) => (
    <Box display="flex" gap={2}>
      <Button {...args} variant="primary">Primary</Button>
      <Button {...args} variant="secondary">Secondary</Button>
    </Box>
  ),
};
```

## Args and Controls

```typescript
const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: { control: 'boolean' },
    backgroundColor: { control: 'color' },
    text: { control: 'text' },
    number: {
      control: { type: 'number', min: 0, max: 100, step: 5 },
    },
  },
};
```

## Decorators

```typescript
// Single story decorator
export const Centered: Story = {
  decorators: [
    (Story) => (
      <Box display="flex" justifyContent="center" height="100vh">
        <Story />
      </Box>
    ),
  ],
};

// All stories decorator
const meta: Meta<typeof MyComponent> = {
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
};
```
