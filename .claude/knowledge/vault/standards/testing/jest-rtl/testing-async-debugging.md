# Async Testing & Debugging

Patterns for testing asynchronous operations and fixing async-related test failures.

## Query Method Decision Tree

**Sync elements** (already in DOM): `getBy`, `queryBy`
**Async elements** (will appear): `findBy`
**Complex conditions**: `waitFor`
**Disappearing elements**: `waitForElementToBeRemoved`

## findBy vs waitFor

**findBy**: Single element that will appear
```typescript
expect(await screen.findByText('Success')).toBeVisible();
```

**waitFor**: Complex conditions, multiple assertions, non-DOM checks
```typescript
await waitFor(() => {
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(mockFn).toHaveBeenCalledTimes(2);
});
```

## act() Warnings

**Cause**: State updates happen outside React's knowledge

**Fixes**:
```typescript
// ✅ Use findBy/waitFor
expect(await screen.findByText('Success')).toBeVisible();

// ✅ Wrap async operations
await waitFor(() => expect(mockFn).toHaveBeenCalled());

// ✅ Fake timers with act()
await act(async () => {
  jest.advanceTimersByTime(1000);
});
```

## Timeout Configuration

**Default**: 1000ms
**Increase**: `await screen.findByText('Data', {}, { timeout: 5000 })`
**Decrease**: `await waitFor(() => {...}, { timeout: 100 })`
**Polling**: `await waitFor(() => {...}, { interval: 50 })`

## Multiple API Calls

**Wait for all**: Each `findBy` waits for its own response
```typescript
expect(await screen.findByText('John')).toBeVisible();
expect(await screen.findByText('Posts')).toBeVisible();
```

**Wait for loading**: `await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'));`

## Polling Logic

```typescript
it('should poll every 5 seconds', async () => {
  jest.useFakeTimers();

  renderWithQuery(<PollingComponent interval={5000} />);

  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(await screen.findByText('Updated')).toBeVisible();

  jest.useRealTimers();
});
```

## Sequential waitFor for Loaders

When waiting for loading states to transition to content, use sequential waits:

```typescript
// ✅ Sequential waits - loader removal first, then content
await waitFor(() => {
  expect(screen.queryByText('Loading')).not.toBeInTheDocument();
}, { timeout: 5000 });

await waitFor(() => {
  expect(screen.getByText('Content')).toBeInTheDocument();
});
```

## Anti-Patterns

❌ **Not awaiting findBy**: `screen.findByText('text')` without `await`
❌ **Nested waitFor**: `waitFor(() => waitFor(() => ...))`
❌ **getBy inside waitFor**: Use `queryBy` instead
❌ **Arbitrary delays**: `await new Promise(resolve => setTimeout(resolve, 100))`
❌ **Multiple assertions in single waitFor**: May pass prematurely
