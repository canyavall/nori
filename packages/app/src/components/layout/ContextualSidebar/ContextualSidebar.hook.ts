import { createMemo } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { activeProject, sidebarContext, activeContextName, clearContext } from '../../../stores/navigation.store';
import { vaults } from '../../../stores/vault.store';

export const useContextualSidebar = () => {
  const linkedVaults = createMemo(() => {
    const proj = activeProject();
    if (!proj) return [];
    return vaults().filter((v) => proj.connected_vaults.includes(v.id));
  });

  const navigate = useNavigate();

  function handleContextBack() {
    clearContext();
    navigate('/projects');
  }

  return {
    linkedVaults,
    handleContextBack,
    sidebarContext,
    activeContextName,
  };
};
