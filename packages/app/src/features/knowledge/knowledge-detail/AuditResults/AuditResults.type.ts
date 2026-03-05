import type { KnowledgeLlmAuditResult } from '@nori/shared';

export interface AuditResultsProps {
  result: KnowledgeLlmAuditResult;
  onApplySuggestions: () => void;
  onDismiss: () => void;
}
