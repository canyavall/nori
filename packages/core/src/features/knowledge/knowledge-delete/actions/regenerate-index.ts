import type { Database } from 'sql.js';
import type { StepResult, FlowError } from '@nori/shared';

export interface RegenerateIndexResult {
  total_entries: number;
  build_duration_ms: number;
}

export function regenerateIndex(
  filePath: string,
  db: Database
): StepResult<RegenerateIndexResult> | FlowError {
  const start = Date.now();

  try {
    db.run(`DELETE FROM knowledge_entries WHERE file_path = ?`, [filePath]);

    return {
      success: true,
      data: {
        total_entries: 1,
        build_duration_ms: Date.now() - start,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'INDEX_UPDATE_FAILED',
        message: `Failed to remove knowledge entry from database: ${message}`,
        step: '04-regenerate-index',
        severity: 'error',
        recoverable: false,
        details: { error: message },
      },
    };
  }
}
