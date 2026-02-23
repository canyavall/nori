import type { ClaudeRule } from '@nori/shared';

export interface RuleCardProps {
  rule: ClaudeRule;
  onSelect: () => void;
}
