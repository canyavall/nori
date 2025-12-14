# React Router Monorepo Patterns

<!--
Migrated from: temp-FE-Mono/technical/react-router/react-router-monorepo-patterns.md
Migration date: 2025-12-08
Original category: technical/react-router
New category: patterns/frontend/react-router
Source repo: temp-FE-Mono
-->

# React Router Monorepo Patterns

**Target Architecture**: Apps own routes, modules export page components only.

## Core Principle

**Modules export ONLY page components**. Apps define complete route trees.

## Module Structure (Target)

```typescript
// ✅ libs/modules/crypto/bank-client/src/index.ts
export { CryptoPortfolioPage } from './pages/CryptoPortfolioPage';
export { CryptoStakingPage } from './pages/CryptoStakingPage';

// ❌ DO NOT export route components or route configs
```

## App Route Structure (Target)

```typescript
// ✅ apps/bank-client/src/routes/index.tsx
import { Routes, Route } from 'react-router';
import { CryptoPortfolioPage, CryptoStakingPage } from '@crypto/bank-client';

export const BankClientRoutes = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route path="/portal/crypto/portfolio" element={<CryptoPortfolioPage />} />
      <Route path="/portal/crypto/staking" element={<CryptoStakingPage />} />
    </Route>
  </Routes>
);
```

## Route Constants Location

**Shared routes** (cross-module): `libs/sygnum/shared-[app]/constants/routes.ts` **App routes**: `apps/[app]/src/routes/constants.ts`

```typescript
// ✅ libs/sygnum/shared-bank-client/constants/routes.ts
export const COMMON_ROUTES = {
  dashboard: '/portal/dashboard',
  error401: '/error/401',
  error404: '/error/404',
};
```

## Migration Checklist

**Modules**:

1. Remove `.route.tsx` files
2. Export only page components from `index.ts`
3. Move route constants to shared location if truly cross-module

**Apps**:

1. Create `routes/` directory
2. Import page components from modules
3. Define complete route tree in app
4. Add app-specific route constants

## Why This Architecture

✅ Apps control routing logic ✅ Modules focus on features only ✅ No circular dependencies ✅ Easier per-app customization ✅ Clear
separation of concerns

## ❌ Anti-Patterns

- ❌ Export Route components from modules
- ❌ Define route paths in modules
- ❌ Create `.route.tsx` files in new modules
- ❌ Export route constants from modules unless truly shared

**References**: `react-router-v7-basics`, `react-router-navigation`
