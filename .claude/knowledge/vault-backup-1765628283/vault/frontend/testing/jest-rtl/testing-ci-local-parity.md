# CI/Local Parity

Ensuring tests behave consistently between local development and CI environments.

## Core Problem

Tests pass locally but fail in CI (or vice versa). Root cause: Environment differences.

## Common Differences

**Parallelization**: CI runs tests in parallel, local may run sequentially
**Resources**: CI has limited CPU/memory, affects timing
**Environment vars**: Different configs, missing secrets
**Dependencies**: Different versions, cache states
**File system**: Case sensitivity, permissions, paths
**Timezones**: CI often UTC, local varies
**Network**: CI may have restrictions, different latency

## Detection

**Run locally with CI settings**:
```bash
npx nx test --runInBand --maxWorkers=1 --detectOpenHandles
```

**Check differences**:
- Compare Node versions: `node --version`
- Compare package versions: `npm list`
- Check env vars: `process.env`

## Parallelization Issues

**Problem**: Tests fail when run in parallel, pass sequentially

**Diagnosis**: `npx nx test --runInBand` (passes) vs `npx nx test --maxWorkers=4` (fails)

**Fix**: Ensure proper test isolation (see `testing-isolation`)

## Environment Variables

**Problem**: Missing config in CI

**Fix**: Add to CI secrets/variables
```yaml
variables:
  API_URL: "https://api.test.com"
  NODE_ENV: "test"
```

## Timing Differences

**Problem**: CI slower, timeouts expire

**Fix**: Increase timeouts in CI:
```typescript
const timeout = process.env.CI ? 10000 : 5000;
await screen.findByText('Data', {}, { timeout });
```

## File System Issues

**Case sensitivity** (macOS → Linux):
- macOS: `import './Component'` works for `component.tsx`
- Linux CI: Fails, requires exact case

**Fix**: Use exact case in imports, enable linting

## Timezone Differences

**Problem**: Date tests fail in CI (UTC) vs local (PST/EST)

**Fix**: Mock dates consistently:
```typescript
jest.useFakeTimers();
jest.setSystemTime(new Date('2023-01-01T12:00:00Z')); // Always UTC
```

## Docker Parity

Run tests in Docker locally to match CI:
```bash
docker run --rm -v $(pwd):/app -w /app node:18 npm test
```

## Best Practices

✅ Pin Node version ✅ Lock dependencies ✅ Use `--runInBand` for serial execution ✅ Detect leaks with `--detectOpenHandles`

## Debugging CI Failures

1. Reproduce locally with CI settings
2. Download CI artifacts (logs, screenshots)
3. Add verbose logging
4. Isolate with `--testNamePattern`

## Related Knowledge

- `testing-isolation` - Test isolation patterns
- `testing-flaky-detection` - Detect environment-specific issues
