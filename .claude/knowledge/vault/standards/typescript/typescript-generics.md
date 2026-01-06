# TypeScript - Generics

Generic functions, interfaces, types, and React components with type parameters.

## Generics

```typescript
// Generic function
export const identity = <T>(value: T): T => value;

// Generic with constraints
export const getProperty = <T, K extends keyof T>(obj: T, key: K): T[K] => obj[key];

// Generic interface
export interface ApiResponse<T> {
  data: T;
  status: number;
}

// Generic type
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// React components
export const GenericList = <T,>({
  items,
  renderItem,
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
}) => <Box>{items.map(renderItem)}</Box>;
```
