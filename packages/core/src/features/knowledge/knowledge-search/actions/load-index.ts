import type { Database } from 'sql.js';
import type { StepResult, FlowError, KnowledgeEntry } from '@nori/shared';
import { queryKnowledgeEntries } from '../../shared/knowledge-queries.js';

export interface LoadIndexResult {
  entries: KnowledgeEntry[];
  entry_count: number;
  load_duration_ms: number;
}

export function loadIndex(
  db: Database,
  vaultId?: string
): StepResult<LoadIndexResult> | FlowError {
  const start = Date.now();

  try {
    const entries = queryKnowledgeEntries(db, vaultId);

    return {
      success: true,
      data: {
        entries,
        entry_count: entries.length,
        load_duration_ms: Date.now() - start,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'INDEX_LOAD_FAILED',
        message: `Failed to load knowledge index: ${message}`,
        step: '01-load-index',
        severity: 'error',
        recoverable: true,
        details: { error: message },
      },
    };
  }
}
