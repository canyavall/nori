# Sygnum Charts Performance

<!--
Migrated from: temp-FE-Mono/technical/sygnum-charts/sygnum-charts-performance.md
Migration date: 2025-12-08
Original category: technical/sygnum-charts
New category: patterns/sygnum/sygnum-charts
Source repo: temp-FE-Mono
-->

# Sygnum Charts - Performance

Performance optimization and accessibility.

## Performance Optimization

```typescript
// Use memoization for large datasets
const memoizedData = useMemo(() => prepareChartData(rawData), [rawData]);

<PieChart data={memoizedData} />

// Limit data points for better performance
const limitedData = data.slice(0, 100);

// Use loading states
{isLoading ? <ChartSkeleton /> : <ColumnChart data={data} />}
```

## Responsive Charts

```typescript
import { useScreenSize } from '@sygnum/suil/hooks';

const { isMobile } = useScreenSize();

<PieChart
  data={data}
  width={isMobile ? 300 : 600}
  height={isMobile ? 300 : 400}
/>
```

## Accessibility

```typescript
<PieChart
  data={data}
  ariaLabel="Portfolio distribution chart"
  ariaDescribedBy="chart-description"
/>
<div id="chart-description" hidden>
  Pie chart showing portfolio distribution across 5 asset classes
</div>
```

## Testing Charts

```typescript
import { render } from '@testing-library/react';

it('renders chart', () => {
  const { container } = render(<PieChart data={mockData} />);
  expect(container.querySelector('svg')).toBeInTheDocument();
});
```

## Common Pitfalls

- **Large datasets** - Limit to 100-200 data points
- **Missing dimensions** - Always provide width and height
- **No loading states** - Show skeleton while data loads
- **Hardcoded colors** - Use theme colors or color schemes
- **No accessibility** - Add aria labels and descriptions
