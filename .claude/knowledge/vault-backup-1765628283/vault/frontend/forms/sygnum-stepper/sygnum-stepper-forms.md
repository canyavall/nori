# Sygnum Stepper Forms

<!--
Migrated from: temp-FE-Mono/technical/sygnum-stepper/sygnum-stepper-forms.md
Migration date: 2025-12-08
Original category: technical/sygnum-stepper
New category: patterns/sygnum/sygnum-stepper
Source repo: temp-FE-Mono
-->

# Sygnum Stepper - Forms Integration

Integrating forms with stepper workflows.

## Form State Management

```typescript
const [formData, setFormData] = useState({});

const handleStepData = (stepId: string, data: any) => {
  setFormData(prev => ({ ...prev, [stepId]: data }));
};

const steps = [
  {
    id: 'personal',
    label: 'Personal Info',
    component: (props) => (
      <PersonalInfoForm
        initialData={formData.personal}
        onSubmit={(data) => {
          handleStepData('personal', data);
          props.next();
        }}
      />
    ),
  },
];
```

## With Yoda Form

```typescript
import { useYodaCreateForm } from '@sygnum/yoda-form';

const StepForm = ({ onNext }) => {
  const { providerFields, useWatchField } = useYodaCreateForm();
  const formState = useWatchField('__form__');

  return (
    <YodaFormProvider {...providerFields}>
      <YodaTextField name="email" validation={validation.email} />
      <Button
        onClick={() => {
          if (formState.isValid) {
            onNext(formState.values);
          }
        }}
        disabled={!formState.isValid}
      >
        Next
      </Button>
    </YodaFormProvider>
  );
};
```

## Multi-Step Form

```typescript
const WizardForm = () => {
  const [wizardData, setWizardData] = useState({});
  const stepper = useSygnumStepper({ steps });

  const handleSubmit = async () => {
    // Submit all collected data
    await submitWizardData(wizardData);
  };

  return (
    <SygnumStepper {...stepper}>
      {stepper.isLastStep && (
        <Button onClick={handleSubmit}>Submit</Button>
      )}
    </SygnumStepper>
  );
};
```
