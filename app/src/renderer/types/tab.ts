import type { Workspace } from './project';

export type KnowledgeBrowserMode = 'current' | 'all';

export interface TabState {
  id: string;
  workspace: Workspace | null;
  knowledgeBrowserMode: KnowledgeBrowserMode;
}
