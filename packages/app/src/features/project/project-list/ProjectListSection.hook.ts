import { createSignal, onMount } from 'solid-js';
import type { Project } from '@nori/shared';
import { apiGet } from '../../../lib/api';
import { setProjects, setRegisterOpen } from '../../../stores/project.store';
import { clearContext } from '../../../stores/navigation.store';

export const useProjectListSection = () => {
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    clearContext();
    try {
      const res = await apiGet<{ data: Project[] }>('/api/project');
      setProjects(res.data);
    } catch {
      // Will show empty state
    }
    setLoading(false);
  });

  function handleAddProject() {
    setRegisterOpen(true);
  }

  return { loading, handleAddProject };
};
