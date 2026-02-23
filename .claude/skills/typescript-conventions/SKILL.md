---
name: typescript-conventions
description: TypeScript patterns: interface vs type, utility types, props extraction, DTO transformation, type guards, pitfalls (no `as`, no `any`, no `!`, use `??`), and .type.ts file rules.
globs: '**/*.{ts,tsx}'
alwaysApply: false
---

# TypeScript Conventions

TypeScript patterns, DTO transformation, type safety rules, and common pitfalls. All rules are MANDATORY.

---

## Interface vs Type

**Use `interface`** for object shapes (extendable):
```typescript
export interface UserProps {
  id: string;
  name: string;
}

export interface AdminProps extends UserProps {
  role: string;
}
```

**Use `type`** for unions, intersections, mapped types:
```typescript
export type Status = 'pending' | 'approved' | 'rejected';
export type UserWithRole = User & { role: Role };
export type ReadonlyUser = Readonly<User>;
```

---

## Utility Types

| Type | Purpose | Example |
|------|---------|---------|
| `Pick<T, K>` | Select properties | `Pick<User, 'id' \| 'name'>` |
| `Omit<T, K>` | Exclude properties | `Omit<User, 'password'>` |
| `Partial<T>` | All optional | `Partial<User>` |
| `Required<T>` | All required | `Required<Config>` |
| `Record<K, V>` | Object with keys | `Record<string, Role>` |
| `Readonly<T>` | Immutable | `Readonly<User>` |

```typescript
// Pick - Extract specific properties
type Credentials = Pick<User, 'email' | 'password'>;

// Omit - Remove sensitive fields
type PublicUser = Omit<User, 'password'>;

// Partial - For updates
const updateUser = (id: string, updates: Partial<User>) => {};

// Record - Type-safe maps
type StatusLabels = Record<'pending' | 'approved', string>;
```

---

## Props Type Extraction (MANDATORY Pattern)

```typescript
export interface ComponentProps {
  userId: string;
  userName: string;
  onEdit: (id: string) => void;
}

// Extract single property
export const useTitle = (userName: ComponentProps['userName']) => userName.toUpperCase();

// Extract with Pick
export const useHandlers = (props: Pick<ComponentProps, 'onEdit' | 'userId'>) => {
  return { handleEdit: () => props.onEdit(props.userId) };
};

// Extract with Omit
export const useDisplay = (props: Omit<ComponentProps, 'onEdit'>) => {
  return { title: props.userName };
};
```

---

## Type Imports (MANDATORY)

```typescript
// ✅ Type-only imports
import type { Component } from 'solid-js';
import type { User, UserRole } from './types';

// ✅ Mixed imports
import { createSignal, type Accessor } from 'solid-js';
```

---

## DTO Transformation Pattern

```typescript
// Backend DTO (snake_case)
export interface UserDtoFromBackend {
  user_id: string;
  full_name: string;
  email_address: string;
}

// Frontend type (camelCase)
export interface User {
  id: string;
  name: string;
  email: string;
}

// Transformer
export const transformUser = (dto: UserDtoFromBackend): User => ({
  id: dto.user_id,
  name: dto.full_name,
  email: dto.email_address,
});
```

---

## Enums

```typescript
// ✅ Enum with camelCase keys
export enum TransactionTypes {
  deposit = 'Deposit',
  withdrawal = 'Withdrawal',
  transfer = 'Transfer',
}

// ✅ Alternative: Union types (preferred for simple cases)
export type TransactionType = 'Deposit' | 'Withdrawal' | 'Transfer';
```

---

## Type Definition Files (.type.ts)

**File naming**: `ComponentName.type.ts` or `featureName.type.ts`

**MANDATORY: Use .type.ts when**:
- Type is used in more than one file
- Component/hook has type definitions (main file must NEVER contain types)

**Use inline when**: Type is used ONLY in that single file AND it's not a component/hook file

```typescript
// ComponentName.type.ts
export interface ComponentNameProps {
  title: string;
  onClose: () => void;
  config?: ComponentConfig;
}

export interface ComponentConfig {
  theme: 'light' | 'dark';
}
```

---

## MANDATORY Type Safety Rules

### ❌ NEVER Type Cast with `as`

**Problem**: Bypasses type safety, causes runtime errors

```typescript
// ❌ NEVER — Bypasses type checking
const value = data as string;
const user = response as User;

// ✅ CORRECT — Use type guards
const isString = (value: unknown): value is string => typeof value === 'string';
if (isString(data)) {
  const value = data; // TypeScript knows it's string
}
```

**Exception — `as const` is NOT type casting**:
```typescript
// ✅ CORRECT — Const assertion creates literal types
const STATUSES = ['active', 'inactive'] as const;
type Status = typeof STATUSES[number]; // 'active' | 'inactive'
```

### ❌ NEVER Use `any`

```typescript
// ❌ NEVER
const processData = (data: any) => {};

// ✅ CORRECT — Use unknown
const processData = (data: unknown) => {
  if (isValidData(data)) {
    // Process typed data
  }
};
```

### ❌ NEVER Use Non-null Assertion (`!`)

```typescript
// ❌ NEVER
const name = user!.name;

// ✅ CORRECT — Optional chaining
const name = user?.name ?? 'Unknown';

// ✅ CORRECT — Explicit check
if (user === null) return 'Guest';
return user.name;
```

### ❌ NEVER Use `||` for Defaults — Use `??`

**Problem**: `||` treats ALL falsy values (0, false, '', NaN) as nullish

```typescript
// ❌ NEVER — BUG: 0 becomes 10
const count = value || 10;
// ❌ NEVER — BUG: false becomes true
const enabled = config.enabled || true;
// ❌ NEVER — BUG: '' becomes 'default'
const message = text || 'default';

// ✅ ALWAYS — ?? only treats null/undefined as nullish
const count = value ?? 10;       // 0 stays 0
const enabled = config.enabled ?? true;  // false stays false
const message = text ?? 'default';       // '' stays ''
```

**Real bugs this causes**:
- Pagination: `page || 1` breaks page 0
- Toggles: `isEnabled || true` ignores explicit false
- Counters: `count || 0` treats 0 as missing

### ❌ NEVER Ignore TypeScript Errors

```typescript
// ❌ NEVER
// @ts-ignore
const result = data.invalidProperty;

// ✅ CORRECT — Fix the type issue
const result = 'invalidProperty' in data ? data.invalidProperty : undefined;
```

---

## Type Guards (Use Instead of `as`)

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

// Discriminated union (no guard needed)
type Result = { success: true; data: string } | { success: false; error: Error };
if (result.success) {
  console.log(result.data); // TypeScript knows it's success branch
}
```

---

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

// Discriminated result type
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
```

---

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
