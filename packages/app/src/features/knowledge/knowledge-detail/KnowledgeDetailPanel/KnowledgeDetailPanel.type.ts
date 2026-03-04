export interface KnowledgeDetailPanelProps {
  entryId: string;
  onSaved?: () => void;
  onDeleteSuccess?: () => void;
  onDeleted?: () => void;
}
