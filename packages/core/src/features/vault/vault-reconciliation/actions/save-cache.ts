import type { StepResult, FlowError } from '@nori/shared';

export interface SaveCacheResult {
  saved: boolean;
}

/**
 * Stub: returns success. Will write .nori-cache later.
 */
export async function saveCache(
  _vaultPath: string,
  _localHashes: Map<string, string>
): Promise<StepResult<SaveCacheResult> | FlowError> {
  return {
    success: true,
    data: { saved: true },
  };
}
