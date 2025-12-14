# Sygnum Stepper Navigation

<!--
Migrated from: temp-FE-Mono/technical/sygnum-stepper/sygnum-stepper-navigation.md
Migration date: 2025-12-08
Original category: technical/sygnum-stepper
New category: patterns/sygnum/sygnum-stepper
Source repo: temp-FE-Mono
-->

# Sygnum Stepper - Navigation

Navigation methods and patterns.

## Navigation Methods

```typescript
const { next, back, goToStep, canGoNext, canGoBack } = useSygnumStepper({ steps });

// Go to next step
<Button onClick={next} disabled={!canGoNext}>
  Next
</Button>

// Go to previous step
<Button onClick={back} disabled={!canGoBack}>
  Back
</Button>

// Jump to specific step
<Button onClick={() => goToStep(2)}>
  Go to Step 3
</Button>
```

## Validation

```typescript
const steps = [
  {
    id: 'step1',
    label: 'Personal Info',
    component: PersonalInfo,
    validation: async () => {
      const isValid = await validatePersonalInfo();
      return isValid;
    },
  },
];

// Stepper will call validation before allowing next()
```

## URL Synchronization

```typescript
const stepper = useSygnumStepper({
  steps,
  syncWithUrl: true,
  urlParam: 'step',
});

// URL will update to ?step=2 when navigating
// Browser back/forward buttons work automatically
```

## Conditional Steps

```typescript
const steps = [
  { id: 'step1', label: 'Step 1', component: Step1 },
  {
    id: 'step2',
    label: 'Step 2',
    component: Step2,
    disabled: !someCondition,
  },
];
```
