# Sygnum Charts Pie Chart

<!--
Migrated from: temp-FE-Mono/technical/sygnum-charts/sygnum-charts-pie-chart.md
Migration date: 2025-12-08
Original category: technical/sygnum-charts
New category: patterns/sygnum/sygnum-charts
Source repo: temp-FE-Mono
-->

# Sygnum Charts - Pie Chart

Pie and donut chart components.

## Basic Pie Chart

```typescript
import { PieChart } from '@sygnum/sygnum-charts/components/PieChart';

<PieChart
  data={data}
  width={400}
  height={400}
  innerRadius={0}  // 0 for pie, > 0 for donut
  outerRadius={180}
  colorScheme="category10"
  showLabels
  showLegend
/>
```

## Donut Chart

```typescript
<PieChart
  data={data}
  innerRadius={100}  // Creates donut hole
  outerRadius={180}
  centerText="Total: $1M"
/>
```

## Customization

```typescript
<PieChart
  data={data}
  colorScheme="custom"
  customColors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
  labelFormat={(value) => `${value}%`}
  tooltipFormat={(d) => `${d.label}: $${d.value}`}
  onSliceClick={(slice) => console.log(slice)}
/>
```

## With Legend

```typescript
<PieChart
  data={data}
  showLegend
  legendPosition="right"
  legendWidth={150}
/>
```
