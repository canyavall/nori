export interface EditFormProps {
  initialTitle: string;
  initialCategory: string;
  initialTags: string[];
  initialContent: string;
  error?: string;
  onSave: (data: { title: string; category: string; tags: string[]; content: string }) => void;
  onCancel: () => void;
}
