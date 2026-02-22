import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { loadEntry } from './actions/load-entry.js';
import { validateFrontmatterSchema } from './actions/validate-frontmatter-schema.js';
import { validateContentQuality } from './actions/validate-content-quality.js';
import { checkAiOriginality } from './actions/check-ai-originality.js';
import { generateAuditResult, type KnowledgeAuditResult } from './actions/generate-audit-result.js';

export interface KnowledgeAuditInput {
  file_path: string;
}

export async function runKnowledgeAudit(
  input: KnowledgeAuditInput,
  emitter?: FlowEmitter
): Promise<FlowResult<KnowledgeAuditResult>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('knowledge:audit:started', { file_path: input.file_path });

  // Step 01: Load entry
  emit.emit('knowledge:audit:loading-entry', { file_path: input.file_path });
  const loadResult = loadEntry(input.file_path);
  if (!loadResult.success) return loadResult;

  // Step 02: Validate frontmatter schema
  emit.emit('knowledge:audit:validating-frontmatter', { file_path: input.file_path });
  const fmResult = validateFrontmatterSchema(loadResult.data.frontmatter);
  if (!fmResult.success) return fmResult;

  // Step 03: Validate content quality
  emit.emit('knowledge:audit:validating-content', { file_path: input.file_path });
  const contentResult = validateContentQuality(loadResult.data.content);
  if (!contentResult.success) return contentResult;

  // Step 04: Check AI originality
  emit.emit('knowledge:audit:checking-originality', { file_path: input.file_path });
  const aiResult = await checkAiOriginality(loadResult.data.content);
  if (!aiResult.success) return aiResult;

  // Step 05: Generate audit result
  emit.emit('knowledge:audit:generating-result', { file_path: input.file_path });
  const auditResult = generateAuditResult(
    input.file_path,
    fmResult.data,
    contentResult.data,
    aiResult.data
  );
  if (!auditResult.success) return auditResult;

  emit.emit('knowledge:audit:completed', {
    file_path: input.file_path,
    status: auditResult.data.status,
  });

  return { success: true, data: auditResult.data };
}
