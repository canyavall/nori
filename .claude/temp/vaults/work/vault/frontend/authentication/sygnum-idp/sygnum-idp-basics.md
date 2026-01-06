# Sygnum Idp Basics

<!--
Migrated from: temp-FE-Mono/technical/sygnum-idp/sygnum-idp-basics.md
Migration date: 2025-12-08
Original category: technical/sygnum-idp
New category: patterns/sygnum/sygnum-idp
Source repo: temp-FE-Mono
-->

# Sygnum IDP - Basics

Authentication and identity management library.

## Library Suite

- **@sygnum/sygnum-idp-auth0**: Auth0 integration (developer-portal)
- **@sygnum/sygnum-idp-azure**: Azure AD/MSAL integration (admin-panel)
- **@sygnum/sygnum-idp-ping**: PingFederate integration (synergy-client)
- **@sygnum/sygnum-idp-airlock**: Airlock integration (bank-client)
- **@sygnum/sygnum-idp-shared**: Shared utilities and types

## Core Pattern

Each IDP library exports:
- **Provider**: Authentication context provider
- **Hooks**: Authentication state and methods
- **Guards**: Route protection components
- **Utils**: Token management and helpers

## Shared Session Management

```typescript
import { useSessionManagement } from '@sygnum/sygnum-idp-shared/hooks';

const {
  isAuthenticated,
  user,
  login,
  logout,
  getAccessToken,
  refreshToken,
} = useSessionManagement();
```

## Token Management

```typescript
import { getAccessToken, isTokenExpired } from '@sygnum/sygnum-idp-shared/utils';

// Get current access token
const token = await getAccessToken();

// Check token expiry
if (isTokenExpired(token)) {
  await refreshToken();
}
```
