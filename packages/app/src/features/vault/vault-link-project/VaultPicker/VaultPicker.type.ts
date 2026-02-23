import type { Vault } from '@nori/shared';

export interface VaultPickerProps {
  vaults: Vault[];
  onSelect: (vaultId: string) => void;
  onCancel: () => void;
}
