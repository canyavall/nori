import type { ClaudeSkill } from '@nori/shared';

export interface SkillCardProps {
  skill: ClaudeSkill;
  onSelect: () => void;
}
