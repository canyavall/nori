# Yoda Form Basics

<!--
Migrated from: temp-FE-Mono/technical/yoda-form/yoda-form-basics.md
Migration date: 2025-12-08
Original category: technical/yoda-form
New category: patterns/frontend/yoda-form
Source repo: temp-FE-Mono
-->

# Yoda Form - Basics

Form management library with Yup validation and declarative API.

## When to Use

- Creating forms with validation
- Multi-step forms with stepper
- Conditional fields and dynamic validation
- File uploads with validation
- Financial amount inputs with BigNumber

## Core Setup

### useYodaCreateForm Hook

```typescript
const {
  providerFields,
  useWatchField,
  setValue,
  resetForm,
  registerField,
  removeField
} = useYodaCreateForm({
  debounceTime: 300,
  validationStrategy: 'onChange'
});
```

### useYodaForm Hook

```typescript
const yodaMethods = useYodaForm();
```

### Watch Field Values

```typescript
const { value, isDirty, isValid } = useWatchField('fieldName');
const formState = useWatchField('__form__');
```

## YodaFormProvider (MANDATORY)

All forms MUST be wrapped in YodaFormProvider:

```typescript
import { useYodaCreateForm } from '@sygnum/yoda-form/hooks';
import { YodaFormProvider } from '@sygnum/yoda-form/contexts/YodaFormProvider';

const FormComponent = () => {
  const { providerFields, useWatchField } = useYodaCreateForm();
  const formState = useWatchField('__form__');

  return (
    <YodaFormProvider {...providerFields}>
      <YodaTextField
        name="email"
        validation={validation.email}
      />
      <Button
        onClick={handleSubmit}
        disabled={!formState.isValid}
      >
        Submit
      </Button>
    </YodaFormProvider>
  );
};
```
