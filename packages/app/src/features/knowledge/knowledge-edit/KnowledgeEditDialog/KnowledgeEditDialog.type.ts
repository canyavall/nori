export type Step = 'loading' | 'editing' | 'saving' | 'done' | 'error';

export interface KnowledgeEditDialogProps {
  entryId: string;
  onClose: () => void;
}
