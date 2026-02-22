import type { Database } from 'sql.js';
import type { StepResult, FlowError, KnowledgeEntry } from '@nori/shared';

export interface WriteIndexResult {
  entry_count: number;
  write_duration_ms: number;
}

export function writeIndex(
  db: Database,
  entries: KnowledgeEntry[]
): StepResult<WriteIndexResult> | FlowError {
  const start = Date.now();

  try {
    // Clear existing entries for this vault and reinsert
    if (entries.length > 0) {
      const vaultId = entries[0].vault_id;
      db.run('DELETE FROM knowledge_entries WHERE vault_id = ?', [vaultId]);

      for (const entry of entries) {
        db.run(
          `INSERT INTO knowledge_entries (id, vault_id, file_path, title, category, tags, content_hash, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            entry.id,
            entry.vault_id,
            entry.file_path,
            entry.title,
            entry.category,
            JSON.stringify(entry.tags),
            entry.content_hash,
            entry.created_at,
            entry.updated_at,
          ]
        );
      }
    }

    return {
      success: true,
      data: { entry_count: entries.length, write_duration_ms: Date.now() - start },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'INDEX_WRITE_FAILED',
        message: `Failed to write index: ${message}`,
        step: '05-write-index',
        severity: 'error',
        recoverable: false,
        details: { error: message },
      },
    };
  }
}
