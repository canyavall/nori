import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { loadLocalState } from './actions/load-local-state.js';
import { loadRemoteState } from './actions/load-remote-state.js';
import { loadCacheState } from './actions/load-cache-state.js';
import { compareThreeWay } from './actions/compare-three-way.js';
import { generateReport, type ReconciliationReport } from './actions/generate-report.js';
import { saveCache } from './actions/save-cache.js';

export interface VaultReconciliationInput {
  vault_id: string;
  vault_path: string;
  db: Database;
}

export async function runVaultReconciliation(
  input: VaultReconciliationInput,
  emitter?: FlowEmitter
): Promise<FlowResult<ReconciliationReport>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('vault:reconciliation:started', { vault_id: input.vault_id });

  // Step 01: Load local state
  emit.emit('vault:reconciliation:loading-local', { vault_path: input.vault_path });
  const localResult = loadLocalState(input.vault_path);
  if (!localResult.success) return localResult;

  // Step 02: Load remote state
  emit.emit('vault:reconciliation:loading-remote', { vault_id: input.vault_id });
  const remoteResult = await loadRemoteState(input.vault_path);
  if (!remoteResult.success) return remoteResult;

  // Step 03: Load cache state
  emit.emit('vault:reconciliation:loading-cache', { vault_path: input.vault_path });
  const cacheResult = await loadCacheState(input.vault_path);
  if (!cacheResult.success) return cacheResult;

  // Step 04: Compare three-way
  emit.emit('vault:reconciliation:comparing', { vault_id: input.vault_id });
  const comparisonResult = compareThreeWay(
    localResult.data.file_hashes,
    remoteResult.data.file_hashes,
    cacheResult.data.file_hashes
  );
  if (!comparisonResult.success) return comparisonResult;

  // Step 05: Generate report
  emit.emit('vault:reconciliation:generating-report', { vault_id: input.vault_id });
  const reportResult = generateReport(input.vault_id, comparisonResult.data);
  if (!reportResult.success) return reportResult;

  // Step 06: Save cache
  emit.emit('vault:reconciliation:saving-cache', { vault_path: input.vault_path });
  const cacheWriteResult = await saveCache(input.vault_path, localResult.data.file_hashes);
  if (!cacheWriteResult.success) return cacheWriteResult;

  emit.emit('vault:reconciliation:completed', {
    vault_id: input.vault_id,
    has_changes: reportResult.data.has_changes,
    has_conflicts: reportResult.data.has_conflicts,
  });

  return { success: true, data: reportResult.data };
}
