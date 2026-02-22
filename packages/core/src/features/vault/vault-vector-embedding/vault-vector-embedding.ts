import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { loadKnowledgeEntries } from './actions/load-knowledge-entries.js';
import { generateEmbeddings } from './actions/generate-embeddings.js';
import { storeVectors } from './actions/store-vectors.js';
import { validateStore } from './actions/validate-store.js';

export interface VaultVectorEmbeddingInput {
  vault_id: string;
  db: Database;
}

export interface VaultVectorEmbeddingResult {
  embedded_count: number;
}

export async function runVaultVectorEmbedding(
  input: VaultVectorEmbeddingInput,
  emitter?: FlowEmitter
): Promise<FlowResult<VaultVectorEmbeddingResult>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('vault:embedding:started', { vault_id: input.vault_id });

  // Step 01: Load knowledge entries
  emit.emit('vault:embedding:loading-entries', { vault_id: input.vault_id });
  const loadResult = loadKnowledgeEntries(input.db, input.vault_id);
  if (!loadResult.success) return loadResult;

  // Step 02: Generate embeddings
  emit.emit('vault:embedding:generating', { entry_count: loadResult.data.entry_count });
  const embeddingResult = await generateEmbeddings(loadResult.data.entries);
  if (!embeddingResult.success) return embeddingResult;

  // Step 03: Store vectors
  emit.emit('vault:embedding:storing', { embedded_count: embeddingResult.data.embedded_count });
  const storeResult = await storeVectors(embeddingResult.data.embeddings);
  if (!storeResult.success) return storeResult;

  // Step 04: Validate store
  emit.emit('vault:embedding:validating', { vault_id: input.vault_id });
  const validateResult = await validateStore();
  if (!validateResult.success) return validateResult;

  emit.emit('vault:embedding:completed', {
    vault_id: input.vault_id,
    embedded_count: embeddingResult.data.embedded_count,
  });

  return {
    success: true,
    data: { embedded_count: embeddingResult.data.embedded_count },
  };
}
