import type { Vault } from '@nori/shared';

export type ImportStep = 'pick' | 'importing' | 'done' | 'error';

export interface VaultKnowledgeImportDialogProps {
  vault: Vault;
  onClose: () => void;
}
