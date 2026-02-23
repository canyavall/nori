import { createSignal, createMemo, onMount } from 'solid-js';
import type { ClaudeSkill } from '@nori/shared';
import { apiGet } from '../../../lib/api';
import { activeProject } from '../../../stores/navigation.store';

export const useSkillsSection = () => {
  const [skills, setSkills] = createSignal<ClaudeSkill[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [editingSkill, setEditingSkill] = createSignal<ClaudeSkill | null>(null);

  const projectPath = createMemo(() => {
    const p = activeProject();
    return p ? btoa(p.path) : '';
  });

  onMount(async () => {
    if (!projectPath()) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiGet<{ data: ClaudeSkill[] }>(
        `/api/project/claude/skills?projectPath=${projectPath()}`,
      );
      setSkills(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    }
    setLoading(false);
  });

  const handleSkillSaved = (updated: ClaudeSkill) => {
    setSkills((prev) => prev.map((s) => (s.name === updated.name ? updated : s)));
    setEditingSkill(null);
  };

  return {
    skills,
    loading,
    error,
    editingSkill,
    setEditingSkill,
    projectPath,
    handleSkillSaved,
  };
};
