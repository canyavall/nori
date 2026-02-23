export interface KnowledgePreviewProps {
  title: string;
  category: string;
  tags: string[];
  description: string;
  required_knowledge: string[];
  rules: string[];
  optional_knowledge?: string[];
  content: string;
  onConfirm: () => void;
  onEdit: () => void;
}
