/**
 * Role Store
 *
 * Zustand store for managing active role state.
 * Persists to localStorage and loads personality templates.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RoleId, DEFAULT_ROLE } from '@/types/role';
import { api } from '@/lib/api';

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
          // Load personality template from backend
          const response = await api.get<{ content: string }>(`/roles/personality/${roleId}`);
          set({ personalityText: response.content });

          // Save active role to backend database
          await api.post('/roles/active', { role: roleId });
        } catch (err) {
          console.error('Failed to load personality:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to load personality';
          set({ error: errorMessage, personalityText: null });
          throw err;
        }
      },
    }),
    {
      name: 'nori-role-storage',
      partialize: state => ({ activeRole: state.activeRole }),
    }
  )
);
