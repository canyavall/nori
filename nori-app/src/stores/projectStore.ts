import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace } from '@/types/project';

interface WorkspaceState {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  error: string | null;

  loadWorkspaces: () => Promise<void>;
  createWorkspace: (path: string, vault?: string) => Promise<void>;
  setActiveWorkspace: (workspaceId: number) => Promise<void>;
  clearActiveWorkspace: () => void;
  getActiveWorkspace: () => Promise<void>;
  updateWorkspaceVault: (workspaceId: number, vault: string, vaultPath: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      activeWorkspace: null,
      workspaces: [],
      isLoading: false,
      error: null,

      loadWorkspaces: async () => {
        set({ isLoading: true, error: null });

        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const workspaces = await invoke<Workspace[]>('list_workspaces');
          set({ workspaces, isLoading: false });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to load workspaces';
          set({ error: errorMessage, isLoading: false });
        }
      },

      createWorkspace: async (path: string, vault?: string) => {
        set({ isLoading: true, error: null });

        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const workspace = await invoke<Workspace>('create_workspace', {
            input: {
              path,
              vault: vault || null
            }
          });

          set((state) => ({
            workspaces: [workspace, ...state.workspaces],
            activeWorkspace: workspace,
            isLoading: false,
          }));

          await get().setActiveWorkspace(workspace.id);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to create workspace';
          set({ error: errorMessage, isLoading: false });
          throw err;
        }
      },

      setActiveWorkspace: async (workspaceId: number) => {
        set({ isLoading: true, error: null });

        try {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('set_active_workspace', { workspaceId });

          const workspace = get().workspaces.find((w) => w.id === workspaceId);
          if (workspace) {
            set({ activeWorkspace: workspace, isLoading: false });
          } else {
            await get().getActiveWorkspace();
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to set active workspace';
          set({ error: errorMessage, isLoading: false });
          throw err;
        }
      },

      clearActiveWorkspace: () => {
        set({ activeWorkspace: null });
      },

      getActiveWorkspace: async () => {
        set({ isLoading: true, error: null });

        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const workspace = await invoke<Workspace | null>('get_active_workspace');
          set({ activeWorkspace: workspace, isLoading: false });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to get active workspace';
          set({ error: errorMessage, isLoading: false });
        }
      },

      updateWorkspaceVault: async (workspaceId: number, vault: string, vaultPath: string) => {
        set({ isLoading: true, error: null });

        try {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('update_workspace_vault', { workspaceId, vault, vaultPath });

          // Reload workspace to get updated data
          const workspace = await invoke<Workspace | null>('get_active_workspace');
          set({ activeWorkspace: workspace, isLoading: false });

          // Reload all workspaces
          await get().loadWorkspaces();
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to update workspace vault';
          set({ error: errorMessage, isLoading: false });
          throw err;
        }
      },
    }),
    {
      name: 'nori-workspace-storage',
      partialize: (state) => ({
        activeWorkspace: state.activeWorkspace,
      }),
    }
  )
);
