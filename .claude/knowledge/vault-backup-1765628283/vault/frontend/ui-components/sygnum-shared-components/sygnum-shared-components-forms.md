# Sygnum Shared Components Forms

<!--
Migrated from: temp-FE-Mono/technical/sygnum-shared-components/sygnum-shared-components-forms.md
Migration date: 2025-12-08
Original category: technical/sygnum-shared-components
New category: patterns/sygnum/sygnum-shared-components
Source repo: temp-FE-Mono
-->

# Sygnum Shared Components - Forms

Form-related shared components.

## SearchBar

Global search component.

```typescript
import { SearchBar } from '@sygnum/sygnum-shared-components/components/SearchBar';

<SearchBar
  placeholder={t('search.placeholder')}
  onSearch={handleSearch}
  debounceTime={300}
  suggestions={suggestions}
/>
```

## CountrySelect

Country selection dropdown with flags.

```typescript
import { CountrySelect } from '@sygnum/sygnum-shared-components/components/CountrySelect';

<CountrySelect
  value={selectedCountry}
  onChange={handleCountryChange}
  excludeCountries={['US', 'CA']}
  showFlags
/>
```

## FormWizard

Multi-step form wizard container.

```typescript
import { FormWizard } from '@sygnum/sygnum-shared-components/components/FormWizard';

<FormWizard
  steps={formSteps}
  onComplete={handleComplete}
  onCancel={handleCancel}
  validateStep={validateCurrentStep}
/>
```

## FileUploadZone

Drag-and-drop file upload area.

```typescript
import { FileUploadZone } from '@sygnum/sygnum-shared-components/components/FileUploadZone';

<FileUploadZone
  accept=".pdf,.jpg,.png"
  maxFiles={5}
  maxSize={10485760}  // 10MB
  onFilesSelected={handleFiles}
  multiple
/>
```
