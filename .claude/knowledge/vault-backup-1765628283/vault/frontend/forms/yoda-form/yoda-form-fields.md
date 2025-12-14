# Yoda Form Fields

<!--
Migrated from: temp-FE-Mono/technical/yoda-form/yoda-form-fields.md
Migration date: 2025-12-08
Original category: technical/yoda-form
New category: patterns/frontend/yoda-form
Source repo: temp-FE-Mono
-->

# Yoda Form - Fields

27 form components for different input types.

## Text Fields

```typescript
// Basic text field
<YodaTextField
  name="email"
  validation={validation.email}
  required
/>

// Currency field
<YodaTextField
  name="amount"
  isCurrency
  minimumFractionDigits={2}
  maximumFractionDigits={8}
/>
```

## Selection Components

```typescript
// Select
<YodaSelect
  name="country"
  options={options}
  isSearchable
/>

// Autocomplete
<YodaAutocomplete
  name="wallet"
  options={options}
  getOptionLabel={opt => opt.displayName}
/>
```

## Date Components

```typescript
// Single date
<YodaDatePicker
  name="birthday"
  maxDate={maxDate}
  dateFormat="dd/MM/yyyy"
/>

// Date range
<YodaRangeDatePicker
  name="dateRange"
  maxRange={365}
/>
```

## Choice Components

```typescript
// Radio group
<YodaRadioGroup
  name="option"
  radioConfigs={[
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" }
  ]}
/>

// Checkbox group
<YodaCheckBoxGroup
  name="services"
  checkboxElements={options}
  columns={2}
/>
```

## File Upload

```typescript
<YodaFileUpload
  name="documents"
  accept=".pdf,.jpg,.png"
  maxFiles={3}
  maxSize={10485760}
  multiple
/>
```

## Layout Components

```typescript
<YodaSwapInputs
  leftInput={<YodaTextField name="from" />}
  rightInput={<YodaTextField name="to" />}
  onSwapButtonClick={handleSwap}
/>
```
