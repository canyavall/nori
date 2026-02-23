import { createSignal, createMemo, onMount } from 'solid-js';
import type { ClaudeRule } from '@nori/shared';
import { apiGet, apiPut } from '../../../lib/api';
import { activeProject } from '../../../stores/navigation.store';

export const useRulesSection = () => {
  const [rules, setRules] = createSignal<ClaudeRule[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [selectedRule, setSelectedRule] = createSignal<ClaudeRule | null>(null);
  const [editorContent, setEditorContent] = createSignal('');
  const [saving, setSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal('');

  const projectPath = createMemo(() => {
    const p = activeProject();
    return p ? btoa(p.path) : '';
  });

  const rootRules = createMemo(() => rules().filter((r) => r.type === 'root'));
  const projectRules = createMemo(() => rules().filter((r) => r.type === 'project'));
  const modularRules = createMemo(() => rules().filter((r) => r.type === 'modular'));

  onMount(async () => {
    if (!projectPath()) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiGet<{ data: ClaudeRule[] }>(
        `/api/project/claude/rules?projectPath=${projectPath()}`,
      );
      setRules(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rules');
    }
    setLoading(false);
  });

  const handleSelect = async (rule: ClaudeRule) => {
    setSaveError('');
    try {
      const res = await apiGet<{ data: { relativePath: string; content: string; type: string } }>(
        `/api/project/claude/rules/${encodeURIComponent(rule.relativePath)}?projectPath=${projectPath()}`,
      );
      setEditorContent(res.data.content);
      setSelectedRule(rule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read rule');
    }
  };

  const handleBack = () => {
    setSelectedRule(null);
    setEditorContent('');
    setSaveError('');
  };

  const handleSave = async () => {
    const rule = selectedRule();
    if (!rule) return;

    setSaving(true);
    setSaveError('');
    try {
      await apiPut(
        `/api/project/claude/rules/${encodeURIComponent(rule.relativePath)}?projectPath=${projectPath()}`,
        { content: editorContent() },
      );
      setSelectedRule(null);
      setEditorContent('');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save rule');
    }
    setSaving(false);
  };

  return {
    rules,
    rootRules,
    projectRules,
    modularRules,
    loading,
    error,
    selectedRule,
    editorContent,
    setEditorContent,
    saving,
    saveError,
    handleSelect,
    handleBack,
    handleSave,
  };
};
