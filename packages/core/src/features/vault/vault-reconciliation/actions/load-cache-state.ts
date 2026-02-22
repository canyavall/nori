import type { StepResult, FlowError } from '@nori/shared';

export interface CacheState {
  file_hashes: Map<string, string>;
  file_count: number;
}

/**
 * Stub: returns empty state. Will read .nori-cache later.
 */
export async function loadCacheState(_vaultPath: string): Promise<StepResult<CacheState> | FlowError> {
  return {
    success: true,
    data: {
      file_hashes: new Map<string, string>(),
      file_count: 0,
    },
  };
}
