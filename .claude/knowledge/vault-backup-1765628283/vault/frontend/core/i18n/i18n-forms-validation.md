# i18n Forms and Validation

Translation patterns for form validation messages. See `yoda-form-validation` for validation schema patterns.

## Validation Hook Pattern (MANDATORY)

```typescript
import { useTranslation } from 'react-i18next';
import { string, number } from 'yup';

export const useLoginValidation = () => {
  const { t } = useTranslation();

  return {
    email: string()
      .required(t('validationError.required'))
      .email(t('validationError.email')),
    password: string()
      .required(t('validationError.required'))
      .min(8, t('validationError.minLength', { min: 8 })),
  };
};
```

**Why hooks:** Validation schemas need access to `t()` for translated messages.

## Standard Validation Keys (Use These)

Project convention from `validationErrors.en.json` (6 modules use this pattern):

```typescript
// Required and basic types
t('validationError.required')           // "This field is required"
t('validationError.email')              // "Needs to be a valid email"
t('validationError.number')             // "This field needs to be a number"
t('validationError.phoneNumber')        // "Phone number needs to be at least 5 digits long"
t('validationError.wrongInputValue')    // "Wrong input value"

// Financial validation
t('validationError.amountExceedsBalance')           // "Amount exceeds available balance"
t('validationError.amountExceedsMaxAvailableLimit') // "Amount exceeds maximum available limit"
t('validationError.amountShouldBeGreater', { value }) // "Value should be greater than {{value}}"

// Asset-specific
t('validationError.invalidAddressForAsset', { asset }) // "Invalid address for {{asset}}"
```

## Dynamic Validation Messages

```typescript
const { t } = useTranslation();

// With interpolation
const amountValidation = (min: number, max: number, currency: string) =>
  number()
    .required(t('validationError.required'))
    .min(min, t('validationError.amount.min', { min, currency }))
    .max(max, t('validationError.amount.max', { max, currency }));

// Conditional messages
const passwordValidation = (minLength: number) =>
  string()
    .required(t('validationError.required'))
    .min(minLength, t('validationError.minLength', { min: minLength }));
```

## Translation File Locations

**Library-level (shared):** `libs/sygnum-shared/shared-bank-client/src/locales/validationErrors.en.json`
**Module-level:** `libs/modules/[module]/locales/validationErrors.en.json`

## Form Labels and Placeholders

Use `form.label.*`, `form.placeholder.*`, `form.button.*` namespaces:
```json
{
  "form.label.email": "Email Address",
  "form.placeholder.email": "Enter your email",
  "form.button.submit": "Submit"
}
```

## Real Codebase Examples

```typescript
// From PersonalInformation.validation.ts
email: string()
  .matches(emailRegex, t('validationError.email'))
  .required(t('validationError.required'))

// From address.util.ts (sutils)
baseValidator: string()
  .required(t('validationError.required'))
  .trim()
  .test('valid-address', {
    message: t('validationError.invalidAddressForAsset', { asset }),
    test: (value) => isValidAddress(value, asset)
  })
```

## Best Practices

- **Use hooks** for validation schemas (need `t()` access)
- **Reuse standard keys** from `validationError.*` namespace
- **Add new keys** to library-level or module-level `validationErrors.en.json`

## See Also

- `yoda-form-validation` - Yup schema patterns, custom tests, async validation
- `yoda-form-basics` - Form management and field components
