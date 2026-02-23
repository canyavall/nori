import { createSignal } from 'solid-js';
import type { Project } from '@nori/shared';
import { apiPost } from '../../../lib/api';
import { addProject, setRegisterOpen } from '../../../stores/project.store';
import { pickFolder } from '../../../lib/folder-picker';

export const useProjectRegisterDialog = () => {
  const [path, setPath] = createSignal('');
  const [name, setName] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [picking, setPicking] = createSignal(false);
  const [error, setError] = createSignal('');

  const handleBrowse = async () => {
    setPicking(true);
    const selected = await pickFolder();
    if (selected) {
      setPath(selected);
    }
    setPicking(false);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!path().trim()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await apiPost<{ data: Project }>('/api/project', {
        path: path().trim(),
        name: name().trim() || undefined,
      });
      addProject(result.data);
      setRegisterOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register project');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRegisterOpen(false);
  };

  const isSubmitDisabled = () => loading() || !path().trim();

  return { path, name, setName, loading, picking, error, handleBrowse, handleSubmit, handleClose, isSubmitDisabled };
};
