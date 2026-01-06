# Sygnum Stepper Basics

<!--
Migrated from: temp-FE-Mono/technical/sygnum-stepper/sygnum-stepper-basics.md
Migration date: 2025-12-08
Original category: technical/sygnum-stepper
New category: patterns/sygnum/sygnum-stepper
Source repo: temp-FE-Mono
-->

# Sygnum Stepper - Basics

Multi-step stepper and wizard workflow.

## Core Components

```typescript
import { SygnumStepper } from '@sygnum/sygnum-stepper/components';
import { useSygnumStepper } from '@sygnum/sygnum-stepper/hooks';

const steps = [
  { id: 'step1', label: t('steps.personal'), component: PersonalInfo },
  { id: 'step2', label: t('steps.address'), component: AddressInfo },
  { id: 'step3', label: t('steps.review'), component: Review },
];

function Wizard() {
  const stepper = useSygnumStepper({ steps });

  return (
    <SygnumStepper
      steps={steps}
      activeStep={stepper.activeStep}
      onStepClick={stepper.goToStep}
    >
      {stepper.currentStepComponent}
    </SygnumStepper>
  );
}
```

## Step Configuration

```typescript
interface Step {
  id: string;
  label: string;
  component: ComponentType;
  optional?: boolean;
  disabled?: boolean;
  validation?: () => boolean | Promise<boolean>;
}
```

## useSygnumStepper Hook

```typescript
const {
  activeStep,
  currentStepComponent,
  isFirstStep,
  isLastStep,
  next,
  back,
  goToStep,
  reset,
} = useSygnumStepper({ steps, initialStep: 0 });
```
