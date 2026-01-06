import { useState, useEffect, useCallback } from 'react';
import { invokeCommand } from '../lib/api';
import type { HookInfo, HookResult } from '../types/hooks';

export function useHooks() {
  const [hooks, setHooks] = useState<HookInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Stub: Hooks not implemented in MVP (security reasons)
      // See MIGRATION.md: Known Limitations #2
      setHooks([]);
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
        const result = await invokeCommand<HookResult>('/hooks/execute', {
          method: 'POST',
          body: JSON.stringify({
            hookName,
            event,
            data,
          }),
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
