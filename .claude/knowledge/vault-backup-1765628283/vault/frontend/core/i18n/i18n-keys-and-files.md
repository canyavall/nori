# i18n Keys and Files

Translation key naming conventions and file organization patterns.

## Key Naming Convention (MANDATORY)

**Use hierarchical dot notation:** `module.section.element.type`

```typescript
// ✅ Good - descriptive, hierarchical
'notification.action.approval.description'
'banking.transactions.table.column.date'
'yodaForm.uploadFile.errors.duplicate-filename'
'sharedBankClient.preferredCurrencySelector.alert'

// ❌ Bad - too generic
'total'
'submit'
'error'
```

**Structure varies by module** - namespace typically matches module name.

## Translation File Pattern

**Use `.en.json` files** (63 files across project):

```json
{
  "banking.title": "Banking",
  "banking.transactions.table.column.date": "Date",
  "banking.transactions.table.column.amount": "Amount",
  "banking.search.placeholder": "Search transactions...",
  "banking.validation.minAmount": "Minimum {{amount}} {{currency}}"
}
```

**File locations:**
- **Apps:** `apps/[app-name]/src/locales/[name].en.json`
- **Modules:** `libs/modules/[module]/src/locales/[name].en.json`
- **Libraries:** `libs/[library]/src/locales/[name].en.json`

## When to Use Which File

### Module-specific translations
**Location:** Module's own `.en.json` file
```
libs/modules/banking/admin-panel/src/locales/banking.en.json
```

### Shared/common translations
**Location:** `shared-bank-client` or `common.en.json`
```
libs/sygnum-shared/shared-bank-client/src/locales/common.en.json
```

### Validation error messages
**Location:** Dedicated `validationErrors.en.json`
```
libs/sygnum-shared/shared-bank-client/src/locales/validationErrors.en.json
libs/modules/[module]/src/locales/validationErrors.en.json
```

See `i18n-forms-validation` for validation key conventions.

## Real Project Examples

From actual codebase `.en.json` files:

```json
{
  "notification.action.approval.description": "Approve this request",
  "notification.action.approval.label": "Approve",
  "yodaForm.invalidFiles": "Invalid files",
  "yodaForm.uploadFile.errors.duplicate-filename": "File already exists",
  "sharedBankClient.preferredCurrencySelector.alert": "Currency changed"
}
```

## Common Translation Keys

Standard keys used across modules:

```json
{
  "common.button.submit": "Submit",
  "common.button.cancel": "Cancel",
  "common.message.loading": "Loading...",
  "common.message.noData": "No data available",
  "common.label.search": "Search",
  "common.label.filter": "Filter"
}
```

## Best Practices

- **Hierarchical naming:** `module.section.element.type`
- **Namespace by module:** Keys start with module name
- **One file per concern:** Separate `validationErrors.en.json` from main translations
- **Descriptive keys:** Avoid generic names like `title`, `submit`
- **Interpolation:** Use `{{variable}}` for dynamic values
- **Shared keys:** Put in `common.en.json` or `shared-bank-client`

## See Also

- `i18n-basics` - Basic i18n patterns and hooks
- `i18n-forms-validation` - Validation key conventions
- `i18n-patterns` - Advanced component patterns
