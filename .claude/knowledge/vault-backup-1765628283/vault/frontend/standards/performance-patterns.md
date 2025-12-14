# Performance Patterns

Performance optimization patterns for Sygnum frontend. All rules are MANDATORY.

## Core Web Vitals Targets

- **First Paint (FP)**: ≤ 1.0s
- **First Contentful Paint (FCP)**: ≤ 1.8s
- **Largest Contentful Paint (LCP)**: ≤ 2.5s
- **Cumulative Layout Shift (CLS)**: ≤ 0.1

## Memoization

**useMemo** for expensive calculations:
```typescript
const filteredProducts = useMemo(() => {
  return products.filter(p => p.category === selectedCategory);
}, [products, selectedCategory]);
```

**useCallback** for event handlers:
```typescript
const handleClick = useCallback((id: string) => {
  onClick(id);
}, [onClick]);
```

**React.memo** for components:
```typescript
export const ProductCard = memo(({ product, onClick }: Props) => (
  <Box onClick={() => onClick(product.id)}>{product.name}</Box>
));
```

## Event Handlers in Hooks (MANDATORY)

Define handlers in hook files, NOT inline:
```typescript
export const useFormHandlers = ({ onSubmit }: Props) => {
  const handleSubmit = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onSubmit(new FormData());
  }, [onSubmit]);

  return { handleSubmit };
};
```

## Image Optimization

Reserve space to prevent layout shift:
```typescript
<Box
  component="img"
  src={src}
  alt={alt}
  sx={{ width: 400, height: 300, objectFit: 'cover' }}
  loading="lazy"
/>
```

## Loading States

Use skeletons to prevent layout shift:
```typescript
if (isLoading) {
  return <Box height="100px" bgcolor="action.hover" borderRadius={1} />;
}
```
