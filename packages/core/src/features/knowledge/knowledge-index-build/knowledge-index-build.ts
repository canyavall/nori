import type { Database } from 'sql.js';
import type { FlowEmitter, FlowResult } from '@nori/shared';
import { createNoopEmitter } from '../../shared/utils/flow-emitter.js';
import { fastPathCheck } from './actions/fast-path-check.js';
import { scanVault } from './actions/scan-vault.js';
import { parseFrontmatter } from './actions/parse-frontmatter.js';
import { validateMetadata } from './actions/validate-metadata.js';
import { buildIndex, type IndexData } from './actions/build-index.js';
import { writeIndex } from './actions/write-index.js';
import { reportMetrics, type BuildMetrics } from './actions/report-metrics.js';

export interface KnowledgeIndexBuildInput {
  vault_id: string;
  vault_path: string;
  index_path: string;
  db: Database;
}

export interface KnowledgeIndexBuildResult {
  entry_count: number;
  category_count: number;
  tag_count: number;
  build_duration_ms: number;
  fast_path_used: boolean;
}

export async function runKnowledgeIndexBuild(
  input: KnowledgeIndexBuildInput,
  emitter?: FlowEmitter
): Promise<FlowResult<KnowledgeIndexBuildResult>> {
  const emit = emitter ?? createNoopEmitter();
  const flowStart = Date.now();

  emit.emit('knowledge:index-build:started', { vault_id: input.vault_id });

  // Step 00: Fast-path check
  emit.emit('knowledge:index-build:checking-fast-path', { vault_id: input.vault_id });
  const fpResult = fastPathCheck(input.vault_path, input.index_path);
  if (!fpResult.data.rebuild_needed) {
    emit.emit('knowledge:index-build:skipped', { vault_id: input.vault_id, reason: 'index up to date' });
    return {
      success: true,
      data: {
        entry_count: 0,
        category_count: 0,
        tag_count: 0,
        build_duration_ms: Date.now() - flowStart,
        fast_path_used: true,
      },
    };
  }

  // Step 01: Scan vault
  emit.emit('knowledge:index-build:scanning', { vault_path: input.vault_path });
  const scanResult = scanVault(input.vault_path);

  if (scanResult.data.file_count === 0) {
    emit.emit('knowledge:index-build:completed', { entry_count: 0 });
    return {
      success: true,
      data: {
        entry_count: 0,
        category_count: 0,
        tag_count: 0,
        build_duration_ms: Date.now() - flowStart,
        fast_path_used: false,
      },
    };
  }

  // Step 02: Parse frontmatter
  emit.emit('knowledge:index-build:parsing', { file_count: scanResult.data.file_count });
  const parseResult = parseFrontmatter(scanResult.data.file_paths);

  // Step 03: Validate metadata
  emit.emit('knowledge:index-build:validating', { parsed_count: parseResult.data.parsed_count });
  const validateResult = validateMetadata(parseResult.data.entries);

  // Step 04: Build index
  emit.emit('knowledge:index-build:building', { valid_count: validateResult.data.valid_count });
  const indexResult = buildIndex(input.vault_id, input.vault_path, validateResult.data.valid_entries);

  // Step 05: Write index
  emit.emit('knowledge:index-build:writing', { entry_count: indexResult.data.entry_count });
  const writeResult = writeIndex(input.db, indexResult.data.entries);
  if (!writeResult.success) return writeResult;

  // Step 06: Report metrics
  const metrics: BuildMetrics = {
    entry_count: indexResult.data.entry_count,
    category_count: indexResult.data.category_count,
    tag_count: indexResult.data.tag_count,
    build_duration_ms: Date.now() - flowStart,
    skipped_count: parseResult.data.skipped_count + validateResult.data.invalid_count,
    fast_path_used: false,
  };

  emit.emit('knowledge:index-build:completed', { ...metrics });
  reportMetrics(metrics);

  return {
    success: true,
    data: {
      entry_count: metrics.entry_count,
      category_count: metrics.category_count,
      tag_count: metrics.tag_count,
      build_duration_ms: metrics.build_duration_ms,
      fast_path_used: false,
    },
  };
}
