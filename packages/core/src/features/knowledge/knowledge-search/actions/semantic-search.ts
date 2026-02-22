import type { StepResult } from '@nori/shared';
import type { ScoredEntry } from './score-relevance.js';

export interface SemanticSearchResult {
  results: ScoredEntry[];
  result_count: number;
  search_duration_ms: number;
}

/**
 * Stub: returns empty results. Will use vectra for vector search later.
 */
export function semanticSearch(
  _query: string
): StepResult<SemanticSearchResult> {
  return {
    success: true,
    data: {
      results: [],
      result_count: 0,
      search_duration_ms: 0,
    },
  };
}
