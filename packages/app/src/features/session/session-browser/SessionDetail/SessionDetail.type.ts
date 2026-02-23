import type { Session } from '@nori/shared';

export interface SessionDetailProps {
  session: Session;
  error?: string;
  actionLoading?: boolean;
  onResume: () => void;
  onArchive: () => void;
  onBack: () => void;
}
