# Sutils Hooks

Custom React hooks providing reusable functionality. Use these instead of implementing from scratch.

## useDebounce

**62 usages across 30 files** - delays value updates for search inputs and filters.

```typescript
import { useDebounce } from '@sygnum/sutils/hooks/useDebounce';

const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300); // 300ms delay

  useEffect(() => {
    if (debouncedSearch) {
      performSearch(debouncedSearch); // Only triggers after 300ms inactivity
    }
  }, [debouncedSearch]);
};
```

**Real usage from TradingPairsTable:**
```typescript
const [filterValues, setFilterValues] = useState(INITIAL_FILTER_VALUES);
const debouncedFilters = useDebounce(filterValues, 200);

const { data } = useGetTradingPairs({
  ...debouncedFilters,
  tradingPair: debouncedFilters.tradingPair?.trim(),
});
```

## Other Common Hooks

```typescript
// usePreviousValue - Track previous value for comparison
import { usePreviousValue } from '@sygnum/sutils/hooks/usePreviousValue';
const previousId = usePreviousValue(userId);
if (previousId !== userId) fetchData(userId);

// useConst - Create constant objects (never recreate)
import { useConst } from '@sygnum/sutils/hooks/useConst';
const config = useConst(() => ({ timeout: 5000, cache: new Map() }));

// useCopyToClipboard - Copy with feedback
import { useCopyToClipboard } from '@sygnum/sutils/hooks/useCopyToClipboard';
const { copy, isCopied } = useCopyToClipboard();
<Button onClick={() => copy(address)}>{isCopied ? 'Copied!' : 'Copy'}</Button>

// useMounted - Prevent updates on unmounted components
import { useMounted } from '@sygnum/sutils/hooks/useMounted';
const data = await api.get();
if (isMounted()) setState(data);

// useContainerDimensions - Responsive component sizing
import { useContainerDimensions } from '@sygnum/sutils/hooks/useContainerDimensions';
const [ref, { width, height }] = useContainerDimensions();
```

## Common Patterns

```typescript
// Debounced table filters
const debouncedFilters = useDebounce(filters, 200);

// Track previous page for comparison
const previousPage = usePreviousValue(currentPage);

// Constant configuration object
const apiConfig = useConst(() => ({ baseURL: '...' }));

// Safe async operations
const isMounted = useMounted();
if (isMounted()) setState(data);

// Copy with feedback
const { copy, isCopied } = useCopyToClipboard();
```

## When to Use

- **useDebounce**: Search inputs, filters, any rapid value changes
- **usePreviousValue**: Change detection, comparison with previous value
- **useConst**: Heavy objects, Maps, Sets that should never recreate
- **useCopyToClipboard**: Wallet addresses, transaction IDs, API keys
- **useMounted**: Async operations that update state
- **useContainerDimensions**: Responsive layouts, dynamic sizing
