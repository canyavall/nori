import { createSignal } from 'solid-js';
import type { Accessor } from 'solid-js';
import type { ClaudeMdFile } from '@nori/shared';
import { apiGet, apiPut } from '../../../../../../lib/api';

export const useClaudeMdsAccordion = (
  _files: Accessor<ClaudeMdFile[]>,
  projectPath: Accessor<string>,
) => {
  const [open, setOpen] = createSignal(true);
  const [editing, setEditing] = createSignal<ClaudeMdFile | null>(null);
  const [content, setContent] = createSignal('');
  const [saving, setSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal('');

  const handleEdit = async (file: ClaudeMdFile) => {
    setSaveError('');
    try {
      const res = await apiGet<{ data: { relativePath: string; content: string; type: string } }>(
        `/api/project/claude/rules/${encodeURIComponent(file.relativePath)}?projectPath=${projectPath()}`,
      );
      setContent(res.data.content);
      setEditing(file);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to load CLAUDE.md');
    }
  };

  const handleSave = async () => {
    const file = editing();
    if (!file) return;
    setSaving(true);
    setSaveError('');
    try {
      await apiPut(
        `/api/project/claude/rules/${encodeURIComponent(file.relativePath)}?projectPath=${projectPath()}`,
        { content: content() },
      );
      setEditing(null);
      setContent('');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save CLAUDE.md');
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
