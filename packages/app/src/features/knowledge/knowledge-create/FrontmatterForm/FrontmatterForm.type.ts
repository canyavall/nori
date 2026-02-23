export interface FrontmatterFormProps {
  initialTitle: string;
  initialCategory: string;
  initialTags: string[];
  error?: string;
  onNext: (data: { title: string; category: string; tags: string[] }) => void;
  onCancel: () => void;
}
