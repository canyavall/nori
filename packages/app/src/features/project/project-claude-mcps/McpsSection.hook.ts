import { createSignal, createMemo, onMount } from 'solid-js';
import type { ClaudeMcpServer } from '@nori/shared';
import { apiGet, apiPut } from '../../../lib/api';
import { activeProject } from '../../../stores/navigation.store';

export const useMcpsSection = () => {
  const [servers, setServers] = createSignal<ClaudeMcpServer[]>([]);
  const [rawContent, setRawContent] = createSignal('');
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [editing, setEditing] = createSignal(false);
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
      const res = await apiGet<{ data: { servers: ClaudeMcpServer[]; raw: string } }>(
        `/api/project/claude/mcps?projectPath=${projectPath()}`,
      );
      setServers(res.data.servers);
      setRawContent(res.data.raw);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load MCPs');
    }
    setLoading(false);
  });

  const handleEdit = () => {
    setEditorContent(rawContent() || '{\n  "mcpServers": {}\n}');
    setEditing(true);
    setSaveError('');
  };

  const handleCancel = () => {
    setEditing(false);
    setEditorContent('');
    setSaveError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await apiPut<{ data: { servers: ClaudeMcpServer[] } }>(
        `/api/project/claude/mcps?projectPath=${projectPath()}`,
        { content: editorContent() },
      );
      setServers(res.data.servers);
      setRawContent(editorContent());
      setEditing(false);
      setEditorContent('');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save MCPs');
    }
    setSaving(false);
  };

  return {
    servers,
    loading,
    error,
    editing,
    editorContent,
    setEditorContent,
    saving,
    saveError,
    handleEdit,
    handleCancel,
    handleSave,
  };
};
