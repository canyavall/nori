export interface VaultTypePickerProps {
  onSelect: (type: 'git' | 'local') => void;
  onCancel: () => void;
}
