# TypeScript Types

Interface vs type, utility types, props extraction, and type imports.

## Interface vs Type

**Use interface** for object shapes (extendable):

```typescript
export interface UserProps {
  id: string;
  name: string;
}

export interface AdminProps extends UserProps {
  role: string;
}
```

**Use type** for unions, intersections, mapped types:

```typescript
export type Status = 'pending' | 'approved' | 'rejected';
export type UserWithRole = User & { role: Role };
export type ReadonlyUser = Readonly<User>;
```

## Utility Types

| Type           | Purpose            | Example                      |
|----------------|--------------------|------------------------------|
| `Pick<T, K>`   | Select properties  | `Pick<User, 'id' \| 'name'>` |
| `Omit<T, K>`   | Exclude properties | `Omit<User, 'password'>`     |
| `Partial<T>`   | All optional       | `Partial<User>`              |
| `Required<T>`  | All required       | `Required<Config>`           |
| `Record<K, V>` | Object with keys   | `Record<string, Role>`       |
| `Readonly<T>`  | Immutable          | `Readonly<User>`             |

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

## Props Type Extraction

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

## Type Imports

```typescript
// ✅ Type-only imports
import type { FC } from 'react';
import type { User, UserRole } from './types';

// ✅ Mixed imports
import { useState, type ReactNode } from 'react';
import { Box, type BoxProps } from '@sygnum/suil';
```
