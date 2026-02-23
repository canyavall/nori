---
tags:
  - react-hooks
  - forms
  - yoda-forms
  - hook
  - sideHook
  - ts
  - tsx
description: Form management patterns in hooks - useYodaCreateForm integration, multi-step orchestration, validation, reset, and persistence.
required_knowledge:
  - react-project-conventions
rules:
  - "**/*{.hook,.sideHook}.{ts,tsx}"
---

# React Hooks Form Orchestration

Patterns for managing forms in custom hooks using useYodaCreateForm. For stepper component integration, see `sygnum-stepper`.

## Basic Form Hook

```typescript
export const useProfileForm = (userId: string) => {
  const { data: user } = useQuery(['user', userId], () => fetchUser(userId));
  const form = useYodaCreateForm({
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' },
    onSubmit: async (values) => { await updateUser(userId, values); },
  });
  return { form, user };
};
```

## Multi-Step Orchestration

```typescript
export const useWizardFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const form = useYodaCreateForm({ defaultValues: { step1Data: {}, step2Data: {} } });

  const goToStep = useCallback((step: number) => {
    if (completedSteps.includes(step - 1) || step === 0) setCurrentStep(step);
  }, [completedSteps]);

  const completeStep = useCallback((step: number) => {
    setCompletedSteps(prev => [...prev, step]);
    setCurrentStep(step + 1);
  }, []);

  return { form, currentStep, goToStep, completeStep };
};
```

## Conditional Steps

```typescript
const entityType = form.watch('entityType');
const steps = useMemo(() => {
  const base = ['Basic Info', 'Contact'];
  return entityType === 'corporate'
    ? [...base, 'Corporate Details', 'Directors', 'Review']
    : [...base, 'Personal Details', 'Review'];
}, [entityType]);
```

## Validation

```typescript
// Cross-field sync + async API check
const form = useYodaCreateForm({
  validate: (values) => values.amount > values.balance ? { amount: 'Insufficient' } : {},
  validateAsync: async (values) => {
    const available = await checkAvailability(values.username);
    return available ? {} : { username: 'Taken' };
  },
});
```

## Reset & Persistence

```typescript
// Reset to initial values
const resetForm = useCallback(() => form.reset(initialData), [form, initialData]);

// Reset to specific step (clear fields after target)
const resetToStep = useCallback((target: number) => {
  form.reset({ ...form.getValues(), ...getFieldsForStepsAfter(target) });
  setStep(target);
}, [form]);

// SessionStorage auto-save
const values = form.watch();
useEffect(() => { sessionStorage.setItem(key, JSON.stringify(values)); }, [values, key]);

// Async data loading
const { data } = useQuery(['entity', id], fetchEntity);
useEffect(() => { if (data) form.reset(data); }, [data, form]);
```

## Combine Multiple Forms

```typescript
const submitAll = useCallback(async () => {
  const [valid1, valid2] = await Promise.all([form1.trigger(), form2.trigger()]);
  if (valid1 && valid2) await submitApplication({ ...form1.getValues(), ...form2.getValues() });
}, [form1, form2]);
```

## Quick Reference

| Pattern | Key Method |
|---------|------------|
| Basic form | `useYodaCreateForm` |
| Multi-step | State + conditional rendering |
| Cross-field validation | `validate` option |
| Async validation | `validateAsync` option |
| Dynamic fields | `form.setValue` with arrays |
| Persistence | SessionStorage + `useEffect` |
| Reset | `form.reset()` |

For hook architecture, see `react-hooks-architecture`. For query patterns in forms, see `react-hooks-query-patterns`.
