# Yoda Form Validation

<!--
Migrated from: temp-FE-Mono/technical/yoda-form/yoda-form-validation.md
Migration date: 2025-12-08
Original category: technical/yoda-form
New category: patterns/frontend/yoda-form
Source repo: temp-FE-Mono
-->

# Yoda Form - Validation

Yup validation patterns and rules.

## File Organization (MANDATORY)

```typescript
// Component.validation.ts
import { useTranslation } from 'react-i18next';
import { string, number } from 'yup';

// MANDATORY: Export as hook for i18n
export const useComponentValidation = () => {
  const { t } = useTranslation();

  return {
    email: string()
      .required(t('validationError.required'))
      .email(t('validationError.email.invalid')),
    amount: number()
      .transform(v => (isNaN(v) ? null : v))
      .required(t('validationError.required'))
      .moreThan(0),
  };
};
```

## Core Validation Types

### String Validation

```typescript
string()
  .required()
  .min(3)
  .max(20)
  .email()
  .url()
  .matches(/pattern/)
```

### Number with BigNumber (MANDATORY for financial)

```typescript
import BigNumber from 'bignumber.js';

number()
  .transform(v => (isNaN(v) ? null : v))
  .required()
  .moreThan(0)
  .test('max', msg, v =>
    new BigNumber(v).isLessThanOrEqualTo(max)
  )
```

### Date, Boolean, Array

```typescript
// Date
date().required().max(maxDate).typeError()

// Boolean
boolean().required().oneOf([true])

// Array
array().of(string()).min(1).max(5)
```

### Conditional Validation

```typescript
password: (values: YodaFieldsState) =>
  values['username']?.value?.length > 5
    ? string().required()
    : null
```

### Custom Test

```typescript
.test('name', 'message', value => /* validation logic */)
```

### Async Validation

```typescript
.test('unique', 'Taken', async value =>
  (await axios.get(`/check/${value}`)).data.available
)
```
