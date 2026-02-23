import type { Database } from 'sql.js';
import type { StepResult, FlowError, KnowledgeEntry } from '@nori/shared';

export interface LoadEntriesResult {
  entries: KnowledgeEntry[];
}

export function loadEntries(
  db: Database,
  vaultId: string
): StepResult<LoadEntriesResult> | FlowError {
  try {
    const rows = db.exec(
      'SELECT id, vault_id, file_path, title, category, tags, description, required_knowledge, rules, content_hash, created_at, updated_at FROM knowledge_entries WHERE vault_id = ? ORDER BY category, title',
      [vaultId]
    );

    if (!rows.length) {
      return { success: true, data: { entries: [] } };
    }

    const entries: KnowledgeEntry[] = rows[0].values.map((row) => {
      const [id, vault_id, file_path, title, category, tagsJson, descriptionRaw, reqKnowledgeJson, rulesJson, content_hash, created_at, updated_at] =
        row as [string, string, string, string, string, string, string, string, string, string, string, string];

      let tags: string[] = [];
      try { tags = JSON.parse(tagsJson) as string[]; } catch { tags = []; }
      let required_knowledge: string[] = [];
      try { required_knowledge = JSON.parse(reqKnowledgeJson || '[]') as string[]; } catch { required_knowledge = []; }
      let rules: string[] = [];
      try { rules = JSON.parse(rulesJson || '[]') as string[]; } catch { rules = []; }

      return { id, vault_id, file_path, title, category, tags, description: descriptionRaw ?? '', required_knowledge, rules, content_hash, created_at, updated_at };
    });

    return { success: true, data: { entries } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'DB_QUERY_FAILED',
        message: `Failed to load knowledge entries: ${message}`,
        step: '02-load-entries',
        severity: 'fatal',
        recoverable: false,
        details: { vault_id: vaultId, error: message },
      },
    };
  }
}
