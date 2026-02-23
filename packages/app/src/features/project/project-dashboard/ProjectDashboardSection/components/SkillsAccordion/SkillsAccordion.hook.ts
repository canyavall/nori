import { createSignal } from 'solid-js';
import type { Accessor } from 'solid-js';
import type { ClaudeSkill } from '@nori/shared';

export const useSkillsAccordion = (
  _skills: Accessor<ClaudeSkill[]>,
  _projectPath: Accessor<string>,
) => {
  const [open, setOpen] = createSignal(true);
  const [editingSkill, setEditingSkill] = createSignal<ClaudeSkill | null>(null);

  return { open, setOpen, editingSkill, setEditingSkill };
};
