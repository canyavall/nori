# Testing Performance Optimization

Performance patterns and optimization strategies for Jest tests, especially in CI/pipeline environments.

## UserEventProfile Performance Characteristics

**FAST Profile (Recommended)**:
```typescript
const user = setupUserEvent({ profile: UserEventProfile.FAST });
```
- Zero-delay interactions (`{ delay: null }`)
- No automatic timer advancement
- Best for: Form interactions, clicks, dropdowns
- Performance: Fastest execution

**TIMER_AWARE Profile (Use Sparingly)**:
```typescript
const user = setupUserEvent({ profile: UserEventProfile.TIMER_AWARE });
```
- Calls `jest.advanceTimersByTime()` on every interaction
- **Warning**: Causes 21-74x slowdown in CI with fake timers
- Use only when: Testing debounced inputs or time-dependent interactions

**DEFAULT Profile**: Uses real delays (default 0ms), standard user-event behavior

## Performance Impact

**Before (TIMER_AWARE + Global Fake Timers)**: 7s locally, 148-516s in CI
```typescript
const user = setupUserEvent({ profile: UserEventProfile.TIMER_AWARE });
beforeEach(() => jest.useFakeTimers());
// Every interaction advances timers synchronously
```

**After (FAST + Selective Fake Timers)**: 7s locally, <30s in CI (73-86% improvement)
```typescript
const user = setupUserEvent({ profile: UserEventProfile.FAST });
// No global fake timers - apply only where needed
it('validates timeout', async () => {
  jest.useFakeTimers();
  // Test logic with timer control
  jest.useRealTimers();
});
```

## Fake Timer Best Practices

**❌ Don't: Global fake timers**
```typescript
beforeEach(() => jest.useFakeTimers()); // Affects ALL tests
```

**✅ Do: Local fake timers**
```typescript
it('handles timeout', async () => {
  jest.useFakeTimers();
  jest.advanceTimersByTime(5000);
  jest.useRealTimers();
});
```

## When to Use Fake Timers

**Use fake timers for**:
- Debounce/throttle validation
- Timeout behavior testing
- Animation timing verification
- Scheduled task testing

**Use real timers for**:
- Form submissions
- User interactions (clicks, typing)
- API request/response cycles
- Component rendering

## CI-Specific Performance Patterns

**Root cause of CI slowdowns**:
- Limited CPU allocation + shared infrastructure
- TIMER_AWARE + fake timers causes exponential slowdown
- Every interaction triggers synchronous timer advancement
- 20+ tests × multiple interactions = multiplicative effect

**Migration strategy**:
1. Replace TIMER_AWARE with FAST profile
2. Remove global fake timers from beforeEach/afterEach
3. Add selective fake timers only to tests validating timing behavior

## Common Performance Pitfalls

❌ Using TIMER_AWARE without understanding performance impact
❌ Global fake timers when only 5-10% of tests need them
❌ Not cleaning up fake timers (use `jest.useRealTimers()`)
❌ Unnecessary timer advancement in non-timing tests
❌ Multiple nested `advanceTimersByTime()` calls

## Related Knowledge

- `testing-timer-patterns` - Timer-based test patterns
- `testing-ci-local-parity` - CI environment consistency
