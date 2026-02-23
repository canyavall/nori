import type { Vault } from '@nori/shared';

export type ExportStep = 'pick' | 'exporting' | 'done' | 'error';

export interface VaultKnowledgeExportDialogProps {
  vault: Vault;
  onClose: () => void;
}
