# Sygnum Table Cells

<!--
Migrated from: temp-FE-Mono/technical/sygnum-table/sygnum-table-cells.md
Migration date: 2025-12-08
Original category: technical/sygnum-table
New category: patterns/sygnum/sygnum-table
Source repo: temp-FE-Mono
-->

# Sygnum Table - Cell Components

39 specialized cell types for different data displays.

## Cell Types

```typescript
// Currency
{ cellType: 'currency', currency: 'CHF' }

// Date
{ cellType: 'date', dateFormat: 'dd/MM/yyyy' }

// Status badge
{ cellType: 'status', statusMap: { active: 'success', inactive: 'error' } }

// Action buttons
{ cellType: 'actions', actions: [
  { label: 'Edit', onClick: handleEdit },
  { label: 'Delete', onClick: handleDelete },
]}

// Link
{ cellType: 'link', href: (row) => `/details/${row.id}` }

// Custom render
{
  renderCell: (row) => (
    <CustomComponent data={row} />
  )
}
```

## Common Cell Types

- **currency**: Format amounts with currency symbols
- **date**: Format dates with custom patterns
- **status**: Display status badges with colors
- **actions**: Action buttons (edit, delete, view)
- **link**: Clickable links to details pages
- **boolean**: Yes/No or checkmarks
- **tag**: Display tags or labels
- **avatar**: User avatars with initials
