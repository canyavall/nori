import { readFileSync } from 'node:fs';
import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult, KnowledgeLlmAuditResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { loadEntry } from './actions/load-entry.js';
import { validateFrontmatterSchema } from './actions/validate-frontmatter-schema.js';
import { validateContentQuality } from './actions/validate-content-quality.js';
import { checkAiOriginality } from './actions/check-ai-originality.js';
import { callLlmAudit } from './actions/call-llm-audit.js';
import { generateAuditResult, type KnowledgeAuditResult } from './actions/generate-audit-result.js';
import { queryKnowledgeEntries } from '../shared/knowledge-queries.js';

export interface KnowledgeAuditInput {
  file_path: string;
  vault_id?: string;
  db?: Database;
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

  // Step 05: Load vault entries for comparison (optional — only when db provided)
  let vaultEntries: Array<{ title: string; category: string; tags: string[] }> = [];
  if (input.db && input.vault_id) {
    emit.emit('knowledge:audit:loading-vault-entries', { file_path: input.file_path });
    const allEntries = queryKnowledgeEntries(input.db, input.vault_id);
    // Exclude the current entry from the comparison set
    vaultEntries = allEntries
      .filter((e) => e.file_path !== input.file_path)
      .map((e) => ({ title: e.title, category: e.category, tags: e.tags }));
  }

  // Step 06: Call LLM audit (non-fatal — skipped gracefully if no auth or on error)
  let llmResult: KnowledgeLlmAuditResult | undefined;
  if (input.db && input.vault_id) {
    emit.emit('knowledge:audit:calling-llm', { file_path: input.file_path });
    const rawFileContent = readFileSync(input.file_path, 'utf-8');
    const llmCallResult = await callLlmAudit(rawFileContent, vaultEntries);
    if (llmCallResult.success) {
      llmResult = llmCallResult.data;
    }
  }

  // Step 07: Generate audit result
  emit.emit('knowledge:audit:generating-result', { file_path: input.file_path });
  const auditResult = generateAuditResult(
    input.file_path,
    fmResult.data,
    contentResult.data,
    aiResult.data,
    llmResult
  );
  if (!auditResult.success) return auditResult;

  emit.emit('knowledge:audit:completed', {
    file_path: input.file_path,
    status: auditResult.data.status,
  });

  return { success: true, data: auditResult.data };
}
