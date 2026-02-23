import type { Database } from 'sql.js';
import type { StepResult, FlowError, Vault } from '@nori/shared';

export function validateVault(
  db: Database,
  vaultId: string
): StepResult<Vault> | FlowError {
  const rows = db.exec(
    'SELECT id, name, vault_type, git_url, branch, local_path, created_at, updated_at, last_synced_at FROM vaults WHERE id = ?',
    [vaultId]
  );

  if (!rows.length || !rows[0].values.length) {
    return {
      success: false,
      error: {
        code: 'VAULT_NOT_FOUND',
        message: `Vault ${vaultId} not found`,
        step: '01-validate-vault',
        severity: 'error',
        recoverable: true,
        details: { vault_id: vaultId },
      },
    };
  }

  const [id, name, vault_type, git_url, branch, local_path, created_at, updated_at, last_synced_at] =
    rows[0].values[0] as [string, string, 'git' | 'local', string | null, string | null, string, string, string, string | null];

  return {
    success: true,
    data: { id, name, vault_type, git_url, branch, local_path, created_at, updated_at, last_synced_at },
  };
}
