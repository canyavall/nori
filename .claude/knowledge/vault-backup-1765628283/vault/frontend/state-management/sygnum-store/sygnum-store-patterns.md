# Sygnum Store Patterns

<!--
Migrated from: temp-FE-Mono/technical/sygnum-store/sygnum-store-patterns.md
Migration date: 2025-12-08
Original category: technical/sygnum-store
New category: patterns/sygnum/sygnum-store
Source repo: temp-FE-Mono
-->

# Sygnum Store - Patterns

Advanced patterns for state management.

## Action Patterns

### Direct Mutation

```typescript
actions: state => ({
  setValue: (value: string) => {
    state.value = value;  // Valtio direct mutation
  },
});
```

### Partial Updates

```typescript
actions: state => ({
  updateUser: (updates: Partial<User>) => {
    state.user = { ...state.user, ...updates };
  },
});
```

### Array Manipulation

```typescript
actions: state => ({
  addItem: (item: Item) => {
    state.items.push(item);
  },
  removeItem: (id: string) => {
    state.items = state.items.filter(i => i.id !== id);
  },
});
```

### Conditional Updates

```typescript
actions: state => ({
  setPanelState: ({ collapsed, view }: Partial<State>) => {
    if (collapsed !== undefined) state.collapsed = collapsed;
    if (view) state.currentView = view;
  },
});
```

## Calculated State Updates

```typescript
actions: state => ({
  updateMarketData: (data: RawMarketData) => {
    const priceChange = data.currentPrice - data.previousPrice;
    const changePercent = (priceChange / data.previousPrice) * 100;

    state.price = data.currentPrice;
    state.priceChange = priceChange;
    state.changePercent = changePercent;
  },
});
```

## Multiple Related Stores

Separate stores for different concerns:

```typescript
// generalPanel.store.ts
export const generalPanelStore = new SygnumStore({
  initialState: { collapsed: true, currentView: View.general },
  actions: state => ({
    setGeneralPanelState: ({ collapsed, view }) => {
      if (collapsed !== undefined) state.collapsed = collapsed;
      if (view) state.currentView = view;
    },
  }),
});

// modal.store.ts
export const modalStore = new SygnumStore({
  initialState: { isOpen: false, modalType: null },
  actions: state => ({
    openModal: (type: string) => {
      state.isOpen = true;
      state.modalType = type;
    },
  }),
});
```
