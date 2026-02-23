---
tags:
  - conventions
  - interfaces
  - types
  - type
  - dto
  - nullish-coalescing
  - ts
  - tsx
description: >-
  TypeScript conventions: interface vs type, utility types (Pick/Omit/Partial),
  props type extraction, DTO transformation patterns, .type.ts file patterns, and
  mandatory nullish coalescing (??)
required_knowledge: []
rules:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.type.{ts,tsx}"
---
# TypeScript Project Conventions

Sygnum-specific TypeScript patterns including types, DTOs, and project-specific rules.

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

## Type Imports (MANDATORY)

```typescript
// ✅ Type-only imports
import type { FC } from 'react';
import type { User, UserRole } from './types';

// ✅ Mixed imports
import { useState, type ReactNode } from 'react';
import { Box, type BoxProps } from '@sygnum/suil';
```

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

## Type Definition Files (.type.ts)

**Purpose**: Centralize type definitions for a component, hook, or feature.

**File naming**: `ComponentName.type.ts` or `featureName.type.ts`

### When to Use .type.ts

**MANDATORY: Use .type.ts when**:
- Type is used in more than one file
- Component/hook has type definitions (component main file must NEVER contain types)

**Use inline when**:
- Type is used ONLY in that single file AND it's not a component/hook file

### Component Props Pattern

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

### Hook Props and Return Types

```typescript
// useFeatureName.type.ts
export interface UseFeatureNameProps {
  clientId?: string;
}

export interface UseFeatureNameReturn {
  data: FeatureData | null;
  isLoading: boolean;
}
```

### DTO Alias Pattern

```typescript
// featureName.type.ts - Re-export DTOs with cleaner names
import type { UserDtoFromBackend } from '@sygnum/dto-core';

export type User = UserDtoFromBackend;
```

### External Library Types

```typescript
// ChartComponent.type.ts
import type { ScaleLinear, NumberValue } from 'd3';
import type { BoxProps } from '@sygnum/suil';

export interface ChartComponentProps extends BoxProps {
  scale: ScaleLinear<number, number>;
  formatter?: (value: NumberValue) => string;
}
```

### Optional Properties Convention

```typescript
export interface FormProps {
  title: string;              // Required
  subtitle?: string;          // Optional - use ? suffix
  onCancel?: () => void;      // Optional
}
```

## Nullish Coalescing (MANDATORY)

**ALWAYS use `??` instead of `||` for default values.**

```typescript
// ❌ NEVER - || treats ALL falsy values (0, false, '', NaN) as falsy
const count = value || 10; // BUG: 0 becomes 10
const enabled = config.enabled || true; // BUG: false becomes true
const message = text || 'default'; // BUG: '' becomes 'default'

// ✅ ALWAYS - ?? only treats null/undefined as nullish
const count = value ?? 10; // 0 stays 0
const enabled = config.enabled ?? true; // false stays false
const message = text ?? 'default'; // '' stays ''
```

**Why**: `||` causes bugs with valid falsy values (0, false, '', NaN). SonarQube flags `||` usage.

**Real-world examples**:
- Pagination: `page || 1` breaks when page is 0 (first page)
- Toggles: `isEnabled || true` breaks when explicitly set to false
- Counters: `count || 0` breaks when count is 0

## Type Checking

```bash
# Check types for specific project
npx nx run my-project:tsCheck

# Must pass with zero errors before commit
```
