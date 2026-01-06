# Timer Testing Patterns

Testing time-dependent behavior including debounce, throttle, timeouts, and polling.

## UserEventProfile

**FAST** (Default, recommended): No timer delays, instant user interactions
**TIMER_AWARE**: Real delays, use only when testing actual timing

```typescript
const user = setupUserEvent({ profile: UserEventProfile.FAST });    // Recommended
const user = setupUserEvent({ profile: UserEventProfile.TIMER_AWARE }); // Rare
```

## Selective Fake Timers

✅ **Local fake timers** (recommended):
```typescript
it('should expire after timeout', async () => {
  jest.useFakeTimers();

  renderWithQuery(<Component />);

  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(await screen.findByText('Expired')).toBeVisible();

  jest.useRealTimers();
});
```

❌ **Global fake timers** (avoid): `beforeAll(() => jest.useFakeTimers())`
- Breaks MSW delays, React Query, async/await

## Testing Timeouts

```typescript
jest.useFakeTimers();
renderWithQuery(<SessionTimeout timeout={5000} />);

await act(async () => { jest.advanceTimersByTime(5000); });
expect(await screen.findByText('Expired')).toBeVisible();

jest.useRealTimers();
```

## Testing Debounce

```typescript
it('should debounce input', async () => {
  jest.useFakeTimers();
  const user = setupUserEvent({ profile: UserEventProfile.FAST });

  renderWithQuery(<SearchInput debounce={300} />);

  await user.type(screen.getByRole('textbox'), 'test');

  await act(async () => { jest.advanceTimersByTime(300); });
  expect(await screen.findByText('Results for: test')).toBeVisible();

  jest.useRealTimers();
});
```

## Testing Throttle

Similar to debounce: call function multiple times, advance timers, verify throttling works.

## Testing Polling/Intervals

```typescript
jest.useFakeTimers();
renderWithQuery(<PollingComponent interval={5000} />);

expect(mockFn).toHaveBeenCalledTimes(1);
await act(async () => { jest.advanceTimersByTime(5000); });
expect(mockFn).toHaveBeenCalledTimes(2);

jest.useRealTimers();
```

## Mocking Date

**Fixed**: `jest.setSystemTime(new Date('2023-01-01'))`
**Advance**: `jest.advanceTimersByTime(3600000)` moves time forward

## Cleanup

Always restore real timers: `afterEach(() => { jest.useRealTimers(); });`

## Anti-Patterns

❌ Global fake timers - breaks MSW/React Query
❌ Not restoring real timers in afterEach
❌ Using TIMER_AWARE without justification
❌ Mixing fake timers with MSW delays
