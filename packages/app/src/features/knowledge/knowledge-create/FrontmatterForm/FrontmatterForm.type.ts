export interface FrontmatterFormProps {
  initialTitle: string;
  initialCategory: string;
  initialTags: string[];
  initialDescription: string;
  initialRequiredKnowledge: string[];
  initialRules: string[];
  initialOptionalKnowledge?: string[];
  error?: string;
  onNext: (data: {
    title: string;
    category: string;
    tags: string[];
    description: string;
    required_knowledge: string[];
    rules: string[];
    optional_knowledge?: string[];
  }) => void;
  onCancel: () => void;
}
