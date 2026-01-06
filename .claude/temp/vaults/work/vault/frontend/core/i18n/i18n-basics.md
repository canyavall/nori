# i18n Basics

Core internationalization patterns using react-i18next. All user-facing text must be translatable.

## MANDATORY Rules

- **Never hardcode user-facing strings** - All text shown to users MUST be translatable
- **Parent translates** - Parent components translate before passing to children (never translate inside reusable components)
- **Always use `useTranslation` hook** in components
- **Use `i18next.t()` directly** in non-component contexts (utils, validators, configs)

See `i18n-keys-and-files` for key naming conventions and file patterns.
See `i18n-patterns` for advanced component patterns.

## useTranslation Hook

```typescript
import { useTranslation } from 'react-i18next';

export const UserGreeting: FC = () => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography>{t('greeting.title')}</Typography>
      <Button>{t('greeting.button.getStarted')}</Button>
    </Box>
  );
};
```

## Non-Component Contexts

Use `i18next.t()` directly in utility functions:

```typescript
import i18next from 'i18next';

export const getErrorMessage = (errorCode: string): string => {
  return i18next.t(`error.${errorCode}`, {
    defaultValue: i18next.t('error.generic'),
  });
};
```

## Parent Translates Pattern

```typescript
// ✅ Correct - Reusable component accepts translated string
export const StatusBadge: FC<{ label: string }> = ({ label }) => {
  return <Chip label={label} />;
};

// Parent translates before passing
export const OrderStatus: FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation();
  return <StatusBadge label={t(`order.status.${status}`)} />;
};

// ❌ Wrong - Don't translate inside reusable component
export const WrongBadge: FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation(); // Wrong - reusable components shouldn't translate
  return <Chip label={t(`order.status.${status}`)} />;
};
```

## Testing with Translations

```typescript
import { renderComponent } from '@sygnum/sygnum-testing';
import { screen } from '@testing-library/react';

it('should display translated text', async () => {
  renderComponent(<UserGreeting />);
  expect(await screen.findByText(/welcome/i)).toBeVisible();
});
```

## Number/Currency Formatting

For number and currency formatting with i18n, see `sutils-number-formatting` package.
Use `roundNumber` from `@sygnum/sutils` instead of Intl.NumberFormat.
