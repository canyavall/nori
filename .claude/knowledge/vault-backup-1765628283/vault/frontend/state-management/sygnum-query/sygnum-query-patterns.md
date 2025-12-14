# Sygnum Query Patterns

<!--
Migrated from: temp-FE-Mono/technical/sygnum-query/sygnum-query-patterns.md
Migration date: 2025-12-08
Original category: technical/sygnum-query
New category: patterns/sygnum/sygnum-query
Source repo: temp-FE-Mono
-->

# Sygnum Query - Patterns

Advanced patterns and best practices.

## API Architecture (MANDATORY)

```typescript
// api/resource/queries/getResource.ts
export const useGetResource = (id: string) => {
  return useSygnumQuery<ResourceDto>({
    queryKey: [...moduleQueryKey, 'resource', id],
    api: API_ENDPOINTS.getResource(id),
    enabled: !!id,
  });
};

// api/resource/mutations/createResource.ts
export const useCreateResource = () => {
  const queryClient = useQueryClient();

  return useSygnumMutation({
    mutationFn: (data: CreateResourceDto) =>
      API_ENDPOINTS.createResource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...moduleQueryKey, 'resource'],
      });
    },
  });
};
```

## Error Handling

```typescript
const { data, error, isError } = useSygnumQuery({
  queryKey,
  api: API.getResource(),
  onError: (error) => {
    console.error('Failed to fetch:', error);
    showErrorToast(error.message);
  },
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

## Performance Optimization

```typescript
// Use select to transform data
useSygnumQuery({
  queryKey,
  api: API.getResource(),
  select: (data) => data.items.map(transformItem),
});

// Disable unnecessary refetches
useSygnumQuery({
  queryKey,
  api: API.getResource(),
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
});
```

## Testing

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

renderHook(() => useGetResource('123'), { wrapper });
```
