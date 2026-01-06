# Accessibility Patterns

Accessibility implementation patterns for Sygnum frontend. All rules are MANDATORY.

## ARIA Labels

**Icon buttons**:
```typescript
<Button aria-label={t('button.close')}>
  <CloseIcon />
</Button>
```

**Inputs without labels**:
```typescript
<Input aria-label={t('search.placeholder')} placeholder={t('search.placeholder')} />
```

## Keyboard Navigation

All interactive elements must support keyboard (Enter, Space):
```typescript
const handleKeyPress = useCallback((event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onClick();
  }
}, [onClick]);

return (
  <Box
    onClick={onClick}
    onKeyPress={handleKeyPress}
    tabIndex={0}
    role="button"
    aria-label={title}
  >
    <Typography>{title}</Typography>
  </Box>
);
```

## Screen Reader Support

**Visually hidden text**:
```typescript
<Box component="span" sx={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
  {t('screen.reader.text')}
</Box>
```

**Live regions** for dynamic content:
```typescript
<Box role="status" aria-live="polite" aria-atomic="true">
  {isLoading ? t('common.loading') : t('items.count', { count })}
</Box>
```

## Form Accessibility

**Proper label associations**:
```typescript
<label htmlFor="email-input">
  <Typography>{t('form.label.email')}</Typography>
</label>
<Input
  id="email-input"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? 'email-error' : undefined}
/>
{hasError && (
  <Typography id="email-error" role="alert">{errorMessage}</Typography>
)}
```
