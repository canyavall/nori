# Testing Core

Core testing principles, query methods, and best practices for Jest and React Testing Library.

## Query Methods

**getBy**: Synchronous, throws if not found (immediate elements)
**queryBy**: Synchronous, returns null if not found (absence checks)
**findBy**: Asynchronous, waits for element (async elements)

```typescript
const button = screen.getByRole('button');
const error = screen.queryByText('Error');
expect(error).not.toBeInTheDocument();
const data = await screen.findByText('Loaded data');
```

**Query Priority**:
1. Accessible queries (prefer): `getByRole`, `getByLabelText`, `getByPlaceholderText`
2. Semantic queries: `getByAltText`, `getByTitle`
3. Test IDs (last resort): `getByTestId`

## Test User Behavior, Not Implementation

```typescript
// ✅ Test what users see and do
expect(screen.getByRole('button', { name: /submit/i })).toBeVisible();
await user.click(screen.getByRole('button', { name: /submit/i }));
expect(screen.getByText('Success!')).toBeVisible();

// ❌ Don't test internals
expect(component.state.isLoading).toBe(false);
```

## Test Structure (AAA Pattern)

**Arrange**: Set up test data and mocks
**Act**: Execute the operation being tested
**Assert**: Verify expected outcomes

```typescript
it('should update user name', async () => {
  const user = setupUserEvent();
  const onSave = jest.fn();
  renderMinimal(<UserForm onSave={onSave} />);

  await user.type(screen.getByLabelText('Name'), 'John');
  await user.click(screen.getByRole('button', { name: /save/i }));

  expect(onSave).toHaveBeenCalledWith({ name: 'John' });
});
```

## User Interactions

```typescript
import { setupUserEvent } from '@sygnum/sygnum-testing';

const user = setupUserEvent();
await user.click(button);
await user.type(input, 'Hello');

// ❌ Don't use fireEvent
fireEvent.click(button);
```

## Test Naming

Pattern: `should [expected behavior] when [condition]`

```typescript
// ✅ Good
it('should display error message when email is invalid', () => {});

// ❌ Bad
it('test email validation', () => {});
```

## What to Test

✅ **Test**: User interactions, data display, error handling, state changes visible to user

❌ **Don't test**: Implementation details, third-party libraries, CSS styling

## Test Independence

Each test runs independently in any order:
- Generate fresh data per test
- Clear state in `beforeEach`
- Don't rely on test order
- Don't share mutable data
