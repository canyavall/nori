# Sygnum Access Namespace

<!--
Migrated from: temp-FE-Mono/technical/sygnum-access/sygnum-access-namespace.md
Migration date: 2025-12-08
Original category: technical/sygnum-access
New category: patterns/sygnum/sygnum-access
Source repo: temp-FE-Mono
-->

# Sygnum Access - Namespace

Namespace-based authorization for multi-tenant systems.

## Namespace Context

```typescript
import { NamespaceProvider, useNamespace } from '@sygnum/sygnum-access/namespace';

<NamespaceProvider namespace="client-123">
  <ClientDashboard />
</NamespaceProvider>

// Inside component
const { namespace, setNamespace } = useNamespace();
```

## Namespaced Permissions

```typescript
import { useNamespacedPermissions } from '@sygnum/sygnum-access/hooks';

const { hasPermission } = useNamespacedPermissions();

// Check permission within current namespace
const canEdit = hasPermission('users:edit'); // scoped to current namespace
```

## Namespace Guards

```typescript
import { NamespaceGuard } from '@sygnum/sygnum-access/components';

<NamespaceGuard
  namespace="client-123"
  permission="data:read"
  fallback={<AccessDenied />}
>
  <ClientData />
</NamespaceGuard>
```

## Multi-namespace Access

```typescript
import { hasNamespacePermission } from '@sygnum/sygnum-access/utils';

// Check permission across namespaces
const canAccessClientA = hasNamespacePermission(
  user,
  'client-a',
  'data:read'
);

const canAccessClientB = hasNamespacePermission(
  user,
  'client-b',
  'data:read'
);
```

## Namespace Switching

```typescript
const { setNamespace } = useNamespace();

// Switch to different client context
setNamespace('client-456');
```
