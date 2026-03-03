import type { Database } from 'sql.js';
import type { StepResult, FlowError } from '@nori/shared';
import { queryOne } from '../../../shared/utils/database.js';

export interface VaultRecord {
  id: string;
  name: string;
  vault_type: 'git' | 'local';
  local_path: string;
}

export function deleteVaultRecord(db: Database, vaultId: string): StepResult<VaultRecord> | FlowError {
  try {
    const row = queryOne(db, 'SELECT id, name, vault_type, local_path FROM vaults WHERE id = ?', [vaultId]);
    if (!row) {
      return {
        success: false,
        error: {
          code: 'VAULT_NOT_FOUND',
          message: `Vault not found: ${vaultId}`,
          step: '04-delete-vault-record',
          severity: 'error',
          recoverable: true,
          details: { vault_id: vaultId },
        },
      };
    }

    db.run('DELETE FROM vaults WHERE id = ?', [vaultId]);

    return {
      success: true,
      data: {
        id: row.id as string,
        name: row.name as string,
        vault_type: (row.vault_type as 'git' | 'local') ?? 'git',
        local_path: row.local_path as string,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'DB_DELETE_FAILED',
        message: `Failed to delete vault record: ${message}`,
        step: '04-delete-vault-record',
        severity: 'fatal',
        recoverable: false,
        details: { vault_id: vaultId, error: message },
      },
    };
  }
}
