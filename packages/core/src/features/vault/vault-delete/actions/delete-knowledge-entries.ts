import type { Database } from 'sql.js';
import type { StepResult, FlowError } from '@nori/shared';

export function deleteKnowledgeEntries(db: Database, vaultId: string): StepResult<{ vault_id: string }> | FlowError {
  try {
    db.run('DELETE FROM knowledge_entries WHERE vault_id = ?', [vaultId]);
    return { success: true, data: { vault_id: vaultId } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'DB_DELETE_FAILED',
        message: `Failed to delete knowledge entries: ${message}`,
        step: '02-delete-knowledge-entries',
        severity: 'fatal',
        recoverable: false,
        details: { vault_id: vaultId, error: message },
      },
    };
  }
}
