import type { Database } from 'sql.js';
import type { StepResult, FlowError, KnowledgeEntry } from '@nori/shared';
import { queryKnowledgeEntries } from '../../../knowledge/shared/knowledge-queries.js';

export interface LoadEntriesResult {
  entries: KnowledgeEntry[];
  entry_count: number;
}

export function loadAllEntries(
  db: Database,
  vaultId: string
): StepResult<LoadEntriesResult> | FlowError {
  try {
    const entries = queryKnowledgeEntries(db, vaultId);

    return {
      success: true,
      data: {
        entries,
        entry_count: entries.length,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'DB_READ_FAILED',
        message: `Failed to load knowledge entries: ${message}`,
        step: '01-load-all-entries',
        severity: 'error',
        recoverable: false,
        details: { vault_id: vaultId, error: message },
      },
    };
  }
}
