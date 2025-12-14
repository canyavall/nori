# Nx Performance

Performance optimization, cache management, and troubleshooting for Nx monorepo.

## Cache Management

**Clear cache** (when debugging issues):
```bash
npx nx reset
```

**Skip cache** (single command):
```bash
npx nx test [project] --skip-nx-cache
npx nx build [project] --skip-nx-cache
```

Cache auto-invalidates on file/dependency/config changes.

## Testing Strategies

Choose the right command for your workflow:

**File-level** (quick iteration during development):
```bash
npx jest path/to/test.spec.ts
```

**Project-level** (full validation before commit):
```bash
npx nx test [project]
```

**Affected** (CI/CD optimization):
```bash
npx nx affected -t test
```

## Troubleshooting

**Memory issues**:
```bash
npx nx test [project] --maxWorkers=50%
```

**Slow tests** - Use `affected` commands

**Type errors**:
```bash
npx nx reset
npx nx tsCheck [project]
```

**Build failures**:
```bash
npx nx reset
npx nx build [project]
```

**Cache issues** - Clear with `npx nx reset` or skip with `--skip-nx-cache`

## Best Practices

**Do**:
- ✅ Use affected commands for faster CI/CD
- ✅ Leverage Nx cache for performance
- ✅ Use file-level commands for quick iteration
- ✅ Use project-level commands for validation
- ✅ Clear cache when debugging strange issues

**Don't**:
- ❌ Skip affected commands in CI
- ❌ Ignore cache issues (reset when needed)
- ❌ Commit without running validation
