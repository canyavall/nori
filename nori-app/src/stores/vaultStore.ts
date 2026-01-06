import { create } from 'zustand';
import type { Vault, CreateVaultInput } from '@/types/vault';

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
      const { invoke } = await import('@tauri-apps/api/core');
      const vaults = await invoke<Vault[]>('list_vaults');
      set({ vaults, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load vaults';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createVault: async (input: CreateVaultInput) => {
    set({ isLoading: true, error: null });

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const vault = await invoke<Vault>('create_vault', { input });

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
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('delete_vault', { name });

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
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<Vault | null>('get_vault', { name });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get vault';
      set({ error: errorMessage });
      throw err;
    }
  },
}));
