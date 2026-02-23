export interface ContentEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onBack: () => void;
}
