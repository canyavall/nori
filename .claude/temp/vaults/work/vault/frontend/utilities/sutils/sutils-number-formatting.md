# Sutils Number Formatting

Number and currency formatting utilities from `@sygnum/sutils`. Use these instead of native Intl API.

## Primary Utility: roundNumber

**Most used (129 usages across 44 files)** - handles all number/currency formatting.

```typescript
import { roundNumber } from '@sygnum/sutils/basics/utils/number.util';
import { CURRENCY_DECIMALS_FOR_DISPLAY } from '@sygnum/sutils/basics/constants/decimals.constant';

// Currency formatting
const price = roundNumber(1234.567, {
  maximumFractionDigits: CURRENCY_DECIMALS_FOR_DISPLAY, // 2
  useGrouping: true,
  disableLocalization: false,
});
// Result: "1,234.57" (locale-aware)

// Percentage formatting
const percent = roundNumber(12.3456, {
  maximumFractionDigits: 2,
  useGrouping: false,
});
// Result: "12.35"

// Asset/crypto formatting (more decimals)
const crypto = roundNumber(0.00012345, {
  minimumFractionDigits: 8,
  maximumFractionDigits: 8,
  disableLocalization: true,
});
// Result: "0.00012345"
```

### roundNumber Options

```typescript
interface RoundNumberOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;          // Thousand separators
  disableLocalization?: boolean;  // Force en-US format
  roundingMode?: RoundingModes;   // Default: halfExpand
}
```

## formatForDisplayingWithPlaceholder

Safe display formatting with fallback for undefined/null values.

```typescript
import { formatForDisplayingWithPlaceholder } from '@sygnum/sutils/basics/utils/common.util';
import BigNumber from 'bignumber.js';

// With BigNumber
const display = formatForDisplayingWithPlaceholder(
  new BigNumber('1234.567890'),
  {
    prefix: 'CHF',
    shouldStripTrailingZeros: true,
    maximumFractionDigits: 4,
  }
);
// Result: "CHF 1234.5679" or "-" if undefined

// Without value
const empty = formatForDisplayingWithPlaceholder(undefined, {
  prefix: '$',
});
// Result: "-"
```

## formatNumberWithoutRounding

Truncates decimals without rounding.

```typescript
import { formatNumberWithoutRounding } from '@sygnum/sutils/basics/utils/number.util';

formatNumberWithoutRounding(1234.5678, 2); // "1234.56" (truncated)
```

## Real Codebase Examples

```typescript
// Trading: Percentage display
const formatted = roundNumber(+item.performance, {
  maximumFractionDigits: 2,
  useGrouping: false,
});

// Fees: Network fee with truncation
const fee = roundNumber(Number(amount), {
  maximumFractionDigits: MAXIMUM_ASSET_DECIMALS_FOR_DISPLAY,
  roundingMode: RoundingModes.trunc,
});

// Assets: Safe display with fallback
const display = formatForDisplayingWithPlaceholder(asset.balance, {
  shouldStripTrailingZeros: true,
  maximumFractionDigits: 8,
});
```

## Common Constants

```typescript
import { CURRENCY_DECIMALS_FOR_DISPLAY } from '@sygnum/sutils/basics/constants/decimals.constant';
// CURRENCY_DECIMALS_FOR_DISPLAY = 2
// MAXIMUM_ASSET_DECIMALS_FOR_DISPLAY = 8
```

## When to Use What

- **Currency**: `roundNumber` with `CURRENCY_DECIMALS_FOR_DISPLAY` (2)
- **Crypto/assets**: `roundNumber` with `MAXIMUM_ASSET_DECIMALS_FOR_DISPLAY` (8)
- **Safe display**: `formatForDisplayingWithPlaceholder` (handles undefined)
- **Truncation**: `formatNumberWithoutRounding`
