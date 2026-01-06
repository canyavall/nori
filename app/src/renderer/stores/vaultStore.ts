import { create } from 'zustand';
import type { Vault, CreateVaultInput } from '@/types/vault';
import { api } from '@/lib/api';

interface VaultState {
  vaults: Vault[];
  isLoading: boolean;
  error: string | null;

  loadVaults: () => Promise<void>;
  createVault: (input: CreateVaultInput) => Promise<Vault>;
  deleteVault: (name: string) => Promise<void>;
  getVault: (name: string) => Promise<Vault | null>;
}

export const useVaultStore = create<VaultState>()((set) => ({
  vaults: [],
  isLoading: false,
  error: null,

  loadVaults: async () => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Backend route not implemented yet
      const vaults = await api.get<Vault[]>('/vaults');
      set({ vaults, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load vaults';
      set({ error: errorMessage, isLoading: false, vaults: [] });
    }
  },

  createVault: async (input: CreateVaultInput) => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Backend route not implemented yet
      const vault = await api.post<Vault>('/vaults', input);

      set((state) => ({
        vaults: [...state.vaults, vault],
        isLoading: false,
      }));

      return vault;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create vault';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  deleteVault: async (name: string) => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Backend route not implemented yet
      await api.delete(`/vaults/${name}`);

      set((state) => ({
        vaults: state.vaults.filter((v) => v.name !== name),
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete vault';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  getVault: async (name: string) => {
    try {
      // TODO: Backend route not implemented yet
      return await api.get<Vault | null>(`/vaults/${name}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get vault';
      set({ error: errorMessage });
      throw err;
    }
  },
}));
