import type { Session } from '@nori/shared';

export interface SessionListProps {
  sessions: Session[];
  onSelect: (session: Session) => void;
  onCreateNew: () => void;
  createDisabled?: boolean;
}
