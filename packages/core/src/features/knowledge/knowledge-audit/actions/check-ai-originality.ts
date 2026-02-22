import type { StepResult, FlowError } from '@nori/shared';

export interface AiOriginalityResult {
  passed: boolean;
  findings: string[];
}

/**
 * Stub: returns pass. Will use LLM to check AI-generated content later.
 */
export async function checkAiOriginality(_content: string): Promise<StepResult<AiOriginalityResult> | FlowError> {
  return {
    success: true,
    data: {
      passed: true,
      findings: [],
    },
  };
}
