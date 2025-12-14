# Sygnum Query Basics

<!--
Migrated from: temp-FE-Mono/technical/sygnum-query/sygnum-query-basics.md
Migration date: 2025-12-08
Original category: technical/sygnum-query
New category: patterns/sygnum/sygnum-query
Source repo: temp-FE-Mono
-->

# Sygnum Query - Basics

React Query wrapper for API state management.

## Setup

```typescript
import { SygnumQueryClientProvider } from '@sygnum/sygnum-query/providers/sygnumQuery.provider';
import { setAxiosService } from '@sygnum/sygnum-query/service/axios/axios.service';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 },
  },
});

setAxiosService(axios.create({
  baseURL: process.env.VITE_API_BASE_URL,
  timeout: 30000
}));

<SygnumQueryClientProvider client={queryClient}>
  {/* App */}
</SygnumQueryClientProvider>
```

## Query Patterns

```typescript
// Basic query
const { data, isLoading, error } = useSygnumQuery<ResponseType>({
  queryKey: [...moduleQueryKey, 'resource', id],
  api: API_ENDPOINTS.getResource(id),
  enabled: !!id,
});

// With transformer
useSygnumQuery<BalancesDto, BalancesDto>({
  queryKey: [...portalQueryKey, 'portfolioBalances', clientId],
  api: API.portfolioBalances(clientId),
  select: transformBalancesDto,
  onSuccess: (data) => console.log(data),
});
```

## Query Key Pattern (MANDATORY)

```typescript
// Module-level constants in index.type.ts
export const portalQueryKey = ['portal'];
export const cryptoQueryKey = ['crypto'];

// Hierarchical keys
[...portalQueryKey, 'portfolioBalances', clientId]
[...cryptoQueryKey, 'productDetails', productId, clientId]

// Helper functions
export const getRequestsQueryKey = (clientId: string) =>
  [...clientServiceQueryKey, 'requests', clientId];
```

## Mutation Patterns

```typescript
const { mutate, isLoading } = useSygnumMutation({
  mutationFn: (data) => API.createResource(data),
  onSuccess: () => queryClient.invalidateQueries([...queryKey]),
});
```
