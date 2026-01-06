/**
 * Role Store
 *
 * Zustand store for managing active role state.
 * Persists to localStorage and loads personality templates.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RoleId, DEFAULT_ROLE } from '@/types/role';

interface RoleState {
  activeRole: RoleId;
  personalityText: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setRole: (roleId: RoleId) => Promise<void>;
  loadPersonality: (roleId: RoleId) => Promise<void>;
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set, get) => ({
      activeRole: DEFAULT_ROLE,
      personalityText: null,
      isLoading: false,
      error: null,

      setRole: async (roleId: RoleId) => {
        set({ activeRole: roleId, isLoading: true, error: null });

        try {
          await get().loadPersonality(roleId);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to load personality';
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },

      loadPersonality: async (roleId: RoleId) => {
        try {
          // Import invoke dynamically to avoid issues if not in Tauri context
          const { invoke } = await import('@tauri-apps/api/core');

          // Load personality template from backend
          const text = await invoke<string>('load_personality', { role: roleId });
          set({ personalityText: text });

          // Save active role to backend database
          await invoke('save_active_role_backend', { role: roleId });
        } catch (err) {
          console.error('Failed to load personality:', err);
          // Fallback for development/non-Tauri environments
          set({
            personalityText: `Personality template for ${roleId} (backend not available)`,
          });
        }
      },
    }),
    {
      name: 'nori-role-storage',
      partialize: state => ({ activeRole: state.activeRole }),
    }
  )
);
