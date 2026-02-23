import { createSignal, createMemo } from 'solid-js';
import type { Accessor } from 'solid-js';
import type { ClaudeHookConfig } from '@nori/shared';
import { apiPut } from '../../../../../../lib/api';
import type { HooksData } from '../../ProjectDashboardSection.hook';

const countHooks = (config: ClaudeHookConfig | null): number => {
  if (!config) return 0;
  return Object.values(config).reduce((sum, entries) => sum + (entries?.length ?? 0), 0);
};

export const useHooksAccordion = (
  hooksData: Accessor<HooksData>,
  projectPath: Accessor<string>,
) => {
  const [open, setOpen] = createSignal(true);
  const [editing, setEditing] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<'shared' | 'local'>('shared');
  const [sharedRaw, setSharedRaw] = createSignal('');
  const [localRaw, setLocalRaw] = createSignal('');
  const [saving, setSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal('');
  const [saveSuccess, setSaveSuccess] = createSignal(false);

  const hookCount = createMemo(
    () => countHooks(hooksData().shared) + countHooks(hooksData().local),
  );

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

  const handleOpenEdit = () => {
    setSharedRaw(hooksData().sharedRaw || '{\n  "hooks": {}\n}');
    setLocalRaw(hooksData().localRaw || '{\n  "hooks": {}\n}');
    setSaveError('');
    setSaveSuccess(false);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

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

  const handleCancel = () => {
    setEditing(false);
    setSaveError('');
    setSaveSuccess(false);
  };

  return {
    open,
    setOpen,
    editing,
    hookCount,
    activeTab,
    setActiveTab,
    currentContent,
    setCurrentContent,
    saving,
    saveError,
    saveSuccess,
    handleOpenEdit,
    handleSave,
    handleCancel,
  };
};
