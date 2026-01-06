# Sygnum Store Persistence

<!--
Migrated from: temp-FE-Mono/technical/sygnum-store/sygnum-store-persistence.md
Migration date: 2025-12-08
Original category: technical/sygnum-store
New category: patterns/sygnum/sygnum-store
Source repo: temp-FE-Mono
-->

# Sygnum Store - Persistence

State persistence with localStorage.

## Hydrate and Persist Pattern

```typescript
interface AuthState {
  accessToken: string | null;
  userId: string | null;
}

const STORAGE_KEY = 'auth_state';

const initialState: AuthState = {
  accessToken: null,
  userId: null,
};

const hydrateState = (): Partial<AuthState> => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
};

const persistState = (state: AuthState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const authStore = new SygnumStore({
  initialState,
  actions: state => ({
    login: (token: string, userId: string) => {
      state.accessToken = token;
      state.userId = userId;
    },
    logout: () => {
      state.accessToken = null;
      state.userId = null;
    },
  }),
  hydrateState,
  persistState,
});
```

## Best Practices

**Use descriptive export names**
```typescript
export {
  useState as useAuthState,
  useActions as useAuthActions,
  useReset as useAuthReset
};
```

**Keep state flat**
```typescript
// Avoid deep nesting
interface State {
  user: { profile: { settings: { theme: string } } }; // ❌
}

// Prefer flat structure
interface State {
  userTheme: string; // ✅
}
```

**Use Records for dynamic data**
```typescript
interface State {
  marketDataFeed: Record<string, MarketData>; // ✅
}
```

## Common Pitfalls

**Mutating state outside actions** - Always update through actions
**Not cleaning up on logout** - Implement logout/reset actions
**Over-persisting state** - Only persist critical user state
**Deep nested structures** - Keep state flat for better reactivity
**Missing TypeScript types** - Always define proper interfaces
