import type { StepResult, FlowError } from '@nori/shared';

export interface UpdateIndexResult {
  updated: boolean;
  message: string;
}

/**
 * Stub for knowledge index rebuild after pull.
 * Will delegate to knowledge-index-build flow in the future.
 */
export async function updateIndex(
  _vaultId: string,
  _localPath: string
): Promise<StepResult<UpdateIndexResult> | FlowError> {
  // TODO: Call runKnowledgeIndexBuild when wired up
  return {
    success: true,
    data: {
      updated: true,
      message: 'Index update deferred (stub)',
    },
  };
}
