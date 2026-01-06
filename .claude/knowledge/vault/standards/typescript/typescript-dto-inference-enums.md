# TypeScript - DTO, Inference & Enums

DTO transformation patterns, type inference rules, and enum usage.

## DTO Transformation

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

## Type Inference Rules

**MANDATORY**: Let TypeScript infer types - never use `as const` or derive types unnecessarily.

```typescript
// ✅ TypeScript infers literal types automatically
export const ROLES = ['admin', 'user', 'guest'];
// TypeScript infers: readonly ['admin', 'user', 'guest']

// ❌ NEVER add as const - redundant type casting
export const ROLES = ['admin', 'user', 'guest'] as const;

// ✅ TypeScript infers readonly object types
export const CONFIG = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
};
// TypeScript infers: { readonly apiUrl: string; readonly timeout: number }

// ❌ NEVER add as const - redundant
export const CONFIG = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
} as const;

// ✅ If you need a union type, create it explicitly
export type Role = 'admin' | 'user' | 'guest';
export const ROLES: readonly Role[] = ['admin', 'user', 'guest'];

// ❌ NEVER derive types from const objects - redundant
export const ROLES = ['admin', 'user', 'guest'] as const;
export type Role = typeof ROLES[number]; // ❌ TypeScript already knows the type!
```

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
