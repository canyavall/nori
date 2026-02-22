import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { loadAllEntries } from './actions/load-all-entries.js';
import { validateFrontmatter } from './actions/validate-frontmatter.js';
import { validateContent } from './actions/validate-content.js';
import { checkDbConsistency } from './actions/check-db-consistency.js';
import { generateAuditReport, type VaultAuditReport } from './actions/generate-audit-report.js';

export interface VaultAuditInput {
  vault_id: string;
  vault_path: string;
  db: Database;
}

export async function runVaultAudit(
  input: VaultAuditInput,
  emitter?: FlowEmitter
): Promise<FlowResult<VaultAuditReport>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('vault:audit:started', { vault_id: input.vault_id });

  // Step 01: Load all entries
  emit.emit('vault:audit:loading-entries', { vault_id: input.vault_id });
  const loadResult = loadAllEntries(input.db, input.vault_id);
  if (!loadResult.success) return loadResult;

  // Step 02: Validate frontmatter
  emit.emit('vault:audit:validating-frontmatter', { entry_count: loadResult.data.entry_count });
  const fmResult = validateFrontmatter(loadResult.data.entries, input.vault_path);
  if (!fmResult.success) return fmResult;

  // Step 03: Validate content
  emit.emit('vault:audit:validating-content', { entry_count: loadResult.data.entry_count });
  const contentResult = validateContent(loadResult.data.entries, input.vault_path);
  if (!contentResult.success) return contentResult;

  // Step 04: Check DB consistency
  emit.emit('vault:audit:checking-consistency', { vault_id: input.vault_id });
  const consistencyResult = checkDbConsistency(loadResult.data.entries, input.vault_path);
  if (!consistencyResult.success) return consistencyResult;

  // Step 05: Generate audit report
  emit.emit('vault:audit:generating-report', { vault_id: input.vault_id });
  const reportResult = generateAuditReport(
    input.vault_id,
    loadResult.data.entry_count,
    fmResult.data,
    contentResult.data,
    consistencyResult.data
  );
  if (!reportResult.success) return reportResult;

  emit.emit('vault:audit:completed', {
    vault_id: input.vault_id,
    status: reportResult.data.status,
  });

  return { success: true, data: reportResult.data };
}
