# Nx Commands

Essential Nx commands for development, testing, building, and affected operations.

## Common Targets

- `serve` - Dev server (apps only)
- `build` - Production build
- `test` - Jest tests
- `lint` - ESLint
- `tsCheck` - TypeScript type checking (**NOT** `typecheck`)
- `storybook` - Component documentation

**CRITICAL**: Always use `tsCheck` target, NOT `typecheck`.

## Development

```bash
npx nx serve admin-panel
npx nx serve bank-client --port 4201
```

## Testing

**Project-level** (full validation):
```bash
npx nx test [project]
```

**File-level** (quick iteration):
```bash
npx jest path/to/test.spec.ts
```

## Linting

```bash
npx nx lint [project] --fix
```

## Type Checking

```bash
npx nx tsCheck [project]
```

## Build

```bash
npx nx build [app]
npx nx build [app] --configuration=production
```

## Affected Commands

Run only on changed projects (CI/CD optimization):

```bash
npx nx affected -t test
npx nx affected -t lint --fix
npx nx affected -t build
npx nx affected -t tsCheck
```

## Command Reference

| Task             | Command                         | Use Case                |
|------------------|---------------------------------|-------------------------|
| Dev server       | `npx nx serve [app]`            | Local development       |
| Build            | `npx nx build [app]`            | Production build        |
| Test project     | `npx nx test [project]`         | Full validation         |
| Test file        | `npx jest path/to/test.spec.ts` | Quick iteration         |
| Lint             | `npx nx lint [project] --fix`   | Code quality            |
| Type check       | `npx nx tsCheck [project]`      | Type validation         |
| Affected tests   | `npx nx affected -t test`       | CI/CD optimization      |
| Dependency graph | `npx nx graph`                  | Understanding deps      |
