import { createSignal } from 'solid-js';
import type { Accessor } from 'solid-js';
import type { ClaudeMcpServer } from '@nori/shared';
import { apiPut } from '../../../../../../lib/api';

export const useMcpsAccordion = (
  servers: Accessor<ClaudeMcpServer[]>,
  rawContent: Accessor<string>,
  projectPath: Accessor<string>,
) => {
  const [open, setOpen] = createSignal(true);
  const [editing, setEditing] = createSignal(false);
  const [editorContent, setEditorContent] = createSignal('');
  const [localServers, setLocalServers] = createSignal<ClaudeMcpServer[]>(servers() ?? []);
  const [saving, setSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal('');

  const handleOpenEdit = () => {
    setEditorContent(rawContent() || '{\n  "mcpServers": {}\n}');
    setSaveError('');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await apiPut<{ data: { servers: ClaudeMcpServer[] } }>(
        `/api/project/claude/mcps?projectPath=${projectPath()}`,
        { content: editorContent() },
      );
      setLocalServers(res.data.servers);
      setEditing(false);
      setEditorContent('');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save MCPs');
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditorContent('');
    setSaveError('');
  };

  return {
    open,
    setOpen,
    editing,
    editorContent,
    setEditorContent,
    localServers,
    saving,
    saveError,
    handleOpenEdit,
    handleSave,
    handleCancel,
  };
};
