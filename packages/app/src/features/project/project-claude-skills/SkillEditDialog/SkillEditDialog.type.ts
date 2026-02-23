import type { ClaudeSkill } from '@nori/shared';

export interface SkillEditDialogProps {
  skill: ClaudeSkill;
  allSkills: ClaudeSkill[];
  projectPath: string;
  onClose: () => void;
  onSaved: (updated: ClaudeSkill) => void;
}
