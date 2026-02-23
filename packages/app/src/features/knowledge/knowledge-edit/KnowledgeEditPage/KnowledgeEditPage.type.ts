export type PageStep = 'loading' | 'form' | 'progress' | 'audit' | 'error';

export interface KnowledgeEditPageProps {
  entryId: string;
  onBack: () => void;
}
