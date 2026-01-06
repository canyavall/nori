# Sygnum Table Basics

<!--
Migrated from: temp-FE-Mono/technical/sygnum-table/sygnum-table-basics.md
Migration date: 2025-12-08
Original category: technical/sygnum-table
New category: patterns/sygnum/sygnum-table
Source repo: temp-FE-Mono
-->

# Sygnum Table - Basics

Table and data grid with sorting, filtering, and pagination.

## When to Use

- Displaying tabular data
- Implementing sorting and filtering
- Configuring pagination controls
- Using custom cell renderers

## Core Components

```typescript
import { SygnumTable } from '@sygnum/sygnum-table/components/SygnumTable';
import { TableColumn } from '@sygnum/sygnum-table/types';

const columns: TableColumn<DataType>[] = [
  {
    id: 'name',
    headerName: t('table.headers.name'),
    field: 'name',
    sortable: true,
    filterable: true,
  },
  {
    id: 'amount',
    headerName: t('table.headers.amount'),
    field: 'amount',
    cellType: 'currency',
    currency: 'CHF',
  },
];

<SygnumTable
  columns={columns}
  data={data}
  isLoading={isLoading}
  pagination={{
    page: 0,
    pageSize: 10,
    total: 100,
  }}
  onPageChange={handlePageChange}
/>
```

## Column Definition

```typescript
interface TableColumn<T> {
  id: string;
  headerName: string;
  field: keyof T | string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  cellType?: CellType;
  renderCell?: (row: T) => ReactNode;
}
```
