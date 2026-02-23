import { createMemo, createSignal, createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { activeProject, activeVault, sidebarContext, activeContextName, clearVaultContext, clearContext } from '../../../stores/navigation.store';
import { vaults } from '../../../stores/vault.store';
import type { VaultLink } from '@nori/shared';
import { apiGet, apiPost, apiDelete } from '../../../lib/api';

export const useContextualSidebar = () => {
  // ── Project context ──────────────────────────────────────────────
  const linkedVaults = createMemo(() => {
    const proj = activeProject();
    if (!proj) return [];
    return vaults().filter((v) => proj.connected_vaults.includes(v.id));
  });

  // ── Vault context: linked projects ───────────────────────────────
  const [links, setLinks] = createSignal<VaultLink[]>([]);
  const [linksLoading, setLinksLoading] = createSignal(false);

  createEffect(() => {
    const vault = activeVault();
    if (vault && sidebarContext() === 'vault') {
      setLinksLoading(true);
      apiGet<{ data: VaultLink[] }>(`/api/vault/${vault.id}/links`)
        .then((res) => setLinks(res.data))
        .catch(() => setLinks([]))
        .finally(() => setLinksLoading(false));
    } else {
      setLinks([]);
    }
  });

  async function handleUnlink(linkId: string) {
    const vault = activeVault();
    if (!vault) return;
    try {
      await apiDelete(`/api/vault/${vault.id}/links/${linkId}`);
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch {
      // silently ignore — link may already be removed
    }
  }

  // ── Vault context: add project ───────────────────────────────────
  const [addProjectOpen, setAddProjectOpen] = createSignal(false);
  const [addProjectError, setAddProjectError] = createSignal('');
  const [addProjectLoading, setAddProjectLoading] = createSignal(false);

  async function handleAddProject(projectPath: string) {
    const vault = activeVault();
    if (!vault) return;
    setAddProjectLoading(true);
    setAddProjectError('');
    try {
      const res = await apiPost<{ data: { link: VaultLink } }>(
        `/api/vault/${vault.id}/link`,
        { project_path: projectPath }
      );
      setLinks((prev) => [res.data.link, ...prev]);
      setAddProjectOpen(false);
    } catch (err) {
      setAddProjectError(err instanceof Error ? err.message : 'Failed to link project');
    } finally {
      setAddProjectLoading(false);
    }
  }

  // ── Vault context: dialogs ───────────────────────────────────────
  const [importOpen, setImportOpen] = createSignal(false);
  const [exportOpen, setExportOpen] = createSignal(false);

  const navigate = useNavigate();

  function handleContextBack() {
    if (sidebarContext() === 'project') {
      clearContext();
      navigate('/projects');
    } else {
      clearVaultContext();
      navigate('/vaults');
    }
  }

  return {
    linkedVaults,
    links,
    linksLoading,
    handleUnlink,
    addProjectOpen,
    setAddProjectOpen,
    addProjectError,
    setAddProjectError,
    addProjectLoading,
    importOpen,
    setImportOpen,
    exportOpen,
    setExportOpen,
    handleAddProject,
    handleContextBack,
    sidebarContext,
    activeContextName,
    activeVault,
  };
}
