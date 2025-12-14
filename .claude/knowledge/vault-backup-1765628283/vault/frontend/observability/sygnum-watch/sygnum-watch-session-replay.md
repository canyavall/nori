# Sygnum Watch Session Replay

<!--
Migrated from: temp-FE-Mono/technical/sygnum-watch/sygnum-watch-session-replay.md
Migration date: 2025-12-08
Original category: technical/sygnum-watch
New category: patterns/sygnum/sygnum-watch
Source repo: temp-FE-Mono
-->

# Sygnum Watch - Session Replay

Session replay and performance monitoring.

## Session Replay Setup

```typescript
const config = buildSentryConfig({
  dsn: process.env.VITE_SENTRY_DSN,
  replaysSessionSampleRate: 0.1,  // 10% of sessions
  replaysOnErrorSampleRate: 1.0,  // 100% of error sessions
});

initializeSentry(config);
```

## Privacy Masking

Session replay automatically masks:
- All text inputs (by default)
- Sensitive elements marked with class `.sentry-mask`
- Credit card fields
- Password fields

```typescript
// Manually mask elements
<div className="sentry-mask">
  Sensitive content
</div>

// Block entire sections
<div className="sentry-block">
  This won't be recorded
</div>
```

## Performance Monitoring

```typescript
import { startTransaction, measurePerformance } from '@sygnum/sygnum-watch';

// Manual transaction
const transaction = startTransaction({
  name: 'Load Dashboard',
  op: 'pageload',
});

// Measure operation
await measurePerformance('fetchUserData', async () => {
  await fetchUserData();
});

transaction.finish();
```

## Custom Instrumentation

```typescript
import { addBreadcrumb } from '@sygnum/sygnum-watch';

// Track user actions
addBreadcrumb({
  category: 'user-action',
  message: 'User clicked export button',
  level: 'info',
  data: { feature: 'transactions' },
});
```
