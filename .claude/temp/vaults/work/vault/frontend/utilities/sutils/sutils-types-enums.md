# Sutils Types and Enums

Common type definitions and enums used throughout Sygnum frontend.

## FCC Type

**Functional Component with Children** - most common component type pattern.

```typescript
import type { FCC } from '@sygnum/sutils/basics/types/sutils.type';

// Component that accepts children
const Layout: FCC<{ title: string }> = ({ title, children }) => (
  <div>
    <h1>{title}</h1>
    {children}
  </div>
);

// vs standard FC (no children)
import type { FC } from 'react';
const Button: FC<{ label: string }> = ({ label }) => <button>{label}</button>;
```

**Use FCC when:** Component needs to render children (layouts, wrappers, providers)
**Use FC when:** Component doesn't accept children (buttons, inputs, icons)

## BinaryQuestion Enum

Yes/No questions in forms and questionnaires.

```typescript
import { BinaryQuestion } from '@sygnum/sutils/basics/enums/common.enum';
import { mapToBinaryQuestion, convertBinaryQuestionToBoolean } from '@sygnum/sutils/basics/utils/common.util';

// Enum values
BinaryQuestion.yes  // 'yes'
BinaryQuestion.no   // 'no'

// Convert boolean to BinaryQuestion
const question = mapToBinaryQuestion(true);  // BinaryQuestion.yes

// Convert BinaryQuestion to boolean
const bool = convertBinaryQuestionToBoolean(BinaryQuestion.yes); // true

// Form validation
const schema = yup.object({
  hasExperience: yup.mixed<BinaryQuestion>()
    .oneOf(Object.values(BinaryQuestion))
    .required(),
});
```

## ListOrders Enum

Sorting direction for tables and lists.

```typescript
import { ListOrders } from '@sygnum/sutils/basics/enums/common.enum';
import { getComparator } from '@sygnum/sutils/basics/utils/common.util';

// Sort table data
const sorted = tableData
  .sort(getComparator(ListOrders.desc, 'createdAt'))
  .slice(startIndex, endIndex);

// Enum values
ListOrders.asc   // 'asc'
ListOrders.desc  // 'desc'
```

## RoundingModes Enum

Number rounding strategies for financial calculations.

```typescript
import { RoundingModes } from '@sygnum/sutils/basics/enums/roundingModes.enum';

// Use with roundNumber
const fee = roundNumber(amount, {
  roundingMode: RoundingModes.trunc,  // Truncate (no rounding)
});

// Available modes
RoundingModes.halfExpand  // Default: round half up
RoundingModes.trunc       // Truncate decimals
RoundingModes.floor       // Round down
RoundingModes.ceil        // Round up
```

## Common Type Patterns

```typescript
// Component with children
const Wrapper: FCC<{ className?: string }> = ({ className, children }) => (
  <div className={className}>{children}</div>
);

// Binary question form field
const [hasExperience, setHasExperience] = useState<BinaryQuestion>();

// Table sorting
const [order, setOrder] = useState<ListOrders>(ListOrders.asc);

// Financial rounding
roundNumber(value, { roundingMode: RoundingModes.trunc });
```

## When to Use

- **FCC**: Any component that wraps children (widespread)
- **BinaryQuestion**: Yes/No form fields, questionnaires
- **ListOrders**: Table sorting, data ordering
- **RoundingModes**: Financial calculations requiring specific rounding
