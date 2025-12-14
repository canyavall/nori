# Storybook Best Practices - Templates & Patterns

Story templates and common patterns for different component types.

## Story Templates

### Basic Component Template

```typescript
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'Category/ComponentName',
  component: ComponentName,
  parameters: {
    version: { major: 'v1', minor: '0', patch: '0' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    // Add default props
  },
};
```

### Interactive Component Template

```typescript
export const Interactive: Story = {
  render: (args) => {
    const [state, setState] = React.useState(initialState);
    return (
      <ComponentName {...args} value={state} onChange={setState} />
    );
  },
};
```

### Form Component Template

```typescript
export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = React.useState({ field: '' });
    const handleSubmit = (e) => {
      e.preventDefault();
      console.log('Submitted:', formData);
    };
    return (
      <form onSubmit={handleSubmit}>
        <FormComponent
          value={formData.field}
          onChange={(value) => setFormData({ ...formData, field: value })}
        />
      </form>
    );
  },
};
```

## Common Patterns Summary

- **Simple variants**: Show different prop combinations
- **With state**: Demonstrate interactive behavior
- **With layout**: Show component in context
- **Responsive**: Test different viewport sizes
- **Themed**: Show light/dark mode variants
- **Error states**: Display validation and error handling
- **Loading states**: Show async/loading behavior
- **Empty states**: Display when no data available

## Related Knowledge

- `react` - Component patterns
- `typescript` - Type definitions
- `suil` - UI component library
- `sygnum-themes` - Theming system
