export interface DeleteConfirmationProps {
  entryTitle: string;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}
