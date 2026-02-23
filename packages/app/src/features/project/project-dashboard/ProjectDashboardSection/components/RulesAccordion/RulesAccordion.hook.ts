import { createSignal } from 'solid-js';
import type { Accessor } from 'solid-js';
import type { ClaudeRule } from '@nori/shared';
import { apiGet, apiPut } from '../../../../../../lib/api';

export const useRulesAccordion = (
  _rules: Accessor<ClaudeRule[]>,
  projectPath: Accessor<string>,
) => {
  const [open, setOpen] = createSignal(true);
  const [editing, setEditing] = createSignal<ClaudeRule | null>(null);
  const [content, setContent] = createSignal('');
  const [saving, setSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal('');

  const handleEdit = async (rule: ClaudeRule) => {
    setSaveError('');
    try {
      const res = await apiGet<{ data: { relativePath: string; content: string; type: string } }>(
        `/api/project/claude/rules/${encodeURIComponent(rule.relativePath)}?projectPath=${projectPath()}`,
      );
      setContent(res.data.content);
      setEditing(rule);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to load rule');
    }
  };

  const handleSave = async () => {
    const rule = editing();
    if (!rule) return;
    setSaving(true);
    setSaveError('');
    try {
      await apiPut(
        `/api/project/claude/rules/${encodeURIComponent(rule.relativePath)}?projectPath=${projectPath()}`,
        { content: content() },
      );
      setEditing(null);
      setContent('');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save rule');
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditing(null);
    setContent('');
    setSaveError('');
  };

  return { open, setOpen, editing, content, setContent, saving, saveError, handleEdit, handleSave, handleCancel };
};
