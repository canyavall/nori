import type { StepResult } from '@nori/shared';
import type { KnowledgeEntryRow } from './load-knowledge-entries.js';

export interface EmbeddingResult {
  entry_id: string;
  vector: number[];
}

export interface GenerateEmbeddingsResult {
  embeddings: EmbeddingResult[];
  embedded_count: number;
}

/**
 * Stub: returns empty embeddings. Will use Vercel AI SDK for embedding generation later.
 */
export async function generateEmbeddings(
  _entries: KnowledgeEntryRow[]
): Promise<StepResult<GenerateEmbeddingsResult>> {
  return {
    success: true,
    data: {
      embeddings: [],
      embedded_count: 0,
    },
  };
}
