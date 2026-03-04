import type { Database } from 'sql.js';
import type { StepResult, FlowError, KnowledgeEntry } from '@nori/shared';

export interface WriteDatabaseResult {
  entry_count: number;
  write_duration_ms: number;
}

export function writeDatabase(
  db: Database,
  vaultId: string,
  entries: KnowledgeEntry[]
): StepResult<WriteDatabaseResult> | FlowError {
  const start = Date.now();

  try {
    // Clear existing entries for this vault
    db.run('DELETE FROM knowledge_entries WHERE vault_id = ?', [vaultId]);

    // Insert all entries
    for (const entry of entries) {
      db.run(
        `INSERT INTO knowledge_entries (id, vault_id, file_path, title, category, tags, description, required_knowledge, rules, content_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.id,
          entry.vault_id,
          entry.file_path,
          entry.title,
          entry.category,
          JSON.stringify(entry.tags),
          entry.description,
          JSON.stringify(entry.required_knowledge),
          JSON.stringify(entry.rules),
          entry.content_hash,
          entry.created_at,
          entry.updated_at,
        ]
      );
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
        code: 'DB_WRITE_FAILED',
        message: `Failed to write knowledge entries to database: ${message}`,
        step: '05-write-database',
        severity: 'fatal',
        recoverable: false,
        details: { vault_id: vaultId, entry_count: entries.length, error: message },
      },
    };
  }
}
