# Testing Quick Checklist

Fast pre-commit validation checklist. Each item links to detailed documentation.

## Pre-Commit Validation (2 minutes)

### Test Isolation
- [ ] Tests pass with different `--seed` values (→ testing-isolation)
- [ ] No shared state between tests
- [ ] Each test runs independently
- [ ] `setupUserEvent()` called per-test, not at describe-level
- [ ] Valtio state stores reset in `beforeEach`

### Data Management
- [ ] All array items have unique IDs (→ testing-unique-ids)
- [ ] No hard-coded IDs reused across tests (`'1'`, `'test-id'`)
- [ ] Use generators for mock data (→ testing-generators)

### Mocking & MSW
- [ ] Mock paths match import paths exactly (→ testing-msw-setup)
- [ ] Mocks return proper types, not `undefined`
- [ ] MSW cleanup: `setupMswServer()` handles `resetHandlers()` automatically

Note: `jest.preset.js` has `clearMocks: true` globally

### Provider Setup
- [ ] Components have all required providers (→ testing-providers)
- [ ] Use `renderWithQuery` for API-dependent components
- [ ] Use `renderWith` for flexible provider composition

### Async Handling
- [ ] All async operations awaited (→ testing-async-debugging)
- [ ] Use `findBy` for async elements, not `getBy`
- [ ] No `act()` warnings in output
- [ ] Buttons awaited for enabled state before clicking
- [ ] Loaders awaited for removal before content assertions

### Cleanup
- [ ] No "worker process failed to exit" warnings
- [ ] `--detectOpenHandles` passes (→ testing-race-conditions)
- [ ] Timers cleaned up if used

## Quick Commands

```bash
# Basic validation (30 sec)
npx nx test my-project --testPathPattern="MyTest" --runInBand --detectOpenHandles

# Order independence (1 min)
npx nx test my-project --testPathPattern="MyTest" --seed=12345
npx nx test my-project --testPathPattern="MyTest" --seed=67890
```

## PR Review Checklist

- [ ] Tests follow existing patterns
- [ ] No `.skip` or `.only` in committed code
- [ ] Happy path, error cases, and edge cases tested
- [ ] Tests pass in CI pipeline
- [ ] Test execution time reasonable (< 30s per file)

## Related Knowledge

- testing-isolation, testing-unique-ids, testing-generators
- testing-providers, testing-msw-setup, testing-async-debugging
- testing-flaky, testing-race-conditions
