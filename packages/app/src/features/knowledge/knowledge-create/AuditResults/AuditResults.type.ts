export interface AuditResultsProps {
  entryId: string;
  filePath: string;
  warnings: string[];
  onContinue: () => void;
}
