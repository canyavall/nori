# Component Testing Basics

Component testing patterns with render utilities and async patterns.

## Render Utilities

**renderMinimal**: Simple components without providers
**renderWithQuery**: Components using React Query
**renderWith**: Flexible provider composition

```typescript
import { renderMinimal, renderWithQuery, renderWith } from '@sygnum/sygnum-testing';

renderMinimal(<Button />);
renderWithQuery(<UserList />);
renderWith(<Complex />, { query: true, router: '/home' });
```

## Testing Props

```typescript
it('should display user name', () => {
  renderMinimal(<UserCard name="John" email="john@test.com" />);
  expect(screen.getByText('John')).toBeVisible();
});
```

## Testing Events

```typescript
it('should handle click', async () => {
  const user = setupUserEvent();
  const onClick = jest.fn();

  renderMinimal(<Button onClick={onClick} />);

  await user.click(screen.getByRole('button'));
  expect(onClick).toHaveBeenCalledTimes(1);
});
```

## Testing Forms

```typescript
it('should submit form', async () => {
  const user = setupUserEvent();
  const onSubmit = jest.fn();

  renderMinimal(<LoginForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.type(screen.getByLabelText('Password'), 'password123');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123',
  });
});
```

## Testing Hooks

Use `renderHook` from `@testing-library/react`, wrap updates in `act()`:

```typescript
import { renderHook, act } from '@testing-library/react';

it('should toggle state', () => {
  const { result } = renderHook(() => useToggle(false));

  act(() => {
    result.current.toggle();
  });

  expect(result.current.value).toBe(true);
});
```

## Async Testing

**Async elements**: Use `findBy` for elements that will appear
**Complex conditions**: Use `waitFor` for multiple assertions

```typescript
it('should load data', async () => {
  renderWithQuery(<UserList />);
  expect(await screen.findByText('John')).toBeVisible();
});
```

## Related Knowledge

- testing-core - Core concepts
- testing-components-mocking - Mocking patterns
- testing-providers - Provider setup
- testing-async-debugging - Async patterns
