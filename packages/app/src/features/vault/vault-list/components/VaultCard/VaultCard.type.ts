import type { Vault } from '@nori/shared';

export interface VaultCardProps {
  vault: Vault;
  onNavigate: () => void;
  onSync: (e: MouseEvent) => void;
  syncOpen: boolean;
}
