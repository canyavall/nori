# Storybook Configuration Patterns

Parameters, actions, and interactive component patterns for Storybook.

## Parameters

```typescript
const meta: Meta<typeof MyComponent> = {
  parameters: {
    // Version tracking
    version: { major: 'v1', minor: '2', patch: '3' },
    // Layout
    layout: 'centered', // 'centered' | 'fullscreen' | 'padded'
    // Docs
    docs: {
      description: {
        component: 'MyComponent is used for...',
      },
    },
    // Backgrounds
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'light', value: '#fff' },
        { name: 'dark', value: '#000' },
      ],
    },
  },
};

// Per-story parameters
export const OnDark: Story = {
  parameters: { backgrounds: { default: 'dark' } },
};
```

## Actions

```typescript
// In meta
const meta: Meta<typeof MyComponent> = {
  argTypes: {
    onClick: { action: 'clicked' },
    onHover: { action: 'hovered' },
    onChange: { action: 'changed' },
  },
};

// Inline
export const WithActions: Story = {
  args: {
    onClick: () => console.log('Clicked'),
    onSubmit: (data) => console.log('Submitted:', data),
  },
};
```

## Form Components

```typescript
export const FormExample: Story = {
  render: () => {
    const [value, setValue] = React.useState('');
    return (
      <Box>
        <TextField
          value={value}
          onChange={(e) => setValue(e.target.value)}
          label="Enter text"
        />
        <Typography>Current value: {value}</Typography>
      </Box>
    );
  },
};
```

## Responsive Components

```typescript
export const Responsive: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [
    (Story) => (
      <Box width="100%" maxWidth="400px">
        <Story />
      </Box>
    ),
  ],
};
```
