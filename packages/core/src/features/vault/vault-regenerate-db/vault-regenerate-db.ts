import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { scanVaultFiles } from './actions/scan-vault-files.js';
import { parseFrontmatter } from './actions/parse-frontmatter.js';
import { validateEntries } from './actions/validate-entries.js';
import { buildIndex } from './actions/build-index.js';
import { writeDatabase } from './actions/write-database.js';
import { reportMetrics } from './actions/report-metrics.js';

export interface VaultRegenerateDbInput {
  vault_id: string;
  vault_path: string;
  db: Database;
}

export interface VaultRegenerateDbResult {
  entry_count: number;
  skipped_count: number;
  build_duration_ms: number;
}

export async function runVaultRegenerateDb(
  input: VaultRegenerateDbInput,
  emitter?: FlowEmitter
): Promise<FlowResult<VaultRegenerateDbResult>> {
  const emit = emitter ?? createNoopEmitter();
  const flowStart = Date.now();

  emit.emit('vault:regenerate-db:started', { vault_id: input.vault_id });

  // Step 01: Scan vault files
  emit.emit('vault:regenerate-db:scanning', { vault_path: input.vault_path });
  const scanResult = scanVaultFiles(input.vault_path);

  if (scanResult.data.file_count === 0) {
    emit.emit('vault:regenerate-db:completed', { entry_count: 0 });
    return {
      success: true,
      data: { entry_count: 0, skipped_count: 0, build_duration_ms: Date.now() - flowStart },
    };
  }

  // Step 02: Parse frontmatter
  emit.emit('vault:regenerate-db:parsing', { file_count: scanResult.data.file_count });
  const parseResult = parseFrontmatter(scanResult.data.file_paths);

  // Step 03: Validate entries
  emit.emit('vault:regenerate-db:validating', { parsed_count: parseResult.data.parsed_count });
  const validateResult = validateEntries(parseResult.data.entries);

  // Step 04: Build index
  emit.emit('vault:regenerate-db:building', { valid_count: validateResult.data.valid_count });
  const indexResult = buildIndex(input.vault_id, input.vault_path, validateResult.data.valid_entries);

  // Step 05: Write database
  emit.emit('vault:regenerate-db:writing', { entry_count: indexResult.data.entry_count });
  const writeResult = writeDatabase(input.db, input.vault_id, indexResult.data.entries);
  if (!writeResult.success) return writeResult;

  // Step 06: Report metrics
  const skippedCount = parseResult.data.skipped_count + validateResult.data.invalid_count;
  const metrics = {
    entry_count: indexResult.data.entry_count,
    skipped_count: skippedCount,
    build_duration_ms: Date.now() - flowStart,
  };

  emit.emit('vault:regenerate-db:completed', { ...metrics });
  reportMetrics(metrics);

  return { success: true, data: metrics };
}
