export interface ProjectPickerProps {
  vaultName: string;
  onSelect: (projectPath: string) => void;
  onBack: () => void;
}
