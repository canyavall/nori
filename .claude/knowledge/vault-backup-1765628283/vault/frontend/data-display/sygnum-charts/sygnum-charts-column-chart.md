# Sygnum Charts Column Chart

<!--
Migrated from: temp-FE-Mono/technical/sygnum-charts/sygnum-charts-column-chart.md
Migration date: 2025-12-08
Original category: technical/sygnum-charts
New category: patterns/sygnum/sygnum-charts
Source repo: temp-FE-Mono
-->

# Sygnum Charts - Column Chart

Column and bar chart components.

## Column Chart

```typescript
import { ColumnChart } from '@sygnum/sygnum-charts/components/ColumnChart';

<ColumnChart
  data={data}
  width={600}
  height={400}
  xField="category"
  yField="value"
  colorScheme="category10"
  showGrid
  showAxis
/>
```

## Bar Chart (Horizontal)

```typescript
<ColumnChart
  data={data}
  orientation="horizontal"
  xField="value"
  yField="category"
/>
```

## Grouped Column Chart

```typescript
const groupedData = [
  { month: 'Jan', sales: 100, expenses: 80 },
  { month: 'Feb', sales: 120, expenses: 90 },
];

<ColumnChart
  data={groupedData}
  xField="month"
  yFields={['sales', 'expenses']}
  grouped
  legendLabels={['Sales', 'Expenses']}
/>
```

## Stacked Column Chart

```typescript
<ColumnChart
  data={groupedData}
  xField="month"
  yFields={['sales', 'expenses']}
  stacked
/>
```

## Formatting

```typescript
<ColumnChart
  data={data}
  xField="month"
  yField="value"
  yAxisFormat={(value) => `$${value}K`}
  tooltipFormat={(d) => `${d.category}: $${d.value}`}
/>
```
