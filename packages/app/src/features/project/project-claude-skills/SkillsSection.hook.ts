import { createSignal, createMemo, onMount } from 'solid-js';
import type { ClaudeSkill } from '@nori/shared';
import { apiGet, apiPut } from '../../../lib/api';
import { activeProject } from '../../../stores/navigation.store';

export const useSkillsSection = () => {
  const [skills, setSkills] = createSignal<ClaudeSkill[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [selectedSkill, setSelectedSkill] = createSignal<ClaudeSkill | null>(null);
  const [editorContent, setEditorContent] = createSignal('');
  const [saving, setSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal('');

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

  const handleSelect = async (skill: ClaudeSkill) => {
    setSaveError('');
    try {
      const res = await apiGet<{ data: { name: string; content: string; path: string } }>(
        `/api/project/claude/skills/${skill.name}?projectPath=${projectPath()}`,
      );
      setEditorContent(res.data.content);
      setSelectedSkill(skill);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read skill');
    }
  };

  const handleBack = () => {
    setSelectedSkill(null);
    setEditorContent('');
    setSaveError('');
  };

  const handleSave = async () => {
    const skill = selectedSkill();
    if (!skill) return;

    setSaving(true);
    setSaveError('');
    try {
      const res = await apiPut<{ data: ClaudeSkill }>(
        `/api/project/claude/skills/${skill.name}?projectPath=${projectPath()}`,
        { content: editorContent() },
      );
      setSkills((prev) =>
        prev.map((s) => (s.name === skill.name ? res.data : s)),
      );
      setSelectedSkill(null);
      setEditorContent('');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save skill');
    }
    setSaving(false);
  };

  return {
    skills,
    loading,
    error,
    selectedSkill,
    editorContent,
    setEditorContent,
    saving,
    saveError,
    handleSelect,
    handleBack,
    handleSave,
  };
};
