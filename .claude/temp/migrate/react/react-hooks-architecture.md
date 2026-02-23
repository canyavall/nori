---
tags:
  - react-hooks
  - hook
  - sideHook
  - websocket
  - feature-flags
  - ts
  - tsx
description: Hook architecture - complexity levels, decision tree, advanced patterns (WebSocket, permissions, feature flags), and side-hook extraction guidelines.
required_knowledge:
  - sidehooks-structure
  - react-project-conventions
rules:
  - "**/*{.hook,.sideHook}.{ts,tsx}"
---

# React Hooks Architecture

Guidelines for structuring custom hooks based on complexity, with advanced pattern examples.

## Hook Decision Tree

```
Need shared logic?
├─ YES: Reusable across 2+ components?
│   ├─ YES: <20 lines → Minimal wrapper hook
│   │        >60 lines → Extract to side-hooks
│   └─ NO: Keep in component
└─ NO: Keep in component
```

## Complexity Levels

| Level | Lines | Pattern | Action |
|-------|-------|---------|--------|
| 1 | 1-20 | Minimal wrapper (useToggle, localStorage) | Single file |
| 2 | 20-60 | Query aggregation, derived state | Single file |
| 3 | 60-150 | Multiple queries/form integration | Consider side-hooks |
| 4 | 150-300 | Multi-step flows, wizard orchestration | Must use side-hooks |
| 5 | 300+ | App initialization, complex wizards | Must use side-hooks |
| 6 | Any | Single useCallback wrapper | Anti-pattern — don't create |

### Level 1-2 Examples

```typescript
// Level 1: Minimal wrapper
export const useToggle = (initial = false) => {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle] as const;
};

// Level 2: Query aggregation
export const useAccountDetails = (accountId: string) => {
  const { data, isLoading } = useQuery(['account', accountId], fetchAccount);
  const displayName = useMemo(() => data ? `${data.firstName} ${data.lastName}` : 'Unknown', [data]);
  return { account: data, displayName, isLoading };
};
```

### Level 4-5: Advanced Patterns

**WebSocket lifecycle:**
```typescript
export const useWebSocket = (url: string) => {
  const [data, setData] = useState(null);
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onmessage = (e) => setData(JSON.parse(e.data));
    return () => ws.close();
  }, [url]);
  const send = useCallback((msg: any) => wsRef.current?.send(JSON.stringify(msg)), []);
  return { data, send };
};
```

**Permission checks** — use `useMemo`:
```typescript
export const usePermissions = (required: string[]) => {
  const { user } = useAuth();
  const hasAll = useMemo(() => required.every(p => user?.permissions.includes(p)), [user, required]);
  return { hasAll };
};
```

**Feature flags** — query with long `staleTime`:
```typescript
const { data } = useQuery(['flags'], fetchFlags, { staleTime: 10 * 60 * 1000 });
```

**50+ properties** — group into nested return objects:
```typescript
return {
  user: { data: user, isLoading, error },
  accounts: { data: accounts, totalBalance },
  actions: { refreshData, exportData },
};
```

## Naming Conventions

- **Main hooks**: `ComponentName.hook.ts` → `useComponentName`
- **Side-hooks**: `useFeatureName.sideHook.ts` → `useFeatureName`
- **Generic**: `useUtilityName.hook.ts`

## Composition Strategy

```typescript
// Level 1-2: Flat
return { state, query };

// Level 3-5: Hierarchical (compose side-hooks)
export const useComponent = () => {
  const auth = useAuth();
  const data = useData(auth.userId);
  const actions = useActions(data.id);
  return { ...auth, ...data, ...actions };
};
```

## When to Create / When NOT to

**Create**: Reused in 2+ components, state+effects encapsulation, testable independently
**Don't**: One-time use, single useState wrapper, pure calculation (use util), single useCallback

## Performance Tips

- `useCallback` for stable dependencies in effects
- `useRef` for latest value without re-runs: `callbackRef.current = callback`
- `useMemo` with minimal deps for expensive compute
- Extract to side-hooks at 150 lines (see `sidehooks-structure`)

## Testing

```typescript
const { result } = renderHook(() => useToggle());
// Mock side-hooks:
jest.mock('./sideHooks/useData.sideHook', () => ({ useData: () => ({ data: mockData }) }));
```
