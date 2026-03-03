export interface EditFormProps {
  initialTitle: string;
  initialCategory: string;
  initialTags: string[];
  initialDescription: string;
  initialRequiredKnowledge: string[];
  initialRules: string[];
  initialContent: string;
  error?: string;
  onSave: (data: {
    title: string;
    category: string;
    tags: string[];
    description: string;
    required_knowledge: string[];
    rules: string[];
    content: string;
  }) => void;
  onCancel: () => void;
}
