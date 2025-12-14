# Sygnum Table Patterns

<!--
Migrated from: temp-FE-Mono/technical/sygnum-table/sygnum-table-patterns.md
Migration date: 2025-12-08
Original category: technical/sygnum-table
New category: patterns/sygnum/sygnum-table
Source repo: temp-FE-Mono
-->

# Sygnum Table - Patterns

Advanced table patterns and features.

## Collapsible Rows

```typescript
<SygnumTable
  columns={columns}
  data={data}
  expandable={{
    expandedRowRender: (row) => <ExpandedContent data={row} />,
    rowExpandable: (row) => row.hasDetails,
  }}
/>
```

## Layout Modes

```typescript
// Compact mode
<SygnumTable size="compact" {...props} />

// Comfortable mode (default)
<SygnumTable size="comfortable" {...props} />

// Spacious mode
<SygnumTable size="spacious" {...props} />
```

## Selection

```typescript
<SygnumTable
  columns={columns}
  data={data}
  selectable
  selectedRows={selectedRows}
  onSelectionChange={(rows) => setSelectedRows(rows)}
/>
```

## Loading States

```typescript
<SygnumTable
  columns={columns}
  data={data}
  isLoading={isLoading}
  loadingRowCount={10}
/>
```

## Sticky Headers

```typescript
<SygnumTable
  columns={columns}
  data={data}
  stickyHeader
  maxHeight="500px"
/>
```
