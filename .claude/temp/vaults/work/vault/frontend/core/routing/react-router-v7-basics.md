# React Router V7 Basics

<!--
Migrated from: temp-FE-Mono/technical/react-router/react-router-v7-basics.md
Migration date: 2025-12-08
Original category: technical/react-router
New category: patterns/frontend/react-router
Source repo: temp-FE-Mono
-->

# React Router v7 Basics

**Default to simplicity** - only add complexity when clearly needed.

## Version Notice

**React Router v7** key changes from v6:

- Single `react-router` package (no more `react-router-dom`)
- DOM-specific imports from `react-router/dom` (e.g., `RouterProvider`)
- Return raw objects from loaders (no `json()` wrapper)
- Uppercase HTTP methods (`'POST'`, `'GET'`)
- Partial hydration with `HydrateFallback`

## Core Principle

**Simple is better than complex.** Start with basic patterns. Add features only when requirements demand them.

## Data Router Pattern

```typescript
import { createBrowserRouter, RouterProvider } from 'react-router';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: 'portfolio', element: <Portfolio />, loader: portfolioLoader },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}
```

## Declarative Routes Pattern

```typescript
import { BrowserRouter, Routes, Route } from 'react-router';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route path="portfolio" element={<Portfolio />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

## Route Constants

```typescript
export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  PORTFOLIO: '/portfolio',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
```

No need for `RouteKey`, `RouteConstant<K>`, or complex generics unless requirements demand them.

## ❌ v7 Anti-Patterns

- ❌ Import from `react-router-dom` (use `react-router`)
- ❌ Import `RouterProvider` from `react-router` (use `react-router/dom`)
- ❌ Wrap loader returns with `json()` (return raw objects)
- ❌ Compare `formMethod` to lowercase (use `'POST'`, `'GET'`)

## ✅ v7 Best Practices

- ✅ Import from `react-router` for most APIs
- ✅ Import `RouterProvider` from `react-router/dom`
- ✅ Return raw objects: `return { data }`
- ✅ Uppercase methods: `formMethod === 'POST'`

**References**: React Router v7 docs, `react-router-loaders`, `react-router-navigation`
