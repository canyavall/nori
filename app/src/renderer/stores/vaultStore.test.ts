import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useVaultStore } from './vaultStore';
import type { Vault } from '@/types/vault';

// Mock @tauri-apps/api/core
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

describe('vaultStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useVaultStore.setState({
      vaults: [],
      isLoading: false,
      error: null,
    });
    mockInvoke.mockClear();
  });

  describe('loadVaults', () => {
    it('should load vaults successfully', async () => {
      const mockVaults: Vault[] = [
        { name: 'vault1', path: '/path/to/vault1', created_at: 1234567890 },
        { name: 'vault2', path: '/path/to/vault2', created_at: 1234567891 },
      ];

      mockInvoke.mockResolvedValue(mockVaults);

      await act(async () => {
        await useVaultStore.getState().loadVaults();
      });

      const state = useVaultStore.getState();
      expect(state.vaults).toEqual(mockVaults);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockInvoke).toHaveBeenCalledWith('list_vaults');
    });

    it('should handle errors when loading vaults', async () => {
      const errorMessage = 'Failed to load vaults from backend';
      mockInvoke.mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        await useVaultStore.getState().loadVaults();
      });

      const state = useVaultStore.getState();
      expect(state.vaults).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should set loading state during fetch', async () => {
      mockInvoke.mockImplementation(
        () =>
          new Promise((resolve) => {
            // Check loading state immediately
            const state = useVaultStore.getState();
            expect(state.isLoading).toBe(true);
            resolve([]);
          }),
      );

      await act(async () => {
        await useVaultStore.getState().loadVaults();
      });
    });
  });

  describe('createVault', () => {
    it('should create a vault successfully', async () => {
      const input = { name: 'new-vault', path: '/path/to/new-vault' };
      const mockVault: Vault = { ...input, created_at: Date.now() };

      mockInvoke.mockResolvedValue(mockVault);

      let result: Vault | undefined;
      await act(async () => {
        result = await useVaultStore.getState().createVault(input);
      });

      expect(result).toEqual(mockVault);
      expect(mockInvoke).toHaveBeenCalledWith('create_vault', { input });

      const state = useVaultStore.getState();
      expect(state.vaults).toContainEqual(mockVault);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should add new vault to existing vaults', async () => {
      const existingVault: Vault = {
        name: 'existing',
        path: '/path/existing',
        created_at: 1234567890,
      };
      useVaultStore.setState({ vaults: [existingVault] });

      const input = { name: 'new-vault', path: '/path/to/new-vault' };
      const mockVault: Vault = { ...input, created_at: Date.now() };

      mockInvoke.mockResolvedValue(mockVault);

      await act(async () => {
        await useVaultStore.getState().createVault(input);
      });

      const state = useVaultStore.getState();
      expect(state.vaults).toHaveLength(2);
      expect(state.vaults).toContainEqual(existingVault);
      expect(state.vaults).toContainEqual(mockVault);
    });

    it('should handle errors when creating vault', async () => {
      const input = { name: 'new-vault', path: '/path/to/new-vault' };
      const errorMessage = 'Vault already exists';
      mockInvoke.mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await useVaultStore.getState().createVault(input);
        } catch (err) {
          // Expected to throw
        }
      });

      const state = useVaultStore.getState();
      expect(state.vaults).toEqual([]);
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('deleteVault', () => {
    it('should delete a vault successfully', async () => {
      const vaults: Vault[] = [
        { name: 'vault1', path: '/path/vault1', created_at: 1234567890 },
        { name: 'vault2', path: '/path/vault2', created_at: 1234567891 },
      ];
      useVaultStore.setState({ vaults });

      mockInvoke.mockResolvedValue(undefined);

      await act(async () => {
        await useVaultStore.getState().deleteVault('vault1');
      });

      expect(mockInvoke).toHaveBeenCalledWith('delete_vault', {
        name: 'vault1',
      });

      const state = useVaultStore.getState();
      expect(state.vaults).toHaveLength(1);
      expect(state.vaults[0].name).toBe('vault2');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle errors when deleting vault', async () => {
      const vaults: Vault[] = [
        { name: 'vault1', path: '/path/vault1', created_at: 1234567890 },
      ];
      useVaultStore.setState({ vaults });

      const errorMessage = 'Vault not found';
      mockInvoke.mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await useVaultStore.getState().deleteVault('vault1');
        } catch (err) {
          // Expected to throw
        }
      });

      const state = useVaultStore.getState();
      // Vaults should remain unchanged on error
      expect(state.vaults).toEqual(vaults);
      expect(state.error).toBe(errorMessage);
    });

    it('should not modify vaults if vault does not exist', async () => {
      const vaults: Vault[] = [
        { name: 'vault1', path: '/path/vault1', created_at: 1234567890 },
      ];
      useVaultStore.setState({ vaults });

      mockInvoke.mockResolvedValue(undefined);

      await act(async () => {
        await useVaultStore.getState().deleteVault('nonexistent');
      });

      const state = useVaultStore.getState();
      // Should still have vault1 (filter returns same array if nothing removed)
      expect(state.vaults).toHaveLength(1);
      expect(state.vaults[0].name).toBe('vault1');
    });
  });

  describe('getVault', () => {
    it('should get a vault successfully', async () => {
      const mockVault: Vault = {
        name: 'vault1',
        path: '/path/vault1',
        created_at: 1234567890,
      };

      mockInvoke.mockResolvedValue(mockVault);

      let result: Vault | null | undefined;
      await act(async () => {
        result = await useVaultStore.getState().getVault('vault1');
      });

      expect(result).toEqual(mockVault);
      expect(mockInvoke).toHaveBeenCalledWith('get_vault', { name: 'vault1' });
    });

    it('should return null if vault not found', async () => {
      mockInvoke.mockResolvedValue(null);

      let result: Vault | null | undefined;
      await act(async () => {
        result = await useVaultStore.getState().getVault('nonexistent');
      });

      expect(result).toBeNull();
    });

    it('should handle errors when getting vault', async () => {
      const errorMessage = 'Backend error';
      mockInvoke.mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await useVaultStore.getState().getVault('vault1');
        } catch (err) {
          // Expected to throw
        }
      });

      const state = useVaultStore.getState();
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('error handling', () => {
    it('should clear previous error on successful operation', async () => {
      // Set initial error state
      useVaultStore.setState({ error: 'Previous error' });

      const mockVaults: Vault[] = [
        { name: 'vault1', path: '/path/vault1', created_at: 1234567890 },
      ];
      mockInvoke.mockResolvedValue(mockVaults);

      await act(async () => {
        await useVaultStore.getState().loadVaults();
      });

      const state = useVaultStore.getState();
      expect(state.error).toBeNull();
    });

    it('should handle non-Error exceptions', async () => {
      mockInvoke.mockRejectedValue('String error');

      await act(async () => {
        await useVaultStore.getState().loadVaults();
      });

      const state = useVaultStore.getState();
      expect(state.error).toBe('Failed to load vaults');
    });
  });
});
