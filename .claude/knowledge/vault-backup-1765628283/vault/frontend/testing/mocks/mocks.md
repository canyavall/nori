# Mocks

<!--
Migrated from: temp-FE-Mono/technical/mocks/mocks.md
Migration date: 2025-12-08
Original category: technical/mocks
New category: patterns/testing
Source repo: temp-FE-Mono
-->

# Mock Data Generators

Create mock data generators using `@faker-js/faker` for DTOs, types, and test data.

## Basic Pattern

```typescript
import { faker } from '@faker-js/faker';

export const generateUserMock = (props?: Partial<User>): User => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  ...props,
});
```

**Rules**: Arrow function, `generate${TypeName}Mock`, single `Partial<T>` param, spread props last

## Required vs Optional

```typescript
type User = {
  id: string;        // Required - generate
  roles: string[];   // Required array - empty array
  bio?: string;      // Optional - skip
};

export const generateUserMock = (props?: Partial<User>): User => ({
  id: faker.string.uuid(),
  roles: [],  // NEVER generate array items
  ...props,
});
```

## Enums

```typescript
status: faker.helpers.enumValue(TransactionStatus),
```

## Nested Objects

```typescript
export const generateAddressMock = (props?: Partial<Address>): Address => ({
  street: faker.location.streetAddress(),
  ...props,
});

export const generateUserMock = (props?: Partial<User>): User => ({
  id: faker.string.uuid(),
  address: generateAddressMock(),  // Use dedicated generator
  ...props,
});
```

## Usage in Tests

```typescript
describe('Component', () => {
  const mockUser = generateUserMock({ name: 'Test' });  // At describe level

  it('renders', () => {
    render(<Profile user={mockUser} />);
  });
});
```

**Never in beforeEach** - use describe level or inside individual tests

## Usage with MSW

```typescript
import { mswGetFunc } from '@sygnum/sutils/basics/utils/msw.util';

mswServer.use(
  mswGetFunc({
    path: '/api/users/:id',
    status: 200,
    mock: ({ params }) => generateUserMock({ id: params.id as string })
  })
);
```
