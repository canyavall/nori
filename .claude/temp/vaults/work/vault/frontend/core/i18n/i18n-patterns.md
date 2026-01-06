# i18n Patterns

Common i18n component patterns for Sygnum frontend.

**Note:** For "parent translates" pattern (reusable components), see `i18n-basics`.

## Lists & Options

Translate dropdown options and select lists:

```typescript
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t } = useTranslation();

  const statusOptions = [
    { value: 'pending', label: t('status.pending') },
    { value: 'approved', label: t('status.approved') },
    { value: 'rejected', label: t('status.rejected') },
  ];

  return <Select options={statusOptions} />;
};
```

## Map with Interpolation

Translate dynamic lists with variable data:

```typescript
const { t } = useTranslation();

{items.map(item => (
  <Box key={item.id}>
    <Typography>{t('item.name')}</Typography>
    <Typography>{t('item.description', { name: item.name })}</Typography>
    <Typography>{t('item.price', { amount: item.price, currency: 'CHF' })}</Typography>
  </Box>
))}
```

## Conditional Translations

Use different translations based on state:

```typescript
const { t } = useTranslation();

// Conditional text
<Typography>
  {hasItems ? t('cart.hasItems', { count: itemCount }) : t('cart.empty')}
</Typography>

// Conditional button labels
<Button aria-label={isActive ? t('button.deactivate') : t('button.activate')}>
  {isActive ? t('button.deactivate') : t('button.activate')}
</Button>

// Status-based translations
<Chip label={t(`order.status.${orderStatus}`)} />
```

## Dynamic Key Construction

Build translation keys from variables:

```typescript
const { t } = useTranslation();

// Status-based keys
const statusMessage = t(`transaction.status.${transaction.status}`);

// Type-based keys
const typeLabel = t(`asset.type.${assetType}.label`);

// Error messages
const errorText = t(`error.${errorCode}`, {
  defaultValue: t('error.generic'),
});
```

## Best Practices

- ✅ **Complete phrases** - Don't concatenate translations
- ✅ **Hierarchical keys** - Use descriptive, namespaced keys
- ✅ **Interpolation** - Pass dynamic values via `{{ }}` syntax
- ✅ **Fallbacks** - Provide `defaultValue` for dynamic keys
- ✅ **Consistency** - Use same pattern across similar features

## Common Anti-Patterns

```typescript
// ❌ Bad - Concatenating translations
t('label.prefix') + ' ' + t('label.suffix')

// ✅ Good - Complete phrase with interpolation
t('label.complete', { prefix, suffix })

// ❌ Bad - Generic keys
t('title')
t('submit')

// ✅ Good - Descriptive, hierarchical
t('crypto.withdrawal.title')
t('crypto.withdrawal.button.submit')
```

## See Also

- `i18n-basics` - Basic patterns, parent translates rule
- `i18n-forms-validation` - Validation message patterns
- `i18n-keys-and-files` - Key naming conventions
