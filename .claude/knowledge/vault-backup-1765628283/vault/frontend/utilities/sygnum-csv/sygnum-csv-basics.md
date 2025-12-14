# Sygnum Csv Basics

<!--
Migrated from: temp-FE-Mono/technical/sygnum-csv/sygnum-csv-basics.md
Migration date: 2025-12-08
Original category: technical/sygnum-csv
New category: patterns/sygnum/sygnum-csv
Source repo: temp-FE-Mono
-->

# Sygnum CSV - Basics

CSV handling library for data export functionality.

## When to Use

- Exporting transaction data to CSV
- Downloading asset information as CSV files
- Transforming tabular data for CSV export
- Implementing data export features
- Creating downloadable reports

## downloadCsvFile

Primary utility for CSV downloads:

```typescript
import { downloadCsvFile } from '@sygnum/csv/utils/downloadCsv.util';

const handleDownloadCsv = useCallback(() => {
  const csvData = transformDataForCsv(rawData, columns);

  downloadCsvFile({
    data: csvData,
    fileName: 'transactions.csv',
    options: {
      header: true,
      delimiter: ',',
    },
  });
}, [rawData, columns]);
```

**Parameters:**
- `data: T[]` - Array of objects to convert to CSV
- `fileName: string` - Name with .csv extension
- `options?: UnparseConfig` - PapaParse configuration

## useCsvDownload Hook

Hook providing memoized CSV download functionality:

```typescript
import { useCsvDownload } from '@sygnum/csv/hooks/useCsvDownload';

const { onClick } = useCsvDownload({
  data: processedTransactions,
  fileName: 'digital-transactions.csv',
  options: { header: true }
});

return (
  <Button onClick={onClick} disabled={!data?.length}>
    Download CSV
  </Button>
);
```

**Returns:** `{ onClick: () => void }` - Memoized download callback

## CsvDownload Component

```typescript
import { CsvDownload } from '@sygnum/csv/components/CsvDownload';

<CsvDownload
  data={transformedData}
  fileName="assets-overview.csv"
  options={{ header: true, delimiter: ',' }}
>
  <IconButton color="primary">
    <DownloadIcon />
  </IconButton>
</CsvDownload>
```
