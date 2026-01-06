# Sygnum Shared Components Layouts

<!--
Migrated from: temp-FE-Mono/technical/sygnum-shared-components/sygnum-shared-components-layouts.md
Migration date: 2025-12-08
Original category: technical/sygnum-shared-components
New category: patterns/sygnum/sygnum-shared-components
Source repo: temp-FE-Mono
-->

# Sygnum Shared Components - Layouts

Application-level layout components.

## CommonLayout

Standard page layout with header, navigation, and content area.

```typescript
import { CommonLayout } from '@sygnum/sygnum-shared-components/layouts/CommonLayout';

<CommonLayout
  title="Dashboard"
  breadcrumbs={breadcrumbs}
  actions={<Button>Action</Button>}
>
  <PageContent />
</CommonLayout>
```

## CompactLayout

Minimal layout for focused workflows.

```typescript
import { CompactLayout } from '@sygnum/sygnum-shared-components/layouts/CompactLayout';

<CompactLayout
  title="Transaction Details"
  onBack={handleBack}
>
  <TransactionDetails />
</CompactLayout>
```

## FormLayout

Layout optimized for forms with stepper.

```typescript
import { FormLayout } from '@sygnum/sygnum-shared-components/layouts/FormLayout';

<FormLayout
  title="Create Account"
  currentStep={2}
  totalSteps={4}
  onCancel={handleCancel}
>
  <AccountForm />
</FormLayout>
```

## StepperLayout

Multi-step wizard layout.

```typescript
import { StepperLayout } from '@sygnum/sygnum-shared-components/layouts/StepperLayout';

<StepperLayout
  steps={steps}
  activeStep={activeStep}
  onStepChange={handleStepChange}
>
  {currentStepContent}
</StepperLayout>
```
