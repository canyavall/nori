import { createSignal, createMemo, onMount } from 'solid-js';
import type { DiscoveredProject } from '@nori/shared';
import { apiGet } from '../../../lib/api';
import { projects, setProjects, setRegisterOpen, setRegisterPrefilledPath, registerOpen } from '../../../stores/project.store';
import { clearContext, selectProject, activeProject } from '../../../stores/navigation.store';

export const useProjectListSection = () => {
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    clearContext();
    try {
      const res = await apiGet<{ data: DiscoveredProject[] }>('/api/project');
      setProjects(res.data);
    } catch {
      // Will show empty state
    }
    setLoading(false);
  });

  const noriProjects = createMemo(() =>
    projects().filter((p) => p.source === 'nori' || p.source === 'both'),
  );

  const discoveredProjects = createMemo(() =>
    projects().filter((p) => p.source === 'claude-code'),
  );

  const handleAddProject = () => {
    setRegisterPrefilledPath('');
    setRegisterOpen(true);
  };

  const handleSelectProject = (project: DiscoveredProject) => {
    selectProject(project);
  };

  const handleSetupNori = (project: DiscoveredProject) => {
    setRegisterPrefilledPath(project.path);
    setRegisterOpen(true);
  };

  return {
    loading,
    projects,
    noriProjects,
    discoveredProjects,
    registerOpen,
    activeProject,
    handleAddProject,
    handleSelectProject,
    handleSetupNori,
  };
};
