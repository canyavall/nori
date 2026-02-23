import type { Vault } from '@nori/shared';

export interface VaultCardProps {
  vault: Vault;
  isSelected: boolean;
  onSelect: () => void;
  onLinkProject: (e: MouseEvent) => void;
  onSync: (e: MouseEvent) => void;
  syncOpen: boolean;
}
