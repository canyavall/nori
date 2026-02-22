import type { Database } from 'sql.js';
import { join } from 'node:path';
import type { StepResult, FlowError, FlowEmitter } from '@nori/shared';
import { runKnowledgeIndexBuild } from '../../../knowledge/knowledge-index-build/knowledge-index-build.js';
import { createNoopEmitter } from '../../../shared/utils/flow-emitter.js';

export interface IndexResult {
  vault_id: string;
  entry_count: number;
}

export async function buildIndex(
  vaultId: string,
  localPath: string,
  db: Database,
  emitter?: FlowEmitter
): Promise<StepResult<IndexResult> | FlowError> {
  try {
    const result = await runKnowledgeIndexBuild(
      {
        vault_id: vaultId,
        vault_path: localPath,
        index_path: join(localPath, '.nori-index'),
        db,
      },
      emitter ?? createNoopEmitter()
    );

    if (!result.success) {
      return {
        success: false,
        error: {
          code: 'INDEX_BUILD_FAILED',
          message: result.error?.message ?? 'Knowledge index build failed',
          severity: 'warning' as const,
          recoverable: true,
        },
      };
    }

    return {
      success: true,
      data: {
        vault_id: vaultId,
        entry_count: result.data.entry_count,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'INDEX_BUILD_EXCEPTION',
        message: err instanceof Error ? err.message : 'Unknown index build error',
        severity: 'warning' as const,
        recoverable: true,
      },
    };
  }
}
