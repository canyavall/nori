import type { Vault } from '@nori/shared';

export interface VaultSettingsDialogProps {
  vault: Vault;
  onClose: () => void;
}

export type SettingsStep = 'settings' | 'enter-name' | 'confirm' | 'progress';
