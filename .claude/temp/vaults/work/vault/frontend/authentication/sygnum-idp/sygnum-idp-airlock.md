# Sygnum Idp Airlock

<!--
Migrated from: temp-FE-Mono/technical/sygnum-idp/sygnum-idp-airlock.md
Migration date: 2025-12-08
Original category: technical/sygnum-idp
New category: patterns/sygnum/sygnum-idp
Source repo: temp-FE-Mono
-->

# Sygnum IDP - Airlock

Airlock integration for bank-client.

## Setup

```typescript
import { AirlockProvider } from '@sygnum/sygnum-idp-airlock/providers';

<AirlockProvider
  baseUrl={process.env.VITE_AIRLOCK_BASE_URL}
  config={airlockConfig}
>
  <App />
</AirlockProvider>
```

## Hooks

```typescript
import { useAirlock } from '@sygnum/sygnum-idp-airlock/hooks';

const {
  isAuthenticated,
  user,
  login,
  logout,
  getSession,
} = useAirlock();
```

## Route Protection

```typescript
import { AirlockGuard } from '@sygnum/sygnum-idp-airlock/guards';

<AirlockGuard>
  <BankClient />
</AirlockGuard>
```

## Session Management

```typescript
// Check session
const session = await getSession();

// Logout
await logout({
  returnTo: window.location.origin,
});
```
