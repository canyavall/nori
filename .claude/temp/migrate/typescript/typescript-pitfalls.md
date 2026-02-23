---
tags:
  - type-safety
  - type-guards
  - pitfalls
  - best-practices
description: >-
  Common TypeScript mistakes to avoid: type casting, any type, non-null
  assertions, || for defaults (use ??), and how to use type guards instead
required_knowledge: []
rules:
  - "**/*.ts"
  - "**/*.tsx"
---
# TypeScript Pitfalls

Common TypeScript mistakes and how to avoid them.

## MANDATORY Type Safety Rules

- **NEVER use type casting** - No `as` for type casting, use type guards instead
- **NEVER use `||` for defaults** - Use `??` (nullish coalescing) instead
- **NEVER use `any`** - Use `unknown` instead
- **NEVER use non-null assertion (`!`)** - Use optional chaining and nullish coalescing

## ❌ Type Casting (NEVER)

**Problem**: Bypasses type safety, causes runtime errors

```typescript
// ❌ NEVER - Bypasses type checking
const value = data as string;
const user = response as User;

// ✅ CORRECT - Use type guards
const isString = (value: unknown): value is string => typeof value === 'string';
if (isString(data)) {
  const value = data; // TypeScript knows it's string
}

// ✅ CORRECT - Type guard for objects
const isUser = (obj: unknown): obj is User => {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'name' in obj;
};
```

**Exception - `as const` is NOT type casting**:
```typescript
// ✅ CORRECT - Const assertion creates literal types
const STATUSES = ['active', 'inactive'] as const;
type Status = typeof STATUSES[number]; // 'active' | 'inactive'

// ✅ CORRECT - Const for readonly objects
const CONFIG = { apiUrl: 'https://api.example.com' } as const;
```

**Don't confuse**:
- `as const` = Const assertion (enables literal types) ✅
- `as Type` = Type casting (bypasses safety) ❌

## ❌ Using `any` Type

**Problem**: Disables type checking completely

```typescript
// ❌ NEVER
const processData = (data: any) => {};
const result: any = fetchData();

// ✅ CORRECT - Use unknown
const processData = (data: unknown) => {
  if (isValidData(data)) {
    // Process typed data
  }
};
```

## ❌ Non-null Assertion (`!`)

**Problem**: Can cause runtime null reference errors

```typescript
// ❌ NEVER
const name = user!.name;
const value = data!.value;

// ✅ CORRECT - Optional chaining
const name = user?.name ?? 'Unknown';

// ✅ CORRECT - Explicit check
if (user === null) return 'Guest';
return user.name;
```

## ❌ Using `||` for Defaults

**Problem**: Treats ALL falsy values (0, false, '', NaN) as nullish

```typescript
// ❌ NEVER - Breaks with valid falsy values
const count = value || 10; // BUG: 0 becomes 10
const enabled = config.enabled || true; // BUG: false becomes true
const message = text || 'default'; // BUG: '' becomes 'default'

// ✅ ALWAYS - Use ?? instead
const count = value ?? 10; // 0 stays 0
const enabled = config.enabled ?? true; // false stays false
const message = text ?? 'default'; // '' stays ''
```

**Real bugs this causes**:
- Pagination: `page || 1` treats page 0 as invalid
- Toggles: `isEnabled || true` ignores explicit false
- Counters: `count || 0` treats 0 as missing value
- Search: `query || ''` would break empty string searches

## ❌ Ignoring TypeScript Errors

**Problem**: Errors indicate real type safety issues

```typescript
// ❌ NEVER
// @ts-ignore
const result = data.invalidProperty;

// @ts-expect-error
const value = brokenFunction();

// ✅ CORRECT - Fix the type issue
const result = 'invalidProperty' in data ? data.invalidProperty : undefined;
```

## ❌ Missing Type Imports

**Problem**: Increases bundle size unnecessarily

```typescript
// ❌ WRONG - Type imported as value
import { User } from './types';
const user: User = {};

// ✅ CORRECT - Type-only import
import type { User } from './types';
const user: User = {};

// ✅ CORRECT - Mixed imports
import { useState, type ReactNode } from 'react';
```

## Type Guards (Use These Instead)

```typescript
// Typeof guard
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isNumber = (value: unknown): value is number => typeof value === 'number';

// Instanceof guard
export const isError = (error: unknown): error is Error => error instanceof Error;

// Property checking
export const hasId = (obj: unknown): obj is { id: string } => {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
};

// Array checking
export const isStringArray = (arr: unknown): arr is string[] => {
  return Array.isArray(arr) && arr.every(item => typeof item === 'string');
};

// Discriminated union (no guard needed)
type Result = { success: true; data: string } | { success: false; error: Error };

if (result.success) {
  console.log(result.data); // TypeScript knows it's success branch
} else {
  console.error(result.error); // TypeScript knows it's error branch
}
```

## Nullable Checks

```typescript
// ✅ Check before use
if (user === null) return 'Guest';

// ✅ Optional chaining
return data?.user?.profile?.name ?? 'Unknown';

// ✅ Nullish coalescing
return name ?? 'Anonymous';

// ✅ Type narrowing
if (typeof value === 'string') {
  return value.toUpperCase();
}
```

## Best Practices Recap

**DO**:
- Use type guards instead of type casting
- Use `unknown` instead of `any`
- Check for null/undefined explicitly
- Use `import type` for type-only imports
- Use `as const` for literal types
- Use `??` (nullish coalescing) for defaults

**DON'T**:
- Use `as Type` for type casting
- Use `any` type
- Use non-null assertion (`!`)
- Ignore TypeScript errors with `@ts-ignore`
- Use `||` for default values
- Import types as values
