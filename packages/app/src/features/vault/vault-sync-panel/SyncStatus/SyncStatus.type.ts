import type { Vault } from '@nori/shared';

export interface SyncStatusProps {
  vault: Vault;
  onPull: () => void;
  onPush: () => void;
  onClose: () => void;
}
