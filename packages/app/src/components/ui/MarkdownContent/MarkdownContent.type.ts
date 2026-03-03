export type ContentViewMode = 'markdown' | 'text';

export interface MarkdownContentProps {
  content: string;
  viewMode: ContentViewMode;
}
