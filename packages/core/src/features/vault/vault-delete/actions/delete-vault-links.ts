import type { Database } from 'sql.js';
import type { StepResult, FlowError } from '@nori/shared';

export function deleteVaultLinks(db: Database, vaultId: string): StepResult<{ vault_id: string }> | FlowError {
  try {
    db.run('DELETE FROM vault_links WHERE vault_id = ?', [vaultId]);
    return { success: true, data: { vault_id: vaultId } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'DB_DELETE_FAILED',
        message: `Failed to delete vault links: ${message}`,
        step: '03-delete-vault-links',
        severity: 'fatal',
        recoverable: false,
        details: { vault_id: vaultId, error: message },
      },
    };
  }
}
