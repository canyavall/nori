# Sygnum Idp Auth0

<!--
Migrated from: temp-FE-Mono/technical/sygnum-idp/sygnum-idp-auth0.md
Migration date: 2025-12-08
Original category: technical/sygnum-idp
New category: patterns/sygnum/sygnum-idp
Source repo: temp-FE-Mono
-->

# Sygnum IDP - Auth0

Auth0 integration for developer-portal.

## Setup

```typescript
import { Auth0Provider } from '@sygnum/sygnum-idp-auth0/providers';

<Auth0Provider
  domain={process.env.VITE_AUTH0_DOMAIN}
  clientId={process.env.VITE_AUTH0_CLIENT_ID}
  redirectUri={window.location.origin}
  audience={process.env.VITE_AUTH0_AUDIENCE}
>
  <App />
</Auth0Provider>
```

## Hooks

```typescript
import { useAuth0 } from '@sygnum/sygnum-idp-auth0/hooks';

const {
  isAuthenticated,
  isLoading,
  user,
  loginWithRedirect,
  logout,
  getAccessTokenSilently,
} = useAuth0();
```

## Route Protection

```typescript
import { Auth0Guard } from '@sygnum/sygnum-idp-auth0/guards';

<Auth0Guard>
  <ProtectedRoute />
</Auth0Guard>
```

## Token Access

```typescript
const token = await getAccessTokenSilently({
  audience: process.env.VITE_AUTH0_AUDIENCE,
});
```
