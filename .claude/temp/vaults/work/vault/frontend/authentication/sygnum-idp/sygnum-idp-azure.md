# Sygnum Idp Azure

<!--
Migrated from: temp-FE-Mono/technical/sygnum-idp/sygnum-idp-azure.md
Migration date: 2025-12-08
Original category: technical/sygnum-idp
New category: patterns/sygnum/sygnum-idp
Source repo: temp-FE-Mono
-->

# Sygnum IDP - Azure AD

Azure AD (MSAL) integration for admin-panel.

## Setup

```typescript
import { MsalProvider } from '@sygnum/sygnum-idp-azure/providers';
import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: process.env.VITE_AZURE_CLIENT_ID,
    authority: process.env.VITE_AZURE_AUTHORITY,
    redirectUri: window.location.origin,
  },
};

const pca = new PublicClientApplication(msalConfig);

<MsalProvider instance={pca}>
  <App />
</MsalProvider>
```

## Hooks

```typescript
import { useMsal } from '@sygnum/sygnum-idp-azure/hooks';

const { instance, accounts, inProgress } = useMsal();

// Login
await instance.loginRedirect({
  scopes: ['User.Read'],
});

// Get token
const response = await instance.acquireTokenSilent({
  scopes: ['User.Read'],
  account: accounts[0],
});
```

## Route Protection

```typescript
import { AzureGuard } from '@sygnum/sygnum-idp-azure/guards';

<AzureGuard>
  <AdminPanel />
</AzureGuard>
```
