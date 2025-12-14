# Sygnum Charts Basics

<!--
Migrated from: temp-FE-Mono/technical/sygnum-charts/sygnum-charts-basics.md
Migration date: 2025-12-08
Original category: technical/sygnum-charts
New category: patterns/sygnum/sygnum-charts
Source repo: temp-FE-Mono
-->

# Sygnum Charts - Basics

Data visualization with D3 charts.

## Core Components

```typescript
import { PieChart } from '@sygnum/sygnum-charts/components/PieChart';
import { ColumnChart } from '@sygnum/sygnum-charts/components/ColumnChart';
import { LineChart } from '@sygnum/sygnum-charts/components/LineChart';

// Pie chart
<PieChart
  data={pieData}
  width={400}
  height={400}
  colorScheme="category10"
/>

// Column chart
<ColumnChart
  data={columnData}
  width={600}
  height={400}
  xField="month"
  yField="value"
/>

// Line chart
<LineChart
  data={lineData}
  width={800}
  height={400}
  xField="date"
  yField="price"
/>
```

## Data Formats

```typescript
// Pie chart data
const pieData = [
  { label: 'Category A', value: 30 },
  { label: 'Category B', value: 45 },
  { label: 'Category C', value: 25 },
];

// Column/Bar chart data
const columnData = [
  { month: 'Jan', value: 100 },
  { month: 'Feb', value: 150 },
  { month: 'Mar', value: 120 },
];

// Line chart data
const lineData = [
  { date: '2024-01', price: 100 },
  { date: '2024-02', price: 110 },
  { date: '2024-03', price: 105 },
];
```
