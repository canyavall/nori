import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { validateEntryExists } from './actions/validate-entry-exists.js';
import { checkDependencies } from './actions/check-dependencies.js';
import { deleteFile } from './actions/delete-file.js';
import { regenerateIndex } from './actions/regenerate-index.js';

export interface KnowledgeDeleteInput {
  vault_id: string;
  vault_path: string;
  file_path: string;
  db: Database;
}

export interface KnowledgeDeleteResult {
  deleted_file_path: string;
}

export async function runKnowledgeDelete(
  input: KnowledgeDeleteInput,
  emitter?: FlowEmitter
): Promise<FlowResult<KnowledgeDeleteResult>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('knowledge:delete:started', { vault_id: input.vault_id, file_path: input.file_path });

  // Step 01: Validate entry exists
  emit.emit('knowledge:delete:validating-exists', { file_path: input.file_path });
  const existsResult = validateEntryExists(input.file_path);
  if (!existsResult.success) return existsResult;

  // Step 02: Check dependencies
  emit.emit('knowledge:delete:checking-dependencies', { file_path: input.file_path });
  const depsResult = checkDependencies(input.file_path);
  if (!depsResult.success) return depsResult;

  // Step 03: Delete file
  emit.emit('knowledge:delete:deleting-file', { file_path: input.file_path });
  const deleteResult = deleteFile(input.file_path);
  if (!deleteResult.success) return deleteResult;

  // Step 04: Regenerate index (non-fatal)
  emit.emit('knowledge:delete:regenerating-index', { vault_id: input.vault_id });
  const indexResult = regenerateIndex(input.vault_id, input.vault_path);
  if (!indexResult.success) {
    emit.emit('knowledge:delete:index-warning', {
      file_path: input.file_path,
      message: 'Index rebuild failed, deleted entry may still appear in stale index until next rebuild',
    });
  }

  emit.emit('knowledge:delete:completed', { deleted_file_path: input.file_path });

  return {
    success: true,
    data: {
      deleted_file_path: input.file_path,
    },
  };
}
