import type { KnowledgeEntry } from '@nori/shared';

export type WizardStep = 'confirmation' | 'progress' | 'result';

export interface KnowledgeDeleteDialogProps {
  entry: KnowledgeEntry;
  onClose: () => void;
}
