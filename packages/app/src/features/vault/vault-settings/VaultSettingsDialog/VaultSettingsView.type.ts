import type { Vault } from '@nori/shared';

export interface VaultSettingsViewProps {
  vault: Vault;
  onDeleteClick: () => void;
  onClose: () => void;
}
