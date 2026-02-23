---
tags:
  - section-pattern
  - migration
  - refactoring
description: >-
  Section Pattern migration: phase rollout, step-by-step page-to-section
  migration, and integration completeness rules
required_knowledge:
  - section-pattern
  - section-pattern-implementation
rules:
  - "**/sections/**/*.tsx"
  - "**/sections/**/*.ts"
---
# Section Pattern Migration Guide

Practical migration strategy for adopting the Section Pattern.

## Migration Philosophy

- ✅ Start with pilot sections (protect, client-service, prequalification)
- ✅ New features MUST use pattern
- ✅ Refactor opportunistically
- ❌ NO big-bang migrations

## CRITICAL: Refactoring is NOT Complete Until Integration

**ANY refactoring is ONLY complete when**:
1. New code is created AND working
2. Old code imports replaced with new code
3. Old code files deleted
4. Tests verify new code works
5. No references to old code remain

```bash
# Verify new code is used
grep -r "YourNewCode" libs/ apps/
# If no matches → DEAD CODE

# Verify old code gone
grep -r "from.*path/to/OldCode" libs/ apps/
# If matches → INCOMPLETE
```

## Phase Rollout

**Phase 1: Pilot** — Select simple module, create 1-2 sections, document learnings
**Phase 2: Enforcement** — ALL new features MUST use section pattern
**Phase 3: Gradual Refactor** — Refactor when touching existing code (one section per PR)

## Page to Section Migration (Step by Step)

### 1. Analyze existing page
Identify components, state, API calls, translations, business logic.

### 2. Create section folder
```
libs/modules/{domain}/{app}/src/sections/{feature}/
├── FeatureSection.tsx
├── FeatureSection.hook.ts      # .tsx if hook contains JSX
├── FeatureSection.style.ts
└── tests/FeatureSection.spec.tsx
```

### 3. Extract logic
Move business logic to hook, UI to component (see `section-pattern-implementation`).

### 4. Export from module
```typescript
// libs/modules/{domain}/{app}/src/index.ts
export * from './sections/{feature}';
```

### 5. Create app page (glue)
```typescript
export const FeaturePage: FC = () => <FeatureSection />;
```

### 6. Update routes + clean up (MANDATORY)
- Update ALL imports from old to new
- Delete old page files
- Verify no remaining old imports
- Run tests

## Migration Checklist

- [ ] Analyze current structure and dependencies
- [ ] Create section folder with all files
- [ ] Extract logic to hook, UI to component
- [ ] Export from module index
- [ ] Create app page, update routes
- [ ] Update ALL imports throughout codebase
- [ ] Delete old files
- [ ] Run: tests, lint, build, manual smoke test
- [ ] Verify: `grep -r "OldPage" libs/ apps/` returns nothing
