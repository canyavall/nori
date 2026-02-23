export interface KnowledgePreviewProps {
  title: string;
  category: string;
  tags: string[];
  content: string;
  onConfirm: () => void;
  onEdit: () => void;
}
