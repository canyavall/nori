import { createSignal, createMemo, onMount } from 'solid-js';
import type { ClaudeHookConfig } from '@nori/shared';
import { apiGet, apiPut } from '../../../lib/api';
import { activeProject } from '../../../stores/navigation.store';

export const useHooksSection = () => {
  const [sharedRaw, setSharedRaw] = createSignal('');
  const [localRaw, setLocalRaw] = createSignal('');
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [activeTab, setActiveTab] = createSignal<'shared' | 'local'>('shared');
  const [saving, setSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal('');
  const [saveSuccess, setSaveSuccess] = createSignal(false);

  const projectPath = createMemo(() => {
    const p = activeProject();
    return p ? btoa(p.path) : '';
  });

  const currentContent = createMemo(() =>
    activeTab() === 'shared' ? sharedRaw() : localRaw(),
  );

  const setCurrentContent = (value: string) => {
    if (activeTab() === 'shared') {
      setSharedRaw(value);
    } else {
      setLocalRaw(value);
    }
  };

  onMount(async () => {
    if (!projectPath()) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiGet<{
        data: {
          shared: ClaudeHookConfig | null;
          local: ClaudeHookConfig | null;
          sharedRaw: string;
          localRaw: string;
        };
      }>(`/api/project/claude/hooks?projectPath=${projectPath()}`);

      setSharedRaw(res.data.sharedRaw || '{\n  "hooks": {}\n}');
      setLocalRaw(res.data.localRaw || '{\n  "hooks": {}\n}');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hooks');
    }
    setLoading(false);
  });

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    // Extract hooks from the full settings JSON
    let hooksJson: string;
    try {
      const parsed = JSON.parse(activeTab() === 'shared' ? sharedRaw() : localRaw());
      hooksJson = JSON.stringify(parsed.hooks ?? {});
    } catch {
      setSaveError('Invalid JSON');
      setSaving(false);
      return;
    }

    try {
      await apiPut(`/api/project/claude/hooks?projectPath=${projectPath()}`, {
        target: activeTab(),
        hooks: hooksJson,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save hooks');
    }
    setSaving(false);
  };

  return {
    loading,
    error,
    activeTab,
    setActiveTab,
    currentContent,
    setCurrentContent,
    saving,
    saveError,
    saveSuccess,
    handleSave,
  };
};
