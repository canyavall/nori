# Race Conditions in Tests

Common race condition patterns and systematic solutions.

## What Are Race Conditions?

Tests depend on async operations completing in specific order, but timing is non-deterministic.

## Common Patterns

**API response timing**: Tests assume API responds before assertion
**State update timing**: Component state updates after test checks
**Async side effects**: useEffect triggers after test completes
**Event propagation**: Events fire after test moves on
**Animation/transition delays**: CSS animations not complete

## Detection

**Symptoms**:
- Test passes/fails randomly
- `act()` warnings
- "Cannot find element" errors
- Different results with `--runInBand`

**Diagnosis**: Run test 10+ times, note failure patterns

## Solutions by Pattern

**API Race**:
```typescript
// ❌ Race: may check before response arrives
renderWithQuery(<Component />);
expect(screen.getByText('Data')).toBeVisible();

// ✅ Wait for async
expect(await screen.findByText('Data')).toBeVisible();
```

**State Update Race**:
```typescript
// ❌ Race: state may not be updated
await user.click(button);
expect(screen.getByText('Updated')).toBeVisible();

// ✅ Wait for update
await user.click(button);
expect(await screen.findByText('Updated')).toBeVisible();
```

**Multiple Operations**:
```typescript
// ✅ Wait for all async operations
expect(await screen.findByText('User')).toBeVisible();
expect(await screen.findByText('Posts')).toBeVisible();
```

## React Query Patterns

**Wait for loading**:
```typescript
await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'));
expect(screen.getByText('Data loaded')).toBeVisible();
```

**Wait for mutation**:
```typescript
await user.click(saveButton);
await waitFor(() => expect(mockMutate).toHaveBeenCalled());
expect(await screen.findByText('Saved')).toBeVisible();
```

## Cleanup & Event Races

Ensure async operations complete before test ends:
```typescript
await user.click(button);
await waitFor(() => expect(mockFn).toHaveBeenCalled());
```

## Best Practices

✅ **Use findBy** for elements that will appear
✅ **Use waitFor** for complex conditions
✅ **Always await** user interactions and assertions
✅ **Wait for side effects** before asserting results
✅ **Clean up properly** - ensure async complete

## Anti-Patterns

❌ **Arbitrary delays**: `setTimeout(1000)` - timing-dependent
❌ **getBy for async**: `getBy` doesn't wait
❌ **Not awaiting findBy**: `screen.findByText()` without `await`

## Related Knowledge

- `testing-async-debugging` - Async patterns
- `testing-flaky-tests` - Test stability patterns
