import type { KnowledgeProposal } from '@nori/shared';

export type RepoExtractState = 'scanning' | 'conversation' | 'review' | 'saving' | 'done' | 'error';

export interface RepoExtractDialogProps {
  projectPath: string;
  vaultId: string;
  onClose: () => void;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface EditableProposal extends KnowledgeProposal {
  included: boolean;
  tagsInput: string;
  requiredKnowledgeInput: string;
  rulesInput: string;
  optionalKnowledgeInput: string;
}
