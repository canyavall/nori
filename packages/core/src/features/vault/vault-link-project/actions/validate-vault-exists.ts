import type { Database } from 'sql.js';
import { existsSync } from 'node:fs';
import type { StepResult, FlowError, Vault } from '@nori/shared';
import { queryOne } from '../../../shared/utils/database.js';

export function validateVaultExists(db: Database, vaultId: string): StepResult<Vault> | FlowError {
  const row = queryOne(
    db,
    'SELECT id, name, git_url, branch, local_path, created_at, updated_at, last_synced_at FROM vaults WHERE id = ?',
    [vaultId]
  );

  if (!row) {
    return {
      success: false,
      error: {
        code: 'VAULT_NOT_FOUND',
        message: `Vault not found: ${vaultId}`,
        step: '01-validate-vault-exists',
        severity: 'error',
        recoverable: true,
        details: { vault_id: vaultId },
      },
    };
  }

  const vault: Vault = {
    id: row.id as string,
    name: row.name as string,
    git_url: row.git_url as string,
    branch: row.branch as string,
    local_path: row.local_path as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    last_synced_at: (row.last_synced_at as string) ?? null,
  };

  if (!existsSync(vault.local_path)) {
    return {
      success: false,
      error: {
        code: 'VAULT_DIR_MISSING',
        message: `Vault directory missing: ${vault.local_path}`,
        step: '01-validate-vault-exists',
        severity: 'error',
        recoverable: true,
        details: { vault_id: vaultId, vault_name: vault.name, local_path: vault.local_path },
      },
    };
  }

  return { success: true, data: vault };
}
