# MSW Advanced Patterns

Advanced Mock Service Worker patterns for complex API testing scenarios.

## Dynamic Responses

**Using request params**:
```typescript
mswServer.use(
  mswGetFunc({
    path: '/api/users/:id',
    status: 200,
    mock: ({ params }) => ({ id: params.id, name: 'John' }),
  })
);
```

**Using request body**:
```typescript
mswServer.use(
  mswPostFunc({
    path: '/api/users',
    status: 201,
    mock: ({ body }) => ({ ...body, id: 'generated-id' }),
  })
);
```

## Conditional Responses

```typescript
mswServer.use(
  mswGetFunc({
    path: '/api/users/:id',
    status: 200,
    mock: ({ params }) => {
      if (params.id === 'invalid') {
        return { status: 404, mock: { error: 'Not found' } };
      }
      return { id: params.id, name: 'John' };
    },
  })
);
```

## Simulating Network Delays

```typescript
mswServer.use(
  mswGetFunc({
    path: '/api/slow',
    status: 200,
    mock: { data: 'test' },
    delayTime: 2000,  // 2 second delay
  })
);
```

**Note**: Don't use delays with fake timers - they don't advance MSW delays.

## Sequence of Responses

Test retry logic or state changes:
```typescript
let callCount = 0;

mswServer.use(
  mswGetFunc({
    path: '/api/data',
    status: 200,
    mock: () => {
      callCount++;
      if (callCount === 1) return { status: 500, mock: { error: 'Fail' } };
      return { status: 200, mock: { data: 'success' } };
    },
  })
);
```

## Testing Mutations & Multiple Endpoints

Mock POST/PUT/PATCH with dynamic responses. Chain multiple `mswServer.use()` calls for multiple endpoints.

## Error Scenarios

**Network error**: `status: 0`
**Timeout**: Long delay + test timeout
**Rate limiting**: `status: 429`

## Related Knowledge

- `testing-msw-setup` - Basic MSW patterns
