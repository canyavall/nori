export interface DiffViewProps {
  original: string;
  suggested: string;
  onApply: () => void;
  onDismiss: () => void;
}

export type DiffLineKind = 'unchanged' | 'added' | 'removed';

export interface DiffLine {
  kind: DiffLineKind;
  text: string;
}
