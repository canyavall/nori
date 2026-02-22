import type { StepResult, FlowError } from '@nori/shared';

export interface RegenerateIndexResult {
  total_entries: number;
  build_duration_ms: number;
}

/**
 * Stub: delegates to knowledge-index-build flow later.
 * For now, returns success unconditionally.
 */
export function regenerateIndex(
  _vaultId: string,
  _vaultPath: string
): StepResult<RegenerateIndexResult> | FlowError {
  return {
    success: true,
    data: {
      total_entries: 0,
      build_duration_ms: 0,
    },
  };
}
