# React Router Permissions

<!--
Migrated from: temp-FE-Mono/technical/react-router/react-router-permissions.md
Migration date: 2025-12-08
Original category: technical/react-router
New category: patterns/frontend/react-router
Source repo: temp-FE-Mono
-->

# React Router Permissions

Permission checking in loaders for route-based access control.

## Simple Permission Check

```typescript
import type { LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';

export async function tradingLoader({ request }: LoaderFunctionArgs) {
  const rootData = await rootLoader({ request });

  if (!rootData.permissions.canWriteTrading) {
    throw redirect('/error/401');
  }

  const tradingData = await fetchTradingData();
  return { ...rootData, tradingData };
}
```

## Root Loader with Permissions

```typescript
const PUBLIC_ROUTES = ['/login', '/privacy', '/terms'];

export async function rootLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  if (PUBLIC_ROUTES.includes(url.pathname)) {
    return { user: null, permissions: {}, authenticated: false };
  }

  const { credentials } = authState;
  if (!credentials?.accessToken) {
    throw redirect('/login');
  }

  const clientData = await getClientData(credentials.accessToken);

  return {
    user: { id: clientData.id, email: clientData.email },
    permissions: {
      canReadPortfolio: clientData.canReadPortfolio,
      canWriteTrading: clientData.canWriteTrading,
    },
    authenticated: true,
  };
}
```

## Permission Helper (Only if repeated 3+ times)

```typescript
export function requirePermission(permissions: AuthPermissions, permission: keyof AuthPermissions) {
  if (!permissions[permission]) {
    throw redirect('/error/401');
  }
}

// Usage
export async function tradingLoader({ request }: LoaderFunctionArgs) {
  const rootData = await rootLoader({ request });
  requirePermission(rootData.permissions, 'canWriteTrading');

  const tradingData = await fetchTradingData();
  return { ...rootData, tradingData };
}
```

## ❌ Anti-Patterns

- ❌ Over-engineered permission checking factories
- ❌ Complex permission result types
- ❌ Creating helpers before pattern repeats 3+ times

**References**: `react-router-loaders`, `react-router-error-handling`
