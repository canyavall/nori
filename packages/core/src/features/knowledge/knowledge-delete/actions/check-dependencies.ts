import type { StepResult, FlowError } from '@nori/shared';

export interface DependencyCheckResult {
  dependents_count: number;
  dependent_ids: string[];
}

/**
 * Stub: will check required_knowledge references later.
 * For now, returns no dependents.
 */
export function checkDependencies(_filePath: string): StepResult<DependencyCheckResult> | FlowError {
  return {
    success: true,
    data: {
      dependents_count: 0,
      dependent_ids: [],
    },
  };
}
