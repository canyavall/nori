import type { Vault } from '@nori/shared';

export type PanelStep = 'status' | 'pulling' | 'results' | 'conflicts';

export interface VaultSyncPanelProps {
  vault: Vault;
  onClose: () => void;
}
