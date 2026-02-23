import type { Vault } from '@nori/shared';

export type WizardStep = 'vault-picker' | 'project-picker' | 'progress' | 'confirmation';

export interface VaultLinkProjectDialogProps {
  onClose: () => void;
}
