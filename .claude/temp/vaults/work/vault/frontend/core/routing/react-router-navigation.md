# React Router Navigation

<!--
Migrated from: temp-FE-Mono/technical/react-router/react-router-navigation.md
Migration date: 2025-12-08
Original category: technical/react-router
New category: patterns/frontend/react-router
Source repo: temp-FE-Mono
-->

# React Router Navigation

Programmatic and declarative navigation patterns.

## Route Constants

```typescript
export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  PORTFOLIO: '/portfolio',
  TRADE: '/trade/:assetId',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
```

Keep it simple. Only add complexity if pattern repeats 5+ times.

## Programmatic Navigation

```typescript
import { useNavigate } from 'react-router';

export function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(ROUTES.PORTFOLIO);
  };

  return <Button onClick={handleClick}>Go to Portfolio</Button>;
}
```

## Navigation with State

```typescript
const handleTradeSuccess = () => {
  navigate(ROUTES.PORTFOLIO, {
    state: { message: 'Trade completed', from: ROUTES.TRADE },
  });
};
```

## Dynamic Routes

```typescript
const goToTrade = (assetId: string) => {
  // Simple replacement
  navigate(ROUTES.TRADE.replace(':assetId', assetId));

  // Or template string
  navigate(`/trade/${assetId}`);
};
```

## Navigation Helpers (Optional)

Only create if repeated 3+ times across modules:

```typescript
export const useCryptoRoutes = () => {
  const navigate = useNavigate();

  const goToPortfolio = () => navigate('/crypto/portfolio');
  const goToStaking = (assetId: string) => navigate(`/crypto/staking/${assetId}`);

  return { goToPortfolio, goToStaking };
};
```

## Link Components

```typescript
import { Link } from 'react-router';

<Link to={ROUTES.PORTFOLIO}>View Portfolio</Link>
```

## ❌ Anti-Patterns

- ❌ Complex route helper factories
- ❌ Route parameter builders with generics
- ❌ Over-abstracted navigation utilities

**References**: `react-router-v7-basics`, `react-router-monorepo-patterns`
