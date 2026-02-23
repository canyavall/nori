import type { KnowledgeEntry } from '@nori/shared';

export interface CategoryTreeProps {
  categories: Record<string, KnowledgeEntry[]>;
  onEditEntry: (entryId: string) => void;
}
