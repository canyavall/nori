import type { StepResult, FlowError } from '@nori/shared';
import type { EmbeddingResult } from './generate-embeddings.js';

export interface StoreVectorsResult {
  stored_count: number;
}

/**
 * Stub: returns success. Will use vectra for vector storage later.
 */
export async function storeVectors(
  _embeddings: EmbeddingResult[]
): Promise<StepResult<StoreVectorsResult> | FlowError> {
  return {
    success: true,
    data: { stored_count: 0 },
  };
}
