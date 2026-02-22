import type { Database } from 'sql.js';
import type { StepResult, FlowError } from '@nori/shared';
import { queryAll } from '../../../shared/utils/database.js';

export interface KnowledgeEntryRow {
  id: string;
  vault_id: string;
  file_path: string;
  title: string;
  category: string;
  tags: string;
  content_hash: string;
}

export interface LoadKnowledgeEntriesResult {
  entries: KnowledgeEntryRow[];
  entry_count: number;
}

export function loadKnowledgeEntries(
  db: Database,
  vaultId: string
): StepResult<LoadKnowledgeEntriesResult> | FlowError {
  try {
    const rows = queryAll(db, 'SELECT * FROM knowledge_entries WHERE vault_id = ?', [vaultId]);
    const entries = rows as unknown as KnowledgeEntryRow[];

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
        message: `Failed to load knowledge entries for embedding: ${message}`,
        step: '01-load-knowledge-entries',
        severity: 'error',
        recoverable: false,
        details: { vault_id: vaultId, error: message },
      },
    };
  }
}
