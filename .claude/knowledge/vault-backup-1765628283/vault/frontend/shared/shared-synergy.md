# Shared Synergy

<!--
Migrated from: temp-FE-Mono/technical/shared-synergy/shared-synergy.md
Migration date: 2025-12-08
Original category: technical/shared-synergy
New category: patterns/shared/shared-synergy
Source repo: temp-FE-Mono
-->

# Shared Synergy

Common components, authentication, and state management for Synergy client applications.

## SynergyAuthGuard

```typescript
import { SynergyAuthGuard } from '@sygnum/shared-synergy/components/SynergyAuthGuard';

// Protect routes with authentication
<SynergyAuthGuard>
  <ProtectedApp />
</SynergyAuthGuard>
```

## Authentication State

```typescript
import { useAuthState, authActions } from '@sygnum/shared-synergy/stores/auth/auth.state';

// Access auth state
const { authenticated, credentials, user } = useAuthState();

// Update auth state
authActions.setAuthenticated(userData);
authActions.setUnauthenticated();
authActions.setCredentials({ accessToken, refreshToken });
```

## Portfolio Permissions

```typescript
import { useSynergySelectedPortfolioPermissions } from '@sygnum/shared-synergy/hooks/synergySelectedPortfolioPermissions.hook';
import { SynergyPermissions } from '@sygnum/shared-synergy/basics/enums/synergyPermissions.enum';

// Check permissions
const { hasPermission } = useSynergySelectedPortfolioPermissions();
const canTrade = hasPermission(SynergyPermissions.TRADING);
const canViewReports = hasPermission(SynergyPermissions.REPORTS);
```

## Client Data API

```typescript
import { useGetClientData } from '@sygnum/shared-synergy/api/auth/queries/getClientData';

// Fetch client data
const { data: clientData, isLoading } = useGetClientData();
```

## Support Dialog

```typescript
import { SupportDialog } from '@sygnum/shared-synergy/components/SupportDialog';

// Show support dialog
<SupportDialog open={isOpen} onClose={handleClose} />
```

## Client State Management

```typescript
import { clientState } from '@sygnum/shared-synergy/stores/client/client.state';
import { userState } from '@sygnum/shared-synergy/stores/user/user.state';

// Access client/user state
const { clientId, portfolios } = clientState;
const { userId, userName } = userState;
```

## Best Practices

- Always wrap Synergy apps with `SynergyAuthGuard`
- Use `useAuthState` for authentication checks
- Leverage `useSynergySelectedPortfolioPermissions` for feature access control
- Use `authActions` to manage authentication lifecycle
- Implement `SupportDialog` for user assistance
