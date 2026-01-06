# MSW Setup

Mock Service Worker (MSW) setup and basic mocking patterns for API testing.

## Setup

**Global setup** (jest.setup.ts):
```typescript
import { setupMswServer } from '@sygnum/sygnum-testing';

const mswServer = setupMswServer();

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());
```

**Note**: `setupMswServer()` automatically calls `resetHandlers()` in `afterEach`.

## Basic Mocking

```typescript
import { mswServer, mswGetFunc } from '@sygnum/sygnum-testing';

it('should load users', async () => {
  mswServer.use(
    mswGetFunc({
      path: '/api/users',
      status: 200,
      mock: [{ id: '1', name: 'John' }],
    })
  );

  renderWithQuery(<UserList />);
  expect(await screen.findByText('John')).toBeVisible();
});
```

## Helper Functions

**GET**: `mswGetFunc({ path, status, mock })`
**POST**: `mswPostFunc({ path, status, mock })`
**PUT**: `mswPutFunc({ path, status, mock })`
**DELETE**: `mswDeleteFunc({ path, status, mock })`
**PATCH**: `mswPatchFunc({ path, status, mock })`

## Error Responses

```typescript
mswServer.use(
  mswGetFunc({
    path: '/api/users',
    status: 500,
    mock: { error: 'Internal server error' },
  })
);

renderWithQuery(<UserList />);
expect(await screen.findByText('Error loading users')).toBeVisible();
```

## Path Patterns

**Exact**: `path: '/api/users'`
**With params**: `path: '/api/users/:id'`
**Query params**: Automatic - MSW matches regardless of query string

## Per-Test Overrides

```typescript
beforeEach(() => {
  mswServer.use(
    mswGetFunc({ path: '/api/users', status: 200, mock: [] })
  );
});

it('should handle empty list', async () => {
  // Uses default from beforeEach
  renderWithQuery(<UserList />);
  expect(await screen.findByText('No users')).toBeVisible();
});

it('should display users', async () => {
  // Override for this test
  mswServer.use(
    mswGetFunc({ path: '/api/users', status: 200, mock: [{ name: 'John' }] })
  );

  renderWithQuery(<UserList />);
  expect(await screen.findByText('John')).toBeVisible();
});
```

## Common Patterns

**Loading**: Wait for progress indicator removal
**Errors**: Mock error response, verify error UI
**Multiple endpoints**: Chain `mswServer.use()` calls

## Related Knowledge

- `testing-msw-advanced` - Advanced MSW patterns
