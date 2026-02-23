import { createSignal, onMount } from 'solid-js';
import type { ClaudeSkill } from '@nori/shared';
import { apiGet, apiPut } from '../../../../lib/api';

export const useSkillEditDialog = (
  skill: () => ClaudeSkill,
  projectPath: () => string,
  onSaved: (updated: ClaudeSkill) => void,
  onClose: () => void,
) => {
  const [content, setContent] = createSignal('');
  const [loading, setLoading] = createSignal(true);
  const [loadError, setLoadError] = createSignal('');
  const [saving, setSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal('');

  onMount(async () => {
    try {
      const res = await apiGet<{ data: { name: string; content: string; path: string } }>(
        `/api/project/claude/skills/${skill().name}?projectPath=${projectPath()}`,
      );
      setContent(res.data.content);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load skill');
    }
    setLoading(false);
  });

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await apiPut<{ data: ClaudeSkill }>(
        `/api/project/claude/skills/${skill().name}?projectPath=${projectPath()}`,
        { content: content() },
      );
      onSaved(res.data);
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save skill');
    }
    setSaving(false);
  };

  return {
    content,
    setContent,
    loading,
    loadError,
    saving,
    saveError,
    handleSave,
  };
};
