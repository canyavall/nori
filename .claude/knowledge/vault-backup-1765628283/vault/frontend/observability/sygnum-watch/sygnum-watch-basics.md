# Sygnum Watch Basics

<!--
Migrated from: temp-FE-Mono/technical/sygnum-watch/sygnum-watch-basics.md
Migration date: 2025-12-08
Original category: technical/sygnum-watch
New category: patterns/sygnum/sygnum-watch
Source repo: temp-FE-Mono
-->

# Sygnum Watch - Basics

Sentry monitoring and error tracking library.

## ⚠️ Module Boundaries (CRITICAL)

**ONLY `@sygnum/watch` can import `@sentry/react`** (Nx enforced).

```typescript
// ❌ FORBIDDEN
import * as Sentry from '@sentry/react';

// ✅ CORRECT
import { buildSentryConfig, init } from '@sygnum/watch/basics/utils/sentry.util';
import { onUncaughtError } from '@sygnum/watch/basics/utils/reactErrorHandlers.util';
import { SentryErrorBoundary } from '@sygnum/watch/components/SentryErrorBoundary';
import { SentryRoutes } from '@sygnum/watch/routes/SentryRoutes.route';
```


## 6-Step Setup

```typescript
import { initializeSentry, buildSentryConfig } from '@sygnum/sygnum-watch';

// 1. Build config
const config = buildSentryConfig({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.VITE_ENV,
  release: process.env.VITE_RELEASE,
  module: 'portal-app',
});

// 2. Initialize
initializeSentry(config);

// 3. Wrap app with ErrorBoundary
import { ErrorBoundary } from '@sygnum/sygnum-watch/components';

<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

## Core APIs

```typescript
import {
  captureException,
  captureMessage,
  setUser,
  setContext,
  addBreadcrumb,
} from '@sygnum/sygnum-watch';

// Capture errors
try {
  riskyOperation();
} catch (error) {
  captureException(error, {
    level: 'error',
    tags: { feature: 'transactions' },
  });
}

// Log messages
captureMessage('User completed onboarding', 'info');

// Set user context
setUser({ id: userId, email: userEmail });

// Add custom context
setContext('transaction', {
  id: transactionId,
  amount: amount,
});

// Track breadcrumbs
addBreadcrumb({
  message: 'User clicked button',
  category: 'ui',
  level: 'info',
});
```
