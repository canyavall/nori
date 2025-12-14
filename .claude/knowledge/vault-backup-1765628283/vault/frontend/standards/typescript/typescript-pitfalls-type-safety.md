# TypeScript Pitfalls - Type Safety

Common mistakes with type casting, any, non-null assertion, and type imports.

## Type Checking

```bash
# Check types for specific project
npx nx run my-project:tsCheck

# Must pass with zero errors before commit
```

## Type Safety Pitfalls

### ❌ Using `as` type casting
**Problem**: Bypasses type safety, can cause runtime errors

```typescript
// ❌ Wrong
const value = data as string;

// ✅ Correct
const isString = (value: unknown): value is string => typeof value === 'string';
if (isString(data)) {
  const value = data;
}
```

### ❌ Using `any` type
**Problem**: Disables type checking completely

```typescript
// ❌ Wrong
const processData = (data: any) => {};

// ✅ Correct
const processData = (data: unknown) => {
  if (isValidData(data)) {
    // Process typed data
  }
};
```

### ❌ Non-null assertion (`!`)
**Problem**: Can cause runtime null reference errors

```typescript
// ❌ Wrong
const name = user!.name;

// ✅ Correct
const name = user?.name ?? 'Unknown';
```

### ❌ Ignoring TypeScript errors
**Problem**: Errors indicate real type safety issues

```typescript
// ❌ Wrong
// @ts-ignore
const result = data.invalidProperty;

// ✅ Correct
const result = 'invalidProperty' in data ? data.invalidProperty : undefined;
```

### ❌ Type imports without `import type`
**Problem**: Increases bundle size unnecessarily

```typescript
// ❌ Wrong
import { User } from './types';

// ✅ Correct
import type { User } from './types';
```
