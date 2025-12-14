# Sygnum Csv Patterns

<!--
Migrated from: temp-FE-Mono/technical/sygnum-csv/sygnum-csv-patterns.md
Migration date: 2025-12-08
Original category: technical/sygnum-csv
New category: patterns/sygnum/sygnum-csv
Source repo: temp-FE-Mono
-->

# Sygnum CSV - Patterns

Advanced patterns for CSV export.

## Data Transformation

Transform data before CSV generation:

- Flatten nested objects to flat key-value pairs
- Format dates and currencies
- Handle multi-type data routing
- Add summary/total rows

## PapaParse Options

Standard configuration used across the codebase:

```typescript
const commonOptions = {
  header: true,          // Include column headers
  delimiter: ',',        // CSV delimiter (comma)
  quotes: true,          // Quote values containing delimiter
  skipEmptyLines: true,  // Skip empty lines in output
};

downloadCsvFile({
  data: csvData,
  fileName: 'export.csv',
  options: commonOptions
});
```

## Performance Best Practices

- Memoize data transformations
- Disable during loading: `!data || isLoading || !data.length`
- For large datasets (>10k), consider chunking

## Testing

```typescript
jest.mock('@sygnum/csv/utils/downloadCsv.util', () => ({
  downloadCsvFile: jest.fn(),
}));

expect(downloadCsvFile).toHaveBeenCalledWith(
  expect.objectContaining({
    data: expectedData,
    fileName: 'transactions.csv',
  })
);
```

## Common Pitfalls

**Empty data arrays**
- Check `data.length` before enabling download

**Missing .csv extension**
- Always include `.csv` in fileName

**Not transforming data**
- Transform data to flat objects before CSV generation

**Hardcoded column names**
- Use i18n keys for column headers

**Not handling large datasets**
- Consider chunking for very large exports

**Missing delimiter configuration**
- Always specify `delimiter: ','` for consistency
