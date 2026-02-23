---
name: section-pattern
description: Three-layer architecture (Apps → Modules → Domain), section types, dependency rules, implementation templates, migration guide, and common pitfalls.
globs: '**/sections/**/*.{ts,tsx}'
alwaysApply: false
---

# Section Pattern

Architectural pattern for organizing the UI by functional domains with enforced boundaries.

---

## Core: Three-Layer Architecture

```
Apps → Modules → Infrastructure
```

**Apps** — Pages (routing glue), routes, app-wide layout
**Modules / Features** — Feature sections, domain components, API, state
**Infrastructure / Shared** — Shared utilities, design system, constants

---

## Two Section Types

### Feature Sections (`features/<domain>/<feature>/sections/`)
- ✅ Domain-specific business logic, state + API calls
- ✅ Composes 3+ components, has route/page context
- ❌ NOT reusable across domains

### Shared Sections (`shared/sections/`)
- ✅ Pure presentation (props → UI), reusable across all domains
- ❌ NO business logic, NO API calls or state

---

## Route → Page → Section Flow

```typescript
// Route (config)
element: <ThankYou />

// Page (glue, 4-10 LOC)
export const ThankYou: Component = () => <ThankYouSection />;

// Section (full implementation)
export const ThankYouSection: Component = () => {
  const { data, handleAction } = useThankYouSection();
  return <div>{/* Complete UI */}</div>;
};
```

---

## Dependency Rules (CRITICAL)

### Module-to-Module Isolation

```typescript
// ❌ Cross-module import
import { BankingUtil } from '../banking/bank-client';
// ✅ Use shared libraries
import { formatCurrency } from '@nori/shared';
```

### App-to-Module: Import sections only (public API)

```typescript
// ✅ Import section
import { TransactionsSection } from '../features/transactions';
// ❌ Import internals
import { useHook } from '../features/transactions/hooks';
```

---

## File Structure

```
FeatureSection/
├── FeatureSection.tsx              # Component (pure presentation)
├── FeatureSection.hook.ts          # Business logic (no JSX)
├── FeatureSection.hook.tsx         # Business logic (with JSX) — use when needed
├── FeatureSection.style.ts         # Styling
├── FeatureSection.type.ts          # Types (if needed)
└── tests/FeatureSection.spec.tsx   # Tests
```

**Hook extension rule**: `.hook.tsx` when hook returns JSX elements, `.hook.ts` otherwise.

---

## Component Template (.tsx)

```typescript
import type { Component } from 'solid-js';
import { useSectionName } from './SectionName.hook';

export const SectionName: Component = () => {
  const { data, isLoading, handleAction } = useSectionName();

  return (
    <div>
      <h2>{data()?.title}</h2>
    </div>
  );
};
```

**Rules**: Named export, no inline logic, no inline handlers.

---

## Hook Template (.hook.ts)

```typescript
import { createSignal } from 'solid-js';

export const useSectionName = () => {
  // ALL handlers must be stable functions (not inline)
  const handleAction = () => {
    // Business logic
  };

  return { handleAction };
};
```

**Responsibilities**: State, API calls, handlers, computed values, side effects.

---

## Testing Template (.spec.tsx)

```typescript
import { render, screen } from '@solidjs/testing-library';
import { SectionName } from '../SectionName';
import { useSectionName } from '../SectionName.hook';

vi.mock('../SectionName.hook');
const mockUse = useSectionName as ReturnType<typeof vi.fn>;

describe('SectionName', () => {
  beforeEach(() => {
    mockUse.mockReturnValue({
      data: () => ({ title: 'Title' }),
      handleAction: vi.fn(),
    });
  });

  it('renders title', () => {
    render(() => <SectionName />);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });
});
```

**Principles**: Mock the hook (not individual deps), test behavior (not implementation).

---

## Decision Tree

```
Complete feature with business logic?
├─ YES → Feature Section (features/*/sections/)
├─ NO → Generic presentation for reuse?
│   ├─ YES → Shared Section (shared/sections/)
│   └─ NO → Component (features/*/components/)
```

---

## Migration Guide

### Philosophy

- ✅ Start with new features using the pattern
- ✅ Refactor opportunistically when touching existing code
- ❌ NO big-bang migrations

### CRITICAL: Refactoring is NOT Complete Until Integration

**ANY refactoring is ONLY complete when**:
1. New code is created AND working
2. Old code imports replaced with new code
3. Old code files deleted
4. Tests verify new code works
5. No references to old code remain

### Page to Section Migration (Step by Step)

1. **Analyze** existing page — identify components, state, API calls, business logic
2. **Create section folder** with all files (`.tsx`, `.hook.ts`, `.style.ts`, tests)
3. **Extract logic** — business logic to hook, UI to component
4. **Update routes** — create thin page glue component
5. **Update ALL imports** throughout codebase from old to new
6. **Delete old files** after verification
7. **Run**: tests, lint, build, manual smoke test
8. **Verify**: `grep -r "OldPage" src/` returns nothing

### Migration Checklist

- [ ] Analyze current structure and dependencies
- [ ] Create section folder with all files
- [ ] Extract logic to hook, UI to component
- [ ] Update route to use new section via thin page
- [ ] Update ALL imports throughout codebase
- [ ] Delete old files
- [ ] Run tests, lint, build
- [ ] Verify: `grep -r "OldPage" src/` returns nothing

---

## Common Pitfalls

### Pitfall 0: Incomplete Integration (MOST CRITICAL)

New code created but never integrated — dead code.

```bash
# Check if new code is used
grep -r "YourNewCode" src/
# No matches → DEAD CODE

# Check if old code still imported
grep -r "from.*path/to/OldCode" src/
# Matches found → INCOMPLETE
```

### Pitfall 1: Forgetting to Update Imports

Old imports still exist after migration. Always grep for old paths.

### Pitfall 2: Moving Too Much Too Fast

- ❌ PR: Migrate entire feature module (100+ files changed)
- ✅ One section per PR for easier review

### Pitfall 3: Not Updating Tests

```typescript
// ❌ Test imports old page
import { TransactionsPage } from '../pages/TransactionsPage';

// ✅ Test imports section
import { TransactionsSection } from '../features/transactions';
```

### Pitfall 4: Leaving Dead Code

Old page still exists alongside new section. Delete after validation:
```bash
npm test && npm run build
grep -r "pages/Transactions" .
rm -rf src/pages/Transactions/
```

### Pitfall 5: Circular Dependencies

Over-extraction creates cycles. Extract shared logic to `hooks/` or `components/`:
```typescript
// ✅ Both sections import shared hook
import { useAccountData } from '../../hooks/useAccountData';
```

---

## Anti-Patterns

- ❌ Business logic in component (use hook)
- ❌ Inline handlers (`onClick={() => ...}`) — use function in hook
- ❌ Missing type annotation on component
- ❌ Creating section without integrating (dead code)
- ❌ Cross-domain imports (use shared libraries)
