# Sygnum Idp Ping

<!--
Migrated from: temp-FE-Mono/technical/sygnum-idp/sygnum-idp-ping.md
Migration date: 2025-12-08
Original category: technical/sygnum-idp
New category: patterns/sygnum/sygnum-idp
Source repo: temp-FE-Mono
-->

# Sygnum IDP - Ping

PingFederate integration for synergy-client.

## Setup

```typescript
import { PingProvider } from '@sygnum/sygnum-idp-ping/providers';

<PingProvider
  baseUrl={process.env.VITE_PING_BASE_URL}
  clientId={process.env.VITE_PING_CLIENT_ID}
  redirectUri={window.location.origin}
>
  <App />
</PingProvider>
```

## Hooks

```typescript
import { usePing } from '@sygnum/sygnum-idp-ping/hooks';

const {
  isAuthenticated,
  user,
  login,
  logout,
  getAccessToken,
} = usePing();
```

## Route Protection

```typescript
import { PingGuard } from '@sygnum/sygnum-idp-ping/guards';

<PingGuard>
  <SynergyClient />
</PingGuard>
```

## Token Management

```typescript
const token = await getAccessToken();

// Refresh token if needed
if (isTokenExpired(token)) {
  await refreshAccessToken();
}
```
