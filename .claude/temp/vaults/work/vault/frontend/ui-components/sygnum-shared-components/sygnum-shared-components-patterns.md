# Sygnum Shared Components Patterns

<!--
Migrated from: temp-FE-Mono/technical/sygnum-shared-components/sygnum-shared-components-patterns.md
Migration date: 2025-12-08
Original category: technical/sygnum-shared-components
New category: patterns/sygnum/sygnum-shared-components
Source repo: temp-FE-Mono
-->

# Sygnum Shared Components - Patterns

Common usage patterns and best practices.

## Layout Composition

```typescript
import {
  CommonLayout,
  PageHeader,
  ContentSection,
} from '@sygnum/sygnum-shared-components';

function DashboardPage() {
  return (
    <CommonLayout>
      <PageHeader
        title="Dashboard"
        breadcrumbs={breadcrumbs}
      />
      <ContentSection title="Overview">
        <DashboardContent />
      </ContentSection>
    </CommonLayout>
  );
}
```

## Form Wizard Pattern

```typescript
import { FormLayout, FormWizard } from '@sygnum/sygnum-shared-components';

function OnboardingWizard() {
  return (
    <FormLayout title="Account Setup">
      <FormWizard
        steps={steps}
        onComplete={handleComplete}
      />
    </FormLayout>
  );
}
```

## Search and Filter

```typescript
import { SearchBar, CountrySelect } from '@sygnum/sygnum-shared-components';

<div>
  <SearchBar onSearch={handleSearch} />
  <CountrySelect
    value={country}
    onChange={handleCountryFilter}
  />
  <TransactionList
    data={filteredData}
    isLoading={isLoading}
  />
</div>
```

## Error Handling

```typescript
import { ErrorPage, EmptyState } from '@sygnum/sygnum-shared-components';

if (isError) {
  return <ErrorPage code="500" title="Something went wrong" />;
}

if (!data?.length) {
  return <EmptyState title="No results" />;
}

return <ContentList data={data} />;
```

## Common Pitfalls

- **Not using layouts** - Always wrap pages in appropriate layouts
- **Hardcoded navigation** - Use shared navigation components
- **Custom headers** - Reuse PageHeader instead of creating custom ones
- **Inline empty states** - Use EmptyState component for consistency
- **Missing loading states** - Use LoadingSection for better UX
