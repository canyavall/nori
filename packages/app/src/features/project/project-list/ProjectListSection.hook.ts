import { createSignal, onMount } from 'solid-js';
import type { Project } from '@nori/shared';
import { apiGet } from '../../../lib/api';
import { projects, setProjects, setRegisterOpen, registerOpen } from '../../../stores/project.store';
import { clearContext, selectProject, activeProject } from '../../../stores/navigation.store';

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

  const handleAddProject = () => {
    setRegisterOpen(true);
  };

  const handleSelectProject = (project: Project) => {
    selectProject(project);
  };

  return { loading, projects, registerOpen, activeProject, handleAddProject, handleSelectProject };
};
