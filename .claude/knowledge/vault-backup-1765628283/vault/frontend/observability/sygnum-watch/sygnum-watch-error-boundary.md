# Sygnum Watch Error Boundary

<!--
Migrated from: temp-FE-Mono/technical/sygnum-watch/sygnum-watch-error-boundary.md
Migration date: 2025-12-08
Original category: technical/sygnum-watch
New category: patterns/sygnum/sygnum-watch
Source repo: temp-FE-Mono
-->

# Sygnum Watch - Error Boundary

React error boundary integration.

## ErrorBoundary Component

```typescript
import { ErrorBoundary } from '@sygnum/sygnum-watch/components';

// App-level boundary
<ErrorBoundary
  fallback={<ErrorPage />}
  onError={(error, errorInfo) => {
    console.error('App error:', error);
  }}
>
  <App />
</ErrorBoundary>

// Feature-level boundary
<ErrorBoundary
  fallback={<FeatureErrorFallback />}
  resetKeys={[userId]}  // Reset on user change
>
  <FeatureComponent />
</ErrorBoundary>
```

## Custom Fallback

```typescript
const ErrorFallback = ({ error, resetError }) => (
  <div>
    <h1>Something went wrong</h1>
    <pre>{error.message}</pre>
    <Button onClick={resetError}>Try Again</Button>
  </div>
);

<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>
```

## Reset Conditions

```typescript
// Reset boundary when key changes
<ErrorBoundary resetKeys={[routeId, userId]}>
  <DynamicContent />
</ErrorBoundary>
```

## Error Reporting

Errors caught by ErrorBoundary are automatically sent to Sentry with:
- Component stack trace
- Error details
- User context
- Breadcrumbs
