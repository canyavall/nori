import type { KnowledgeProposal } from '@nori/shared';

export type Step = 'prompt' | 'generating' | 'review' | 'saving' | 'done';

export interface KnowledgeCreateDialogProps {
  vaultId: string;
}

export interface EditableProposal extends KnowledgeProposal {
  included: boolean;
  tagsInput: string;
}
