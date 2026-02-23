import type { Vault } from '@nori/shared';

export type PanelStep = 'status' | 'pulling' | 'results' | 'conflicts' | 'push_results';

export interface VaultSyncPanelProps {
  vault: Vault;
  onClose: () => void;
}
