# Task Completion Checklist

When a task is marked as complete, ensure the following steps are done:

## 1. Code Quality

### Type Check
```bash
cd app && npm run typecheck
```
**Must pass**: No TypeScript errors

### Lint
```bash
cd app && npm run lint
```
**Must pass**: No ESLint errors

**Note**: Auto-fix available with `eslint --fix src/`

## 2. Testing

### Unit Tests
```bash
cd app && npm run test
```
**Must pass**: All tests passing

### E2E Tests (if UI changes)
```bash
cd app && npm run test:e2e
```
**Must pass**: All E2E tests passing (only if feature touches user-facing UI)

## 3. Manual Testing

### Start Dev Server
```bash
cd app && npm run dev
```

### Test the Feature
- Open Electron window
- Verify feature works as expected
- Check browser console for errors (Ctrl+Shift+I)
- Check terminal for backend errors

### Scenarios to Test
- **Frontend changes**: Hot reload works, no console errors
- **Backend changes**: API endpoints work, WebSocket functional
- **Database changes**: Migrations applied, data persists
- **Auth changes**: OAuth flow works, tokens saved

## 4. Build Verification

### Production Build
```bash
cd app && npm run build
```
**Must pass**: Build succeeds without errors

## 5. Documentation (if needed)

### Update Documentation
- If new feature: Update CLAUDE.md or relevant docs
- If API changes: Update API documentation
- If new command: Add to suggested_commands.md

## 6. Git Workflow

### Stage Changes
```bash
git add .
```

### Commit
```bash
git commit -m "feat: descriptive message"
```

**Commit message format**:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `test:` - Test changes
- `docs:` - Documentation
- `chore:` - Tooling/config

### Push
```bash
git push
```

## Common Issues & Fixes

### TypeScript Errors
- Check imports are correct
- Verify types are properly defined
- Ensure `no-explicit-any` rule not violated

### Test Failures
- Check mocks are up to date
- Verify test setup in `test/setup.ts`
- Check async operations are properly awaited

### Build Failures
- Run `npm install` (dependencies might be outdated)
- Delete `dist/` and rebuild
- Check for circular dependencies

### Database Issues
- Check migrations ran successfully
- Verify `~/.nori/nori.db` is not locked
- Delete database and restart if needed

## Quick Checklist

Before marking task as complete:

- [ ] Type check passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Unit tests pass (`npm run test`)
- [ ] E2E tests pass (if UI changes)
- [ ] Manual testing completed
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated (if needed)
- [ ] Changes committed and pushed
