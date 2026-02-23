import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { validateFrontmatter } from './actions/validate-frontmatter.js';
import { validateContent } from './actions/validate-content.js';
import { writeMarkdownFile } from './actions/write-markdown-file.js';
import { auditKnowledge } from './actions/audit-knowledge.js';
import { regenerateIndex } from './actions/regenerate-index.js';

export interface KnowledgeCreateInput {
  vault_id: string;
  vault_path: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  db: Database;
}

export interface KnowledgeCreateResult {
  entry_id: string;
  file_path: string;
  title: string;
}

export async function runKnowledgeCreate(
  input: KnowledgeCreateInput,
  emitter?: FlowEmitter
): Promise<FlowResult<KnowledgeCreateResult>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('knowledge:create:started', { vault_id: input.vault_id, title: input.title });

  // Step 01: Validate frontmatter
  emit.emit('knowledge:create:validating-frontmatter', { title: input.title });
  const frontmatterResult = validateFrontmatter(input.title, input.category, input.tags);
  if (!frontmatterResult.success) return frontmatterResult;

  // Step 02: Validate content
  emit.emit('knowledge:create:validating-content', { content_length: input.content.length });
  const contentResult = validateContent(input.content);
  if (!contentResult.success) return contentResult;

  // Step 03: Write markdown file
  emit.emit('knowledge:create:writing-file', { vault_path: input.vault_path, title: input.title });
  const writeResult = writeMarkdownFile(input.vault_path, frontmatterResult.data, input.content);
  if (!writeResult.success) return writeResult;

  const { entry_id, file_path } = writeResult.data;

  // Step 04: Audit knowledge (non-fatal)
  emit.emit('knowledge:create:auditing', { entry_id, file_path });
  const auditResult = auditKnowledge(entry_id, file_path);
  if (!auditResult.success) {
    emit.emit('knowledge:create:audit-warning', {
      entry_id,
      message: 'Audit failed, creation still succeeded',
    });
  }

  // Step 05: Regenerate index — insert new entry into DB (non-fatal)
  emit.emit('knowledge:create:regenerating-index', { vault_id: input.vault_id });
  const indexResult = regenerateIndex(
    entry_id,
    input.vault_id,
    file_path,
    input.title,
    input.category,
    input.tags,
    input.content,
    input.db
  );
  if (!indexResult.success) {
    emit.emit('knowledge:create:index-warning', {
      entry_id,
      message: 'Index rebuild failed, entry may not be searchable until next rebuild',
    });
  }

  emit.emit('knowledge:create:completed', { entry_id, file_path, title: input.title });

  return {
    success: true,
    data: {
      entry_id,
      file_path,
      title: input.title,
    },
  };
}
