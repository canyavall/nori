# Sygnum Access Basics

<!--
Migrated from: temp-FE-Mono/technical/sygnum-access/sygnum-access-basics.md
Migration date: 2025-12-08
Original category: technical/sygnum-access
New category: patterns/sygnum/sygnum-access
Source repo: temp-FE-Mono
-->

# Sygnum Access - Basics

Permission and access control with RBAC authorization.

## Core Concepts

- **Permissions**: String-based permissions (e.g., 'users:read', 'transactions:write')
- **Roles**: Groups of permissions
- **Namespaces**: Scope permissions to specific contexts
- **RBAC**: Role-based access control

## Primary Hooks

```typescript
import { usePermissions } from '@sygnum/sygnum-access/hooks';

const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();

// Check single permission
const canEdit = hasPermission('users:edit');

// Check multiple permissions (all required)
const canManageUsers = hasAllPermissions(['users:read', 'users:edit']);

// Check multiple permissions (any required)
const canView = hasAnyPermission(['users:read', 'users:view']);
```

## Permission Checking

```typescript
import { hasPermission } from '@sygnum/sygnum-access/utils';

if (hasPermission(user, 'transactions:write')) {
  // User can create/edit transactions
}
```

## Conditional Rendering

```typescript
import { PermissionGuard } from '@sygnum/sygnum-access/components';

<PermissionGuard permission="users:edit">
  <EditButton />
</PermissionGuard>

<PermissionGuard
  permissions={['transactions:read', 'accounts:read']}
  requireAll
>
  <TransactionsDashboard />
</PermissionGuard>
```
