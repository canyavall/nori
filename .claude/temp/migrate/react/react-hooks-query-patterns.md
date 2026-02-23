---
tags:
  - react-hooks
  - react-query
  - hook
  - sideHook
  - ts
  - tsx
description: React Query patterns in hooks - conditional execution, multi-query coordination, derived state, mutations, and optimization.
required_knowledge:
  - react-project-conventions
rules:
  - "**/*{.hook,.sideHook}.{ts,tsx}"
---

# React Hooks Query Patterns

Patterns for managing React Query in custom hooks. For Sygnum-specific query wrappers, see `sygnum-query-setup`.

## Conditional Query Execution

```typescript
// Enable based on permission
const { data } = useQuery(['permissions', userId], () => fetchPermissions(userId), {
  enabled: hasPermission('view_permissions') && !!userId,
  staleTime: 5 * 60 * 1000,
});

// Enable based on previous query
const { data: customer } = useQuery(['customer', id], () => fetchCustomer(id));
const { data: accounts } = useQuery(['accounts', customer?.id], () => fetchAccounts(customer.id), {
  enabled: !!customer?.id,
});
```

## Multi-Query Coordination

```typescript
// Sequential: each depends on previous
const { data: order } = useQuery(['order', orderId], () => fetchOrder(orderId));
const { data: customer } = useQuery(['customer', order?.customerId], () => fetchCustomer(order.customerId), { enabled: !!order?.customerId });

// Parallel: all run simultaneously
const accountsQ = useQuery(['accounts', userId], () => fetchAccounts(userId));
const txQ = useQuery(['transactions', userId], () => fetchTransactions(userId));
const isLoading = accountsQ.isLoading || txQ.isLoading;
```

## Derived State from Queries

```typescript
const { data: transactions } = useQuery(['transactions', accountId], () => fetchTransactions(accountId));
const summary = useMemo(() => {
  if (!transactions) return null;
  return { total: transactions.reduce((s, t) => s + t.amount, 0), count: transactions.length };
}, [transactions]);
```

## Query Optimization

```typescript
// Polling (live prices)
useQuery(['price', assetId], () => fetchPrice(assetId), {
  refetchInterval: 30000,
  staleTime: 0,
});

// Conditional polling (stop when done)
useQuery(['document', docId], () => fetchDocument(docId), {
  refetchInterval: isPolling ? 5000 : false,
  onSuccess: (doc) => { if (doc.status === 'completed') setIsPolling(false); },
});

// Rare changes (reference data)
useQuery(['reference', type], () => fetchReferenceData(type), {
  staleTime: 60 * 60 * 1000,    // 1 hour
  cacheTime: 24 * 60 * 60 * 1000, // 24 hours
});
```

## Mutations & Optimistic Updates

```typescript
const queryClient = useQueryClient();
return useMutation((data: UpdateDto) => updateAccount(data), {
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['account', newData.id]);
    const previous = queryClient.getQueryData(['account', newData.id]);
    queryClient.setQueryData(['account', newData.id], newData);
    return { previous };
  },
  onError: (err, newData, context) => queryClient.setQueryData(['account', newData.id], context.previous),
  onSettled: (data, error, vars) => queryClient.invalidateQueries(['account', vars.id]),
});
```

## Error Handling & Infinite Queries

**Retry**: `retry: 3, retryDelay: (i) => Math.min(1000 * 2 ** i, 30000)`

**Infinite**: `useInfiniteQuery` + flatten pages with `useMemo`:
```typescript
const all = useMemo(() => data?.pages.flatMap(p => p.transactions) ?? [], [data]);
```

## Quick Reference

| Pattern | Key Config |
|---------|------------|
| Conditional query | `enabled` |
| Sequential deps | `enabled` on dependent |
| Parallel queries | Multiple `useQuery` |
| Polling | `refetchInterval` |
| Rare changes | `staleTime: 1h+` |
| Optimistic update | `onMutate` + rollback |
| Pagination | `useInfiniteQuery` |

**Don't**: fetch in useEffect, forget staleTime for reference data.
