# Sygnum Shared Components Sections

<!--
Migrated from: temp-FE-Mono/technical/sygnum-shared-components/sygnum-shared-components-sections.md
Migration date: 2025-12-08
Original category: technical/sygnum-shared-components
New category: patterns/sygnum/sygnum-shared-components
Source repo: temp-FE-Mono
-->

# Sygnum Shared Components - Page Sections

Reusable page section components.

## PageHeader

Page header with title and actions.

```typescript
import { PageHeader } from '@sygnum/sygnum-shared-components/sections/PageHeader';

<PageHeader
  title="Transactions"
  subtitle="View and manage your transactions"
  breadcrumbs={breadcrumbs}
  actions={
    <>
      <Button>Export</Button>
      <Button variant="contained">New Transaction</Button>
    </>
  }
/>
```

## ContentSection

Generic content section with optional header.

```typescript
import { ContentSection } from '@sygnum/sygnum-shared-components/sections/ContentSection';

<ContentSection
  title="Account Details"
  subtitle="Manage your account information"
  actions={<Button>Edit</Button>}
>
  <AccountInfo />
</ContentSection>
```

## EmptyState

Empty state placeholder with action.

```typescript
import { EmptyState } from '@sygnum/sygnum-shared-components/sections/EmptyState';

<EmptyState
  icon={<EmptyIcon />}
  title="No transactions found"
  description="You haven't made any transactions yet"
  action={
    <Button onClick={handleCreate}>
      Create First Transaction
    </Button>
  }
/>
```

## ErrorPage

Error page component for 404/500 errors.

```typescript
import { ErrorPage } from '@sygnum/sygnum-shared-components/sections/ErrorPage';

<ErrorPage
  code="404"
  title="Page Not Found"
  message="The page you're looking for doesn't exist"
  action={<Button onClick={() => navigate('/')}>Go Home</Button>}
/>
```

## LoadingSection

Loading state for page sections.

```typescript
import { LoadingSection } from '@sygnum/sygnum-shared-components/sections/LoadingSection';

{isLoading ? (
  <LoadingSection message="Loading transactions..." />
) : (
  <TransactionList />
)}
```
