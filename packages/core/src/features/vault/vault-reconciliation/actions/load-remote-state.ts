import type { StepResult, FlowError } from '@nori/shared';

export interface RemoteState {
  file_hashes: Map<string, string>;
  file_count: number;
}

/**
 * Stub: returns empty state. Will use git ls-tree to load remote state later.
 */
export async function loadRemoteState(_vaultPath: string): Promise<StepResult<RemoteState> | FlowError> {
  return {
    success: true,
    data: {
      file_hashes: new Map<string, string>(),
      file_count: 0,
    },
  };
}
