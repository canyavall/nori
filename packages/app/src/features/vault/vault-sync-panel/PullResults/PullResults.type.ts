export interface PullResultsProps {
  filesChanged: number;
  hasConflicts: boolean;
  warnings: string[];
  onDone: () => void;
  onViewConflicts?: () => void;
}
