# Sygnum Testing Msw

<!--
Migrated from: temp-FE-Mono/technical/sygnum-testing/sygnum-testing-msw.md
Migration date: 2025-12-08
Original category: technical/sygnum-testing
New category: patterns/sygnum/sygnum-testing
Source repo: temp-FE-Mono
-->

# Sygnum Testing - MSW

MSW (Mock Service Worker) setup and patterns.

## MSW Server Setup

```typescript
import { setupServer } from '@sygnum/sygnum-testing/msw';
import { http, HttpResponse } from 'msw';

const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([{ id: 1, name: 'John' }]);
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Mocking API Responses

```typescript
import { http, HttpResponse } from 'msw';

// Success response
http.get('/api/resource', () => {
  return HttpResponse.json({ data: mockData });
});

// Error response
http.get('/api/resource', () => {
  return HttpResponse.json({ error: 'Not found' }, { status: 404 });
});

// Delayed response
http.get('/api/resource', async () => {
  await delay(1000);
  return HttpResponse.json({ data: mockData });
});
```

## Runtime Handler Override

```typescript
it('handles error state', async () => {
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json({ error: 'Server error' }, { status: 500 });
    })
  );

  renderWithQuery(<UserList />);
  expect(await screen.findByText('Error')).toBeInTheDocument();
});
```
