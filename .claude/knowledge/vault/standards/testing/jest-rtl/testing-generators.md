# Test Data: Generators

Factory patterns and generator conventions for creating realistic, maintainable test data.

## Convention

**Location**: `libs/sygnum-dto/dto-*/src/generators/` or component-specific `/generators/` folders

**Naming**: `generate[TypeName]Mock(props?: Partial<Type>): Type`

**Pattern**:
```typescript
import { faker } from '@faker-js/faker';
import { UserDto } from '../types/user.type';

export const generateUserDtoMock = (props?: Partial<UserDto>): UserDto => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  createdAt: String(faker.date.past()),
  ...props,  // Allow selective overrides
});
```

## Usage

```typescript
import { generateUserDtoMock } from '@sygnum/sygnum-dto/dto-core';

// Basic usage
const user = generateUserDtoMock();

// Selective override
const blockedUser = generateUserDtoMock({ isBlocked: true, status: 'blocked' });

// Generating arrays
const users = Array.from({ length: 5 }, () => generateUserDtoMock());

// Related data with matching IDs
const authors = Array.from({ length: 3 }, (_, i) => generateAuthorDtoMock({ id: `author-${i}` }));
const books = Array.from({ length: 10 }, (_, i) =>
  generateBookDtoMock({ authorId: `author-${i % 3}` })
);
```

## When to Create Generators

**Create generator when**:
- DTO/type used in 3+ test files
- Complex nested structure (5+ fields)
- Data shape changes frequently

**Don't create generator for**:
- Simple 1-2 field objects
- One-off test-specific data
- Data used in single test file

## Best Practices

**Deterministic data**: Use `faker.seed(12345)` in `beforeEach` for predictable test data.

**Compose generators** for nested structures:
```typescript
export const generateClientDtoMock = (props?: Partial<ClientDto>): ClientDto => ({
  clientId: faker.string.numeric({ length: { min: 1, max: 10 } }),
  clientData: [generateClientDataDtoMock()],  // Compose nested
  address: generateAddressDtoMock(),
  ...props,
});
```

## Common Violations

```typescript
// ❌ Inline mock creation
const user = { id: '123', email: 'test@example.com' };

// ✅ Use generator
const user = generateUserDtoMock({ email: 'test@example.com' });

// ❌ Generator for simple data - use faker directly
const id = faker.string.uuid();
```

## Finding Generators

Search: `rg "generate.*ClientDto.*Mock" --type ts` or check `libs/sygnum-dto/dto-*/src/generators/`

## Related Knowledge

- `testing-unique-ids` - ID generation patterns
- `testing-quick-checklist` - Data management checks
