import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { HookInfo, HookResult } from '../types/hooks';

export function useHooks() {
  const [hooks, setHooks] = useState<HookInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<HookInfo[]>('list_hooks');
      setHooks(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setHooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const executeHook = useCallback(
    async (
      hookName: string,
      event: string,
      data: unknown
    ): Promise<HookResult> => {
      try {
        setError(null);
        const result = await invoke<HookResult>('execute_hook', {
          hookName,
          event,
          data,
        });
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    []
  );

  useEffect(() => {
    loadHooks();
  }, [loadHooks]);

  return {
    hooks,
    loading,
    error,
    loadHooks,
    executeHook,
  };
}
