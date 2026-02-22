import type { StepResult, FlowError } from '@nori/shared';

export interface ValidateStoreResult {
  valid: boolean;
}

/**
 * Stub: returns success. Will validate vector store integrity later.
 */
export async function validateStore(): Promise<StepResult<ValidateStoreResult> | FlowError> {
  return {
    success: true,
    data: { valid: true },
  };
}
