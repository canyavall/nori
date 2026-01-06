# Test Isolation

Ensuring tests don't affect each other through proper state cleanup and isolation patterns.

## Core Principle

Each test must be independent. Running tests in any order should produce identical results.

```bash
npx nx test my-project --runInBand        # Sequential
npx nx test my-project --maxWorkers=4    # Parallel
```

Both should pass consistently.

## Standard Cleanup Template

```typescript
describe('MyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();          // Mock state
    localStorage.clear();          // Browser storage
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();          // Restore real timers
  });

  it('test 1', async () => {
    const user = setupUserEvent(); // Per-test userEvent
    // ...
  });
});
```

**Note**: `jest.preset.js` has `clearMocks: true` globally. `mswServer.resetHandlers()` is automatic in `setupMswServer()`.

## Key Cleanup Areas

**Global state**: Clear `localStorage`, `sessionStorage` in `beforeEach`
**window/env**: Save original, restore in `afterEach`
**Date mocking**: `jest.setSystemTime()` in test, restore in `afterEach`
**MSW**: Override per test with `mswServer.use()` (auto-resets)
**Timers**: `jest.clearAllTimers()` + `jest.useRealTimers()` in `afterEach`
**DOM**: Automatic with `@testing-library/react`

## Anti-Patterns

❌ **Shared mutable data**: Don't reuse objects between tests
```typescript
// Bad: shared object mutated by tests
const sharedData = { count: 0 };
```

❌ **Shared setupUserEvent at describe-level**: Causes state pollution between tests
```typescript
// ❌ Bad: userEvent state leaks between tests
describe('MyComponent', () => {
  const user = setupUserEvent();  // Pollutes across tests
  it('test1', async () => { await user.click(...) });
  it('test2', async () => { await user.click(...) });  // May fail
});

// ✅ Good: Per-test userEvent
describe('MyComponent', () => {
  it('test1', async () => {
    const user = setupUserEvent();
    await user.click(...);
  });
  it('test2', async () => {
    const user = setupUserEvent();
    await user.click(...);
  });
});
```

❌ **Relying on test order**: Tests must pass when run individually
```typescript
// Bad: test2 depends on test1
it('test1', () => { localStorage.setItem('token', 'abc'); });
it('test2', () => { expect(localStorage.getItem('token')).toBe('abc'); });
```

❌ **Not resetting Valtio state stores**: Global proxy state persists between tests
```typescript
// ❌ Bad: No state reset
describe('Component', () => {
  it('test1', () => { setGlobalState({ items: [...] }); });
  it('test2', () => { /* state from test1 still present */ });
});

// ✅ Good: Reset state in beforeEach
import { resetStoreState } from '../tests/testUtils';

describe('Component', () => {
  beforeEach(() => {
    resetStoreState();
  });

  // Wrap state changes in act() when testing
  it('test', () => {
    act(() => {
      setGlobalState({ items: [...] });
    });
  });
});
```

