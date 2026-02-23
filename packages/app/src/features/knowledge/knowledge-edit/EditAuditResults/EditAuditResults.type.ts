export interface EditAuditResultsProps {
  entryId: string;
  filePath: string;
  warnings: string[];
  onDone: () => void;
}
