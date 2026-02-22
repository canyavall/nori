import type { Database } from 'sql.js';
import type { StepResult, FlowError, KnowledgeEntry } from '@nori/shared';
import { queryAll } from '../../../shared/utils/database.js';

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
    const sql = vaultId
      ? 'SELECT * FROM knowledge_entries WHERE vault_id = ?'
      : 'SELECT * FROM knowledge_entries';
    const params = vaultId ? [vaultId] : [];

    const rows = queryAll(db, sql, params);

    const entries: KnowledgeEntry[] = rows.map((row) => ({
      id: row.id as string,
      vault_id: row.vault_id as string,
      file_path: row.file_path as string,
      title: row.title as string,
      category: row.category as string,
      tags: JSON.parse((row.tags as string) || '[]') as string[],
      content_hash: row.content_hash as string,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    }));

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
