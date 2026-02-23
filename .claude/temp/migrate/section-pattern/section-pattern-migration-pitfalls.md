---
tags:
  - section-pattern
  - migration
  - pitfalls
  - troubleshooting
description: >-
  Section Pattern migration pitfalls and troubleshooting: common mistakes,
  circular dependencies, boundary violations, and debugging commands
required_knowledge:
  - section-pattern
  - section-pattern-migration-guide
rules:
  - "**/sections/**/*.tsx"
  - "**/sections/**/*.ts"
---
# Section Pattern Migration Pitfalls

Common mistakes and troubleshooting guide.

## Pitfall 0: Incomplete Integration (MOST CRITICAL)

New code created but never integrated — dead code.

```bash
# Check if new code is used
grep -r "YourNewCode" libs/ apps/
# No matches → DEAD CODE

# Check if old code still imported
grep -r "from.*path/to/OldCode" libs/ apps/
# Matches found → INCOMPLETE
```

**Fix**: Update ALL imports, delete old files, verify with grep.

## Pitfall 1: Forgetting to Update Imports

Old imports still exist after migration.

```bash
grep -r "from '@modules/banking/bank-client/pages'" apps/
# Update to new section import
```

## Pitfall 2: Moving Too Much Too Fast

❌ `PR: Migrate entire banking module (142 files changed)`
✅ One section per PR for easier review.

## Pitfall 3: Breaking Translations

Verify namespace matches file location:
```typescript
// modules/banking/bank-client/locales/banking.en.json
const { t } = useTranslation('banking');
t('transactions.title'); // ✓
```

## Pitfall 4: Not Updating Tests

```typescript
// ❌ Test imports old page
import { TransactionsPage } from '@modules/banking/pages';

// ✅ Test imports section
import { TransactionsSection } from '@modules/banking/bank-client';
jest.mock('@modules/banking/bank-client', () => ({
  TransactionsSection: jest.fn(() => <div>Mocked</div>),
}));
```

## Pitfall 5: Leaving Dead Code

Old page still exists alongside new section. Delete after validation:
```bash
npm run test && npm run build
grep -r "pages/Transactions" .
rm -rf libs/modules/banking/bank-client/src/pages/Transactions/
```

## Pitfall 6: Circular Dependencies

Over-extraction creates cycles. Extract shared logic to `hooks/` or `components/`:
```typescript
// ✅ Both sections import shared hook
import { useAccountData } from '../../hooks/useAccountData';
```

**Detect**: `npx madge --circular --extensions ts,tsx libs/modules/`

## Troubleshooting

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Circular dependency | `npx madge --circular` | Extract shared to components/hooks |
| ESLint boundary violation | Check `project.json` tags | Move to shared or duplicate |
| Tests failing (module not found) | `grep -r "pages/OldPage" **/*.spec.tsx` | Update test imports + mocks |
| Performance degradation | Profile renders | Add `useCallback`, check barrel imports |
| Translation keys not found | Check `useTranslation` namespace | Verify locale file path matches |

## Validation Commands

```bash
# Cross-module imports (should be empty)
grep -r "@modules/" libs/modules/banking/bank-client/src/ | grep -v "from '@modules/banking"

# Circular dependencies
npx madge --circular --extensions ts,tsx libs/modules/

# Module graph
npx nx graph --focus=modules-banking-bank-client

# Barrel import audit
grep -r "from '@sygnum/suil'" libs/modules | grep -v "from '@sygnum/suil/components/"
```
