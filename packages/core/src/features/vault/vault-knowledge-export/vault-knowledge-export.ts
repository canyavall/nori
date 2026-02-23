import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import type { VaultKnowledgeExportResponse } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { validateVault } from './actions/validate-vault.js';
import { loadEntries } from './actions/load-entries.js';
import { exportFiles } from './actions/export-files.js';

export interface VaultKnowledgeExportInput {
  vault_id: string;
  destination_path: string;
  db: Database;
}

export async function runVaultKnowledgeExport(
  input: VaultKnowledgeExportInput,
  emitter?: FlowEmitter
): Promise<FlowResult<VaultKnowledgeExportResponse>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('vault:knowledge-export:started', { vault_id: input.vault_id });

  // Step 01: Validate vault exists
  const vaultResult = validateVault(input.db, input.vault_id);
  if (!vaultResult.success) return vaultResult;

  // Step 02: Load all knowledge entries from DB
  emit.emit('vault:knowledge-export:loading-entries', { vault_id: input.vault_id });
  const entriesResult = loadEntries(input.db, input.vault_id);
  if (!entriesResult.success) return entriesResult;

  const { entries } = entriesResult.data;
  emit.emit('vault:knowledge-export:exporting', { entry_count: entries.length });

  // Step 03: Export files to destination
  const exportResult = exportFiles(
    entries,
    input.destination_path,
    (title) => emit.emit('vault:knowledge-export:entry-exported', { title })
  );
  if (!exportResult.success) return exportResult;

  const { exported_count, destination_path } = exportResult.data;

  emit.emit('vault:knowledge-export:completed', {
    vault_id: input.vault_id,
    exported_count,
    destination_path,
  });

  return {
    success: true,
    data: { exported_count, destination_path },
  };
}
