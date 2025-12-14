# Sygnum Table Pagination

<!--
Migrated from: temp-FE-Mono/technical/sygnum-table/sygnum-table-pagination.md
Migration date: 2025-12-08
Original category: technical/sygnum-table
New category: patterns/sygnum/sygnum-table
Source repo: temp-FE-Mono
-->

# Sygnum Table - Pagination & Filtering

Pagination, sorting, and filtering features.

## Pagination

```typescript
<SygnumTable
  data={data}
  columns={columns}
  pagination={{
    page: currentPage,
    pageSize: 10,
    total: totalItems,
    pageSizeOptions: [10, 25, 50, 100],
  }}
  onPageChange={(page) => setCurrentPage(page)}
  onPageSizeChange={(size) => setPageSize(size)}
/>
```

## Sorting

```typescript
const columns: TableColumn[] = [
  {
    id: 'name',
    headerName: 'Name',
    field: 'name',
    sortable: true,
  },
];

<SygnumTable
  columns={columns}
  data={data}
  sortConfig={{
    field: 'name',
    direction: 'asc',
  }}
  onSortChange={(field, direction) => handleSort(field, direction)}
/>
```

## Filtering

```typescript
const columns: TableColumn[] = [
  {
    id: 'status',
    headerName: 'Status',
    field: 'status',
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
  },
];

<SygnumTable
  columns={columns}
  data={data}
  filters={filters}
  onFilterChange={handleFilterChange}
/>
```

## Empty States

```typescript
<SygnumTable
  data={[]}
  columns={columns}
  emptyState={{
    title: t('table.empty.title'),
    description: t('table.empty.description'),
    icon: <EmptyIcon />,
  }}
/>
```
