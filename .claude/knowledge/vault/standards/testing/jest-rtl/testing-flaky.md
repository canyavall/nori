# Flaky Tests

Comprehensive guide to detecting, preventing, and fixing flaky tests.

## What Are Flaky Tests?

Tests that pass or fail intermittently without code changes. Root cause: non-deterministic behavior (timing, state, order).

## Detection Methods

Run test suite 10+ times to observe failure patterns:

```bash
npx nx test my-project --runInBand
```

**Failure thresholds**:
- 0/10 = Stable
- 1-9/10 = Flaky (requires fix)
- 10/10 = Consistently broken (not flaky)

**Categories**:
- High (>50%): Fix immediately - fundamental timing/state issue
- Medium (10-50%): Fix within sprint - race condition
- Low (<10%): Investigate and monitor - edge case timing

**Tools**:
- Manual: `for i in {1..10}; do npx nx test my-project --runInBand; done`
- CI: Configure test retry + failure artifacts

## Common Causes

**Race conditions**: Async operations finish in unpredictable order
**State leakage**: Tests share mutable state (global vars, storage, mocks)
**External dependencies**: Network, file system, time-dependent code
**React-specific**: Missing `act()`, provider setup, state updates
**Timing**: Animations, debounce/throttle, fake timers

## Common Fixes

**"Cannot find element"**: Use `await screen.findByText()` instead of `getBy`

**"act() warning"**: Wrap state updates in `waitFor` or use `findBy`

**Test order dependency**: Add `beforeEach` cleanup, generate fresh data

**Timeout**: Increase timeout or fix async pattern

**React Query**:
```typescript
it('should load data', async () => {
  mswServer.use(mswGetFunc({ path: '/api/data', status: 200, mock: { name: 'John' } }));
  renderWithQuery(<DataComponent />);
  await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'));
  expect(screen.getByText('John')).toBeVisible();
});
```

## Prevention

**Write deterministic tests**: No `Math.random()`, `Date.now()`, real API calls
**Proper waits**: Use `findBy`, `waitFor`, not arbitrary `setTimeout`
**Setup/teardown**: Clear state in `beforeEach` (storage, mocks, timers)
**Isolation**: Generate fresh data per test, no shared mutations

## Mock Factory Pattern

Use factory functions to ensure consistent mock resets between tests:

```typescript
// ❌ Bad: Mock defined once, may get mutated
const useWatchFormMock = jest.fn().mockReturnValue({ isValid: true });

// ✅ Good: Factory function for fresh mock state
const useWatchFormMock = jest.fn();

const createDefaultMockState = () => ({
  isValid: true,
  isLoading: false,
  data: null,
});

beforeEach(() => {
  jest.clearAllMocks();
  useWatchFormMock.mockReturnValue(createDefaultMockState());
});

it('test with custom state', () => {
  // Override for specific test
  useWatchFormMock.mockReturnValue({
    ...createDefaultMockState(),
    isValid: false,
  });
  // ...
});
```

**Benefits**:
- Each test starts with known state
- Easy to override specific properties
- No cross-test pollution from mock mutations

## Debugging

**Isolate test**: Run 20 times with `--testNamePattern`
**Increase verbosity**: `--verbose --runInBand`
**Debug DOM**: Use `screen.debug()` to compare passing vs failing runs
**CI parity**: Test locally with `--maxWorkers=1 --runInBand`

## Anti-Patterns

❌ **Skipping tests**: `it.skip()` hides problems
❌ **Arbitrary delays**: `await new Promise(resolve => setTimeout(resolve, 100))`
❌ **Retrying without fixing**: `jest.retryTimes(3)` masks root cause
❌ **Shared mutable data**: Objects reused across tests
