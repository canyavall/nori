import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import type { VaultKnowledgeImportResponse } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { validateVault } from './actions/validate-vault.js';
import { scanSources } from './actions/scan-sources.js';
import { parseFiles } from './actions/parse-files.js';
import { importEntries } from './actions/import-entries.js';
import { regenerateIndex } from '../../knowledge/knowledge-create/actions/regenerate-index.js';

export interface VaultKnowledgeImportInput {
  vault_id: string;
  source_paths: string[];
  db: Database;
}

export async function runVaultKnowledgeImport(
  input: VaultKnowledgeImportInput,
  emitter?: FlowEmitter
): Promise<FlowResult<VaultKnowledgeImportResponse>> {
  const emit = emitter ?? createNoopEmitter();

  emit.emit('vault:knowledge-import:started', {
    vault_id: input.vault_id,
    source_count: input.source_paths.length,
  });

  // Step 01: Validate vault exists
  const vaultResult = validateVault(input.db, input.vault_id);
  if (!vaultResult.success) return vaultResult;
  const { local_path } = vaultResult.data;

  // Step 02: Scan sources for .md files
  emit.emit('vault:knowledge-import:scanning', { source_count: input.source_paths.length });
  const scanResult = scanSources(input.source_paths);
  if (!scanResult.success) return scanResult;

  const { file_paths } = scanResult.data;
  emit.emit('vault:knowledge-import:found', { file_count: file_paths.length });

  // Step 03: Parse frontmatter from each file
  for (const fp of file_paths) {
    emit.emit('vault:knowledge-import:parsing', { file_path: fp });
  }
  const parseResult = parseFiles(file_paths);
  if (!parseResult.success) return parseResult;

  const { parsed, skipped: parseSkipped } = parseResult.data;
  for (const s of parseSkipped) {
    emit.emit('vault:knowledge-import:entry-skipped', { file_path: s.file_path, reason: s.reason });
  }

  // Step 04: Import entries into vault
  const importResult = importEntries(
    input.db,
    input.vault_id,
    local_path,
    parsed,
    (title) => emit.emit('vault:knowledge-import:importing', { title })
  );
  if (!importResult.success) return importResult;

  const { imported_count, skipped_count } = importResult.data;

  // Step 05: Rebuild index (non-fatal)
  emit.emit('vault:knowledge-import:rebuilding-index', { vault_id: input.vault_id });
  regenerateIndex(input.vault_id, local_path);

  emit.emit('vault:knowledge-import:completed', {
    vault_id: input.vault_id,
    imported_count,
    skipped_count: skipped_count + parseSkipped.length,
  });

  return {
    success: true,
    data: {
      imported_count,
      skipped_count: skipped_count + parseSkipped.length,
    },
  };
}
