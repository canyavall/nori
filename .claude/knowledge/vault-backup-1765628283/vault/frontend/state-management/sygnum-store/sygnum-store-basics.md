# Sygnum Store Basics

<!--
Migrated from: temp-FE-Mono/technical/sygnum-store/sygnum-store-basics.md
Migration date: 2025-12-08
Original category: technical/sygnum-store
New category: patterns/sygnum/sygnum-store
Source repo: temp-FE-Mono
-->

# Sygnum Store - Basics

Reactive state management library built on Valtio.

## When to Use

- Managing global application state
- Handling UI state (modals, panels, steppers)
- Implementing authentication state
- Managing real-time data (market feeds, trading data)
- Creating reactive state with minimal boilerplate

## Core Concept

```typescript
import { SygnumStore } from '@sygnum/store/store';

const store = new SygnumStore({
  initialState,
  actions,
  hydrateState,    // Optional: load from localStorage
  persistState,    // Optional: save to localStorage
});
```

## Basic Store Pattern

```typescript
interface State {
  count: number;
  user: string | null;
}

const initialState: State = {
  count: 0,
  user: null,
};

const actions = (state: State) => ({
  increment: () => {
    state.count++;
  },
  setUser: (name: string) => {
    state.user = name;
  },
});

const counterStore = new SygnumStore({ initialState, actions });

export const {
  useState as useCounterState,
  useActions as useCounterActions,
  useReset as useCounterReset
} = counterStore.hooks;
```

## Usage in Components

```typescript
import { useCounterState, useCounterActions } from './counter.store';

function Counter() {
  const { count } = useCounterState();
  const { increment } = useCounterActions();

  return <button onClick={increment}>{count}</button>;
}
```

## Store Reset

```typescript
const { useReset } = myStore.hooks;
const reset = useReset();

// Reset store to initial state
reset();
```
