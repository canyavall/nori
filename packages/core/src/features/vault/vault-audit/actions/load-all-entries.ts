import type { Database } from 'sql.js';
import type { StepResult, FlowError } from '@nori/shared';
import { queryAll } from '../../../shared/utils/database.js';

export interface DbEntry {
  id: string;
  vault_id: string;
  file_path: string;
  title: string;
  category: string;
  tags: string;
  content_hash: string;
}

export interface LoadEntriesResult {
  entries: DbEntry[];
  entry_count: number;
}

export function loadAllEntries(
  db: Database,
  vaultId: string
): StepResult<LoadEntriesResult> | FlowError {
  try {
    const rows = queryAll(db, 'SELECT * FROM knowledge_entries WHERE vault_id = ?', [vaultId]);
    const entries = rows as unknown as DbEntry[];

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
