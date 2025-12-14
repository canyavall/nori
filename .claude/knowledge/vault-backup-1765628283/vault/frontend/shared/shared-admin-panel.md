# Shared Admin Panel

<!--
Migrated from: temp-FE-Mono/technical/shared-admin-panel/shared-admin-panel.md
Migration date: 2025-12-08
Original category: technical/shared-admin-panel
New category: patterns/shared/shared-admin-panel
Source repo: temp-FE-Mono
-->

# Shared Admin Panel

Utilities and components for admin panel applications.

## Layout State Management

```typescript
import { layoutState } from '@sygnum/shared-admin-panel/store/layout/layout.state';
import { useLayoutState } from '@sygnum/shared-admin-panel/store/layout/useLayoutState.hook';
import { useLayoutLoading } from '@sygnum/shared-admin-panel/store/layout/useLayoutLoading.hook';
import { useLayoutError } from '@sygnum/shared-admin-panel/store/layout/useLayoutError.hook';

// Access layout state
const { layoutProps } = useLayoutState();

// Manage loading state
const { setLayoutLoading, clearLayoutLoading } = useLayoutLoading();
setLayoutLoading(true);

// Manage error state
const { setLayoutError, clearLayoutError } = useLayoutError();
setLayoutError('Error message');
```

## ContentArea Component

```typescript
import { ContentArea } from '@sygnum/shared-admin-panel/components/ContentArea';

// Basic usage
<ContentArea title="Dashboard">
  <YourContent />
</ContentArea>

// With actions
<ContentArea
  title="User Management"
  actions={<Button>Add User</Button>}
>
  <UserList />
</ContentArea>
```

## ErrorPage Component

```typescript
import { ErrorPage } from '@sygnum/shared-admin-panel/pages/ErrorPage';

// 404 page
<ErrorPage type="notFound" />

// Generic error
<ErrorPage type="error" message="Something went wrong" />
```

## Role-Based Access

```typescript
import { AdminRoles } from '@sygnum/shared-admin-panel/basics/enums/roles.enum';

const isAdmin = user.role === AdminRoles.ADMIN;
const isSuperAdmin = user.role === AdminRoles.SUPER_ADMIN;
```

## Best Practices

- Use `layoutState` for global layout configuration
- Leverage `ContentArea` for consistent page layouts
- Implement role checks before rendering admin features
- Use provided hooks for loading and error states
