# Sygnum Query Caching

<!--
Migrated from: temp-FE-Mono/technical/sygnum-query/sygnum-query-caching.md
Migration date: 2025-12-08
Original category: technical/sygnum-query
New category: patterns/sygnum/sygnum-query
Source repo: temp-FE-Mono
-->

# Sygnum Query - Caching

Cache management and optimization strategies.

## Cache Invalidation

```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Invalidate specific query
queryClient.invalidateQueries({
  queryKey: [...moduleQueryKey, 'resource'],
});

// Invalidate all queries in module
queryClient.invalidateQueries({
  queryKey: moduleQueryKey,
});
```

## Manual Cache Updates

```typescript
// Set query data
queryClient.setQueryData(queryKey, newData);

// Update query data
queryClient.setQueryData(queryKey, (old) => ({
  ...old,
  ...updates,
}));
```

## Prefetching

```typescript
// Prefetch data
await queryClient.prefetchQuery({
  queryKey: [...queryKey, id],
  queryFn: () => API.getResource(id),
});
```

## Cache Time Configuration

```typescript
useSygnumQuery({
  queryKey,
  api: API.getResource(),
  staleTime: 5 * 60 * 1000,    // 5 minutes
  gcTime: 10 * 60 * 1000,      // 10 minutes
  refetchOnWindowFocus: false,
});
```
