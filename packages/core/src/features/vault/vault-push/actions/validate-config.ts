import type { Database } from 'sql.js';
import type { StepResult, FlowError, Vault } from '@nori/shared';
import { validateVaultExists } from '../../vault-link-project/actions/validate-vault-exists.js';

export function validateConfig(db: Database, vaultId: string): StepResult<Vault> | FlowError {
  const result = validateVaultExists(db, vaultId);

  if (!result.success) {
    return {
      success: false,
      error: {
        ...result.error,
        step: '01-validate-config',
        code: result.error.code === 'VAULT_NOT_FOUND' ? 'VAULT_NOT_FOUND' : 'VAULT_DIR_MISSING',
      },
    };
  }

  return result;
}
