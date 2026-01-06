# React Patterns

Common React patterns for Sygnum frontend. Always use braces.

## Conditional Rendering

```typescript
// Early returns (always use braces)
if (isLoading) {
  return <LoadingSkeleton />;
}
if (error) {
  return <ErrorMessage error={error} />;
}

// Ternary operator
{isActive ? <ActiveView /> : <InactiveView />}

// Logical AND
{hasPermission && <AdminPanel />}
```

## Lists and Keys

```typescript
{items.map(item => (
  <Box key={item.id}>
    <Typography>{item.name}</Typography>
  </Box>
))}

// With index (only if no stable ID)
{items.map((item, index) => (
  <Box key={index}>
    <Typography>{item.name}</Typography>
  </Box>
))}
```

## Forms

```typescript
const handleSubmit = useCallback((event: FormEvent) => {
  event.preventDefault();
  // Form logic
}, []);

<Box component="form" onSubmit={handleSubmit}>
  <YodaTextField
    name="email"
    validation={validation.email}
  />
  <Button type="submit">Submit</Button>
</Box>
```

## Error Boundaries

```typescript
export const ErrorFallback: FC<{ error: Error }> = ({ error }) => {
  return (
    <Box padding={2}>
      <Typography variant="h6">Something went wrong</Typography>
      <Typography variant="body2">{error.message}</Typography>
    </Box>
  );
};
```

## Common Pitfalls

- ❌ Default exports → Use named exports only
- ❌ Direct HTML elements → Use `@sygnum/suil` components
- ❌ Hardcoded strings → Use i18n
- ❌ Type casting (`as`) → Use type guards
- ❌ Inline event handlers → Define in hook with useCallback
- ❌ Missing loading skeletons → Causes layout shift
- ❌ JSDoc comments → Remove, TypeScript provides types
- ❌ Native math for money → Use BigNumber.js
- ❌ Omitting braces → Always use braces in conditionals
