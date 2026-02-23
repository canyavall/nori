import { createHash } from 'node:crypto';
import type { Database } from 'sql.js';
import type { StepResult, FlowError } from '@nori/shared';

export interface RegenerateIndexResult {
  total_entries: number;
  build_duration_ms: number;
}

export function regenerateIndex(
  entryId: string,
  vaultId: string,
  filePath: string,
  title: string,
  category: string,
  tags: string[],
  description: string,
  requiredKnowledge: string[],
  rules: string[],
  content: string,
  db: Database
): StepResult<RegenerateIndexResult> | FlowError {
  const start = Date.now();
  const contentHash = createHash('sha256').update(content).digest('hex').slice(0, 16);
  const now = new Date().toISOString();

  try {
    db.run(
      `INSERT OR REPLACE INTO knowledge_entries
         (id, vault_id, file_path, title, category, tags, description, required_knowledge, rules, content_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [entryId, vaultId, filePath, title, category, JSON.stringify(tags), description, JSON.stringify(requiredKnowledge), JSON.stringify(rules), contentHash, now, now]
    );

    return {
      success: true,
      data: { total_entries: 1, build_duration_ms: Date.now() - start },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'INDEX_UPDATE_FAILED',
        message: `Failed to insert knowledge entry into database: ${message}`,
        step: '05-regenerate-index',
        severity: 'error',
        recoverable: false,
        details: { error: message },
      },
    };
  }
}
