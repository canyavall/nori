# Test Retry Strategies

When and how to use test retries vs fixing root causes.

## Core Principle

**Retries are NOT a solution for flaky tests.** They mask problems, don't fix them.

**Acceptable retries**:
- E2E tests with external services (payment gateways, third-party APIs)
- Integration tests with real databases/services
- Tests with unavoidable network dependencies

**NOT acceptable**:
- Unit tests
- Component tests
- Tests with mocked dependencies
- Any test where flakiness can be fixed

## Configuration

**Per-test suite**:
```typescript
describe('E2E: Checkout', () => {
  jest.retryTimes(2, { logErrorsBeforeRetry: true });

  it('completes payment', async () => {...});
});
```

**Per-test**:
```typescript
it('flaky test', async () => {...}, 2); // Retry up to 2 times
```

**Global** (jest.config.js): `retryTimes: 2` - **NOT recommended**, hides all flakiness

## Decision Tree

1. **Is this a unit/component test?** → Fix the test, no retries
2. **Uses mocked dependencies?** → Fix the test, no retries
3. **External service unavoidable?** → Retry acceptable (max 2-3)
4. **Flakiness from async/timing?** → Fix with proper `waitFor`/`findBy`
5. **State leakage?** → Fix with proper cleanup
6. **CI-only failure?** → Fix environment parity, not retry

## Anti-Patterns

❌ **Global retries**: Hides all flakiness across entire suite
❌ **Retrying unit tests**: Unit tests should be deterministic
❌ **High retry counts**: `retryTimes(10)` indicates serious problem
❌ **Retrying without logging**: Always use `logErrorsBeforeRetry: true`

## CI-Specific Retries

```yaml
# GitLab CI
test:
  script: npx nx test
  retry: 1  # Retry job once on failure
```

Use sparingly and track retry rates. High retry rates indicate systemic issues.

## Monitoring

Track metrics:
- Test retry rate (retries / total runs)
- Tests that always need retries → candidates for fixes
- Retry success rate → if low, retries aren't helping

**Target**: <1% retry rate. Above 5% indicates flakiness problem.

## Recommended Approach

1. **Detect flakiness**: Use `testing-flaky-detection`
2. **Diagnose root cause**: Race condition? State leak? Async timing?
3. **Fix properly**: Apply patterns from knowledge
4. **Verify**: Run 20+ times without retries
5. **Only then**: Consider retry if external dependency truly unavoidable

## Alternative to Retries

**Quarantine flaky tests** instead of retry:
```typescript
describe.skip('Quarantine: Known flaky test', () => {
  // Track in issue tracker, fix properly
});
```

Better than hiding with retries - at least it's visible.

## Related Knowledge

- `testing-flaky-detection` - Detect flaky tests
- `testing-flaky-tests` - Fix flaky tests
- `testing-ci-local-parity` - Environment consistency
