# React Performance

Performance optimization for React components. All patterns are MANDATORY.

## Core Web Vitals Targets

- **First Paint (FP)**: ≤ 1.0s
- **First Contentful Paint (FCP)**: ≤ 1.8s
- **Largest Contentful Paint (LCP)**: ≤ 2.5s
- **Cumulative Layout Shift (CLS)**: ≤ 0.1

## Event Handlers in Hooks (MANDATORY)

Always define in hook files with useCallback:

```typescript
// ✅ Correct
export const useFormHandlers = ({ onSubmit }: Props) => {
  const handleSubmit = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onSubmit(new FormData());
  }, [onSubmit]);

  return { handleSubmit };
};

// ❌ Never inline
<Button onClick={() => handleClick(id)}>Wrong</Button>
```

## React.memo

```typescript
export const ExpensiveComponent = memo(({ data, onClick }: Props) => {
  return (
    <Box>
      {/* Complex rendering */}
    </Box>
  );
});
```

## Loading States (MANDATORY - prevent layout shift)

```typescript
// ✅ Skeleton loaders
if (isLoading) {
  return (
    <Box>
      {[1, 2, 3].map(i => (
        <Box
          key={i}
          height="100px"
          bgcolor="action.hover"
          marginBottom={2}
          borderRadius={1}
        />
      ))}
    </Box>
  );
}

// ❌ Generic loading (causes layout shift)
if (isLoading) return <Typography>Loading...</Typography>;
```

## Code Splitting

```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));

export const App = () => (
  <Suspense fallback={<LoadingSkeleton />}>
    <HeavyComponent />
  </Suspense>
);
```

## Performance Rules

- Always use useCallback for event handlers
- Never define handlers inline in JSX
- Use skeleton loaders for loading states
- Use React.memo for expensive components
- Use code splitting for large components
