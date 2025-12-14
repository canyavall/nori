# Sygnum Access Rbac

<!--
Migrated from: temp-FE-Mono/technical/sygnum-access/sygnum-access-rbac.md
Migration date: 2025-12-08
Original category: technical/sygnum-access
New category: patterns/sygnum/sygnum-access
Source repo: temp-FE-Mono
-->

# Sygnum Access - RBAC

Role-based access control patterns.

## Role Management

```typescript
import { useRoles } from '@sygnum/sygnum-access/hooks';

const { roles, hasRole, isAdmin } = useRoles();

// Check if user has specific role
if (hasRole('ADMIN')) {
  // Show admin features
}

// Check if user is admin
if (isAdmin) {
  // Show admin panel
}
```

## Role-based Rendering

```typescript
import { RoleGuard } from '@sygnum/sygnum-access/components';

<RoleGuard roles={['ADMIN', 'MANAGER']}>
  <AdminPanel />
</RoleGuard>

<RoleGuard role="VIEWER" fallback={<AccessDenied />}>
  <ViewerDashboard />
</RoleGuard>
```

## Permission Sets

```typescript
// Define permission sets for roles
const ROLE_PERMISSIONS = {
  ADMIN: ['*'],  // All permissions
  MANAGER: [
    'users:read',
    'users:edit',
    'transactions:read',
  ],
  VIEWER: [
    'users:read',
    'transactions:read',
  ],
};
```

## Role Hierarchy

```typescript
const ROLE_HIERARCHY = {
  ADMIN: ['MANAGER', 'VIEWER'],
  MANAGER: ['VIEWER'],
  VIEWER: [],
};

// Admin inherits all MANAGER and VIEWER permissions
```
