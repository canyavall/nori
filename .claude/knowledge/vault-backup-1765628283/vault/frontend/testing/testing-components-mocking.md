# Component Mocking Patterns

Patterns for mocking components and determining when to mock.

## Mocking Components

```typescript
import { mockComponent } from '@sygnum/sygnum-testing';

jest.mock('@sygnum/suil/components/atoms/Button', () => mockComponent('Button'));

it('should render parent component', () => {
  renderMinimal(<ParentComponent />);
  expect(screen.getByTestId('mock_Button')).toBeInTheDocument();
});
```

## When to Mock

**Mock when**:
- Testing parent component in isolation
- Child has complex dependencies (auth, API calls, heavy state)
- Reducing test execution time
- Child has external side effects

**Don't mock when**:
- Testing actual integration between parent and child
- Child is simple (presentational only)
- Testing the child's behavior is the goal

## Mocking Third-Party Components

```typescript
// Mock complex third-party components
jest.mock('@mui/material/DataGrid', () => mockComponent('DataGrid'));

// Pass through simple ones
jest.mock('@mui/material/Button', () => ({
  Button: (props: any) => <button {...props} />,
}));
```

## Mocking Hooks

```typescript
jest.mock('@sygnum/sygnum-query', () => ({
  useGetUsers: jest.fn(),
}));

it('should display users', () => {
  const mockUseGetUsers = useGetUsers as jest.Mock;
  mockUseGetUsers.mockReturnValue({
    data: [{ id: '1', name: 'John' }],
    isLoading: false,
  });

  renderMinimal(<UserList />);
  expect(screen.getByText('John')).toBeVisible();
});
```

## Partial Mocking

```typescript
// Mock specific exports, keep others
jest.mock('@sygnum/sygnum-utils', () => ({
  ...jest.requireActual('@sygnum/sygnum-utils'),
  formatDate: jest.fn(() => '2024-01-01'),
}));
```

## MUI Animation Bypass

MUI components with Fade, Collapse, or other transitions can cause timing issues in tests. Pass `disableAnimation` prop when available:

```typescript
// Component supports disableAnimation
<BalanceWithLoader ... disableAnimation />

// Or mock Fade/transitions globally
jest.mock('@mui/material/Fade', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
```

## Grid Mock with DOM Prop Filtering

MUI Grid passes props like `columnSpacing`, `rowSpacing` that React warns about when passed to DOM elements. Filter them in mocks:

```typescript
jest.mock('@sygnum/suil/components/layout/Grid', () => ({
  Grid: jest.fn(({ children, ...props }) => {
    // Filter out Grid-specific props
    const {
      container,
      columnSpacing,
      rowSpacing,
      direction,
      justifyContent,
      alignItems,
      spacing,
      columns,
      item,
      xs, sm, md, lg, xl,
      wrap,
      zeroMinWidth,
      ...domProps
    } = props;

    return <div data-testid="grid" {...domProps}>{children}</div>;
  }),
}));
```

## Anti-Patterns

❌ **Over-mocking**: Mocking everything defeats integration testing
❌ **Mocking what you're testing**: Mock dependencies, not the subject
❌ **Not cleaning up mocks**: Use `jest.clearAllMocks()` or global config
❌ **Passing MUI props to DOM**: Filter Grid/Box props in mocks

## Related Knowledge

- testing-components-basics - Basic component testing
- testing-isolation - Mock cleanup patterns
