import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { loadExisting } from './actions/load-existing.js';
import { validateChanges } from './actions/validate-changes.js';
import { writeChanges } from './actions/write-changes.js';
import { auditKnowledge } from './actions/audit-knowledge.js';
import { regenerateIndex } from './actions/regenerate-index.js';

export interface KnowledgeEditInput {
  vault_id: string;
  vault_path: string;
  file_path: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  db: Database;
}

export interface KnowledgeEditResult {
  entry_id: string;
  file_path: string;
  title: string;
}

export async function runKnowledgeEdit(
  input: KnowledgeEditInput,
  emitter?: FlowEmitter
): Promise<FlowResult<KnowledgeEditResult>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('knowledge:edit:started', { vault_id: input.vault_id, file_path: input.file_path });

  // Step 01: Load existing entry
  emit.emit('knowledge:edit:loading', { file_path: input.file_path });
  const loadResult = loadExisting(input.file_path);
  if (!loadResult.success) return loadResult;

  const existing = loadResult.data;

  // Step 02: Validate changes
  emit.emit('knowledge:edit:validating-changes', { file_path: input.file_path });
  const validateResult = validateChanges(input.title, input.category, input.tags, input.content);
  if (!validateResult.success) return validateResult;

  // Step 03: Write changes (atomic)
  emit.emit('knowledge:edit:writing-changes', { file_path: input.file_path });
  const mergedFrontmatter = {
    ...validateResult.data.frontmatter,
    created: existing.frontmatter.created,
  };
  const writeResult = writeChanges(input.file_path, mergedFrontmatter, validateResult.data.content);
  if (!writeResult.success) return writeResult;

  const entryId = crypto.randomUUID();

  // Step 04: Audit knowledge (non-fatal)
  emit.emit('knowledge:edit:auditing', { entry_id: entryId, file_path: input.file_path });
  const auditResult = auditKnowledge(entryId, input.file_path);
  if (!auditResult.success) {
    emit.emit('knowledge:edit:audit-warning', {
      entry_id: entryId,
      message: 'Audit failed, edit still succeeded',
    });
  }

  // Step 05: Regenerate index (non-fatal)
  emit.emit('knowledge:edit:regenerating-index', { vault_id: input.vault_id });
  const indexResult = regenerateIndex(input.vault_id, input.vault_path);
  if (!indexResult.success) {
    emit.emit('knowledge:edit:index-warning', {
      entry_id: entryId,
      message: 'Index rebuild failed, search may return stale metadata until next rebuild',
    });
  }

  emit.emit('knowledge:edit:completed', { entry_id: entryId, file_path: input.file_path, title: input.title });

  return {
    success: true,
    data: {
      entry_id: entryId,
      file_path: input.file_path,
      title: input.title,
    },
  };
}
