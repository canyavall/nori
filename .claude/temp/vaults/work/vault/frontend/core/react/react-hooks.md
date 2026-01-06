# React Hooks

React hooks patterns for Sygnum frontend. Performance-focused with TypeScript.

## useState

```typescript
const [count, setCount] = useState(0);
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Item[]>([]);

// Functional updates
setCount(prev => prev + 1);
setItems(prev => [...prev, newItem]);
```

## useEffect

```typescript
// Mount/unmount
useEffect(() => {
  const subscription = subscribeToData();
  return () => subscription.unsubscribe();
}, []);

// Dependency changes
useEffect(() => {
  if (userId) {
    fetchUserData(userId);
  }
}, [userId]);
```

## useMemo (MANDATORY for expensive calculations)

```typescript
const filteredItems = useMemo(() => {
  return items.filter(item => item.category === selectedCategory);
}, [items, selectedCategory]);

const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => a.date - b.date);
}, [items]);
```

## useCallback (MANDATORY for event handlers)

```typescript
// Event handlers - ALWAYS use useCallback
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);

const handleSubmit = useCallback((event: FormEvent) => {
  event.preventDefault();
  onSubmit(formData);
}, [onSubmit, formData]);
```

## Custom Hooks

```typescript
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

## Hook Rules

- Extract props types with Pick/Omit for hooks
- Always use useCallback for event handlers (NO inline functions)
- Use useMemo for expensive calculations
- Custom hooks must start with "use"
- Return objects from custom hooks for clarity
