---
name: hook-patterns
description: Hook architecture, complexity levels, sidehook extraction patterns, form orchestration, query patterns, and hook composition guidelines.
globs: '**/*.{hook,sideHook}.{ts,tsx}'
alwaysApply: false
---

# Hook Patterns

Architecture and patterns for custom hooks: complexity levels, sidehook extraction, form management, query patterns.

---

## Hook Decision Tree

```
Need shared logic?
├─ YES: Reusable across 2+ components?
│   ├─ YES: <20 lines → Minimal wrapper hook
│   │        >60 lines → Extract to side-hooks
│   └─ NO: Keep in component
└─ NO: Keep in component
```

---

## Complexity Levels

| Level | Lines | Pattern | Action |
|-------|-------|---------|--------|
| 1 | 1–20 | Minimal wrapper | Single file |
| 2 | 20–60 | Query aggregation, derived state | Single file |
| 3 | 60–150 | Multiple queries/form integration | Consider side-hooks |
| 4 | 150–300 | Multi-step flows, wizard orchestration | Must use side-hooks |
| 5 | 300+ | App initialization, complex wizards | Must use side-hooks |
| 6 | Any | Single callback wrapper | Anti-pattern — don't create |

### Level 1–2 Examples

```typescript
// Level 1: Minimal wrapper
export const useToggle = (initial = false) => {
  const [value, setValue] = createSignal(initial);
  const toggle = () => setValue(v => !v);
  return [value, toggle] as const;
};

// Level 2: Query aggregation
export const useAccountDetails = (accountId: string) => {
  const query = createQuery(() => ['account', accountId], fetchAccount);
  const displayName = () => query.data ? `${query.data.firstName} ${query.data.lastName}` : 'Unknown';
  return { account: query.data, displayName, isLoading: query.isLoading };
};
```

### Level 4–5: Advanced Patterns

**50+ properties** — group into nested return objects:
```typescript
return {
  user: { data: user, isLoading, error },
  accounts: { data: accounts, totalBalance },
  actions: { refreshData, exportData },
};
```

---

## SideHooks Structure

### Purpose

When a `ComponentName.hook.ts` becomes too complex, split logic into sideHooks.

### When to Use SideHooks

Extract to sideHooks when:
- Hook file exceeds ~150 lines
- Logic is reusable across multiple components
- Logic groups into distinct concerns (API calls, state, calculations)

**Do NOT use sideHooks for**:
- Form configurations (use `ComponentName.formConfig.ts`)
- Validation logic (use `ComponentName.validation.ts`)
- Table/field configurations

### File Structure

```
ComponentName/
├── ComponentName.tsx
├── ComponentName.hook.ts          # Main hook (orchestrates sideHooks)
├── sideHooks/
│   ├── useSomeFeature.sideHook.ts
│   └── useAnotherFeature.sideHook.ts
└── tests/
    └── ComponentName.spec.tsx
```

### Naming Convention

- File: `use[FeatureName].sideHook.ts`
- Export: `export const use[FeatureName] = () => {}`

Examples:
- `useAddRelationshipManager.sideHook.ts`
- `usePinnedColumns.sideHook.ts`

### Usage Pattern

**Main hook orchestrates sideHooks**:

```typescript
// ComponentName.hook.ts
import { useSomeFeature } from './sideHooks/useSomeFeature.sideHook';
import { useAnotherFeature } from './sideHooks/useAnotherFeature.sideHook';

export const useComponentName = () => {
  const featureData = useSomeFeature();
  const { action, state } = useAnotherFeature(featureData.id);

  return {
    ...featureData,
    action,
    state,
  };
};
```

---

## Form Orchestration

### Basic Form Hook

```typescript
export const useProfileForm = (userId: string) => {
  const query = createQuery(() => ['user', userId], () => fetchUser(userId));
  const form = createForm({
    defaultValues: { firstName: query.data?.firstName ?? '', lastName: query.data?.lastName ?? '' },
    onSubmit: async (values) => { await updateUser(userId, values); },
  });
  return { form, user: query.data };
};
```

### Multi-Step Orchestration

```typescript
export const useWizardFlow = () => {
  const [currentStep, setCurrentStep] = createSignal(0);
  const [completedSteps, setCompletedSteps] = createSignal<number[]>([]);

  const goToStep = (step: number) => {
    if (completedSteps().includes(step - 1) || step === 0) setCurrentStep(step);
  };

  const completeStep = (step: number) => {
    setCompletedSteps(prev => [...prev, step]);
    setCurrentStep(step + 1);
  };

  return { currentStep, goToStep, completeStep };
};
```

---

## Query Patterns

### Conditional Query Execution

```typescript
// Enable based on previous query result
const customerQuery = createQuery(() => ['customer', id], () => fetchCustomer(id));
const accountsQuery = createQuery(
  () => customerQuery.data?.id ? ['accounts', customerQuery.data.id] : null,
  () => fetchAccounts(customerQuery.data!.id),
);
```

### Multi-Query Coordination

```typescript
// Parallel: all run simultaneously
const accountsQ = createQuery(() => ['accounts', userId], () => fetchAccounts(userId));
const txQ = createQuery(() => ['transactions', userId], () => fetchTransactions(userId));
const isLoading = () => accountsQ.isLoading || txQ.isLoading;
```

### Query Optimization

```typescript
// Polling (live prices)
createQuery(() => ['price', assetId], () => fetchPrice(assetId), {
  refetchInterval: 30000,
  staleTime: 0,
});

// Rare changes (reference data)
createQuery(() => ['reference', type], () => fetchReferenceData(type), {
  staleTime: 60 * 60 * 1000,    // 1 hour
  gcTime: 24 * 60 * 60 * 1000,  // 24 hours
});
```

### Optimistic Updates

```typescript
const mutation = createMutation(updateAccount, {
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['account', newData.id]);
    const previous = queryClient.getQueryData(['account', newData.id]);
    queryClient.setQueryData(['account', newData.id], newData);
    return { previous };
  },
  onError: (err, newData, context) =>
    queryClient.setQueryData(['account', newData.id], context.previous),
  onSettled: (data, error, vars) =>
    queryClient.invalidateQueries(['account', vars.id]),
});
```

---

## Naming Conventions

- **Main hooks**: `ComponentName.hook.ts` → `useComponentName`
- **Side-hooks**: `useFeatureName.sideHook.ts` → `useFeatureName`
- **Generic shared**: `useUtilityName.hook.ts`

## Composition Strategy

```typescript
// Level 1-2: Flat
return { state, query };

// Level 3-5: Hierarchical (compose side-hooks)
export const useComponent = () => {
  const auth = useAuth();
  const data = useData(auth.userId);
  const actions = useActions(data.id);
  return { ...auth, ...data, ...actions };
};
```

## When to Create / When NOT to

**Create**: Reused in 2+ components, state+effects encapsulation, testable independently
**Don't**: One-time use, single state wrapper, pure calculation (use util), single callback wrapper

## Quick Reference

| Pattern | Key Concept |
|---------|-------------|
| Conditional query | `enabled` / nullable query key |
| Sequential deps | Enabled on dependent query |
| Parallel queries | Multiple `createQuery` calls |
| Polling | `refetchInterval` |
| Rare changes | `staleTime: 1h+` |
| Optimistic update | `onMutate` + rollback |
