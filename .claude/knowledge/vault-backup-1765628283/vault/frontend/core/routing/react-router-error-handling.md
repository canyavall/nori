# React Router Error Handling

<!--
Migrated from: temp-FE-Mono/technical/react-router/react-router-error-handling.md
Migration date: 2025-12-08
Original category: technical/react-router
New category: patterns/frontend/react-router
Source repo: temp-FE-Mono
-->

# React Router Error Handling

Handle errors from loaders, actions, and route components.

## Loader Error Pattern

```typescript
import { redirect } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';

export async function portfolioLoader({ request }: LoaderFunctionArgs) {
  const token = getAuthToken();

  if (!token) {
    throw redirect('/login');
  }

  try {
    const data = await fetchPortfolioData(token);
    return { data };
  } catch (error) {
    // Throw Response for proper error boundary handling
    throw new Response('Failed to load portfolio', { status: 500 });
  }
}
```

## Error Boundary Component

```typescript
import { useRouteError, isRouteErrorResponse } from 'react-router';

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return <NotFoundPage />;
    }
    if (error.status === 401) {
      return <UnauthorizedPage />;
    }
    if (error.status === 500) {
      return <ErrorPage message={error.statusText} />;
    }
  }

  return <ErrorPage message="An unexpected error occurred" />;
}
```

## Route Configuration with Error Boundary

```typescript
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: 'portfolio',
        element: <Portfolio />,
        loader: portfolioLoader,
        errorElement: <PortfolioError />, // Route-specific error
      },
    ],
  },
]);
```

## Type Guard for Error Responses

```typescript
function isRouteErrorResponse(error: unknown): error is { status: number; statusText: string } {
  return typeof error === 'object' && error !== null && 'status' in error && 'statusText' in error;
}
```

## ❌ Anti-Patterns

- ❌ Catching all errors silently
- ❌ Not using Response objects for errors
- ❌ Over-complicated error type hierarchies

**References**: `react-router-loaders`, `react-router-v7-basics`
