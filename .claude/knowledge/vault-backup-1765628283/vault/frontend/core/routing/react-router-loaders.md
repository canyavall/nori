# React Router Loaders

<!--
Migrated from: temp-FE-Mono/technical/react-router/react-router-loaders.md
Migration date: 2025-12-08
Original category: technical/react-router
New category: patterns/frontend/react-router
Source repo: temp-FE-Mono
-->

# React Router Loaders

Loaders fetch data before route components render.

## When to Use Loaders

**Use loaders when:**

- Need data before rendering (prevent loading flash)
- Centralized error handling needed
- Auth checks before page access

**Don't use loaders when:**

- Component handles loading well already
- Need real-time updates (use React Query)
- Conditional data fetching based on user interaction

## Simple Loader Example

```typescript
import type { LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';

export async function portfolioLoader({ request }: LoaderFunctionArgs) {
  const token = getAuthToken();
  if (!token) throw redirect('/login');

  const data = await fetchPortfolioData(token);

  // ✅ v7: Return raw objects (no json() wrapper)
  return { balance: data.balance, assets: data.assets };
}
```

## Using Loader Data in Components

```typescript
import { useLoaderData } from 'react-router';

export function Portfolio() {
  const { balance, assets } = useLoaderData() as { balance: number; assets: Asset[] };

  return (
    <Box>
      <Typography>Balance: {balance}</Typography>
      {assets.map(asset => <AssetCard key={asset.id} asset={asset} />)}
    </Box>
  );
}
```

## Typed Loader (Optional)

Only add types when multiple loaders share types or component needs intellisense:

```typescript
interface PortfolioData {
  balance: number;
  assets: Asset[];
}

export async function portfolioLoader({ request }: LoaderFunctionArgs): Promise<PortfolioData> {
  const data = await fetchPortfolioData();
  return { balance: data.balance, assets: data.assets };
}
```

## React Query Integration

Loader seeds cache, component uses query hook normally:

```typescript
export async function portfolioLoader({ request }: LoaderFunctionArgs) {
  const data = await fetchPortfolioData();
  queryClient.setQueryData(['portfolio'], data);
  return { data };
}
```

## ❌ Anti-Patterns

- ❌ Generic type wrappers for every loader
- ❌ Complex type hierarchies (`RouteLoaderData<TData>`)
- ❌ Adding metadata fields not used (loadedAt, version, etc.)

**References**: `react-router-v7-basics`, `react-router-error-handling`, `react-router-permissions`
