import type { Database } from 'sql.js';
import type { StepResult, FlowError, VaultLink } from '@nori/shared';

export function validateLinkExists(
  db: Database,
  vaultId: string,
  linkId: string
): StepResult<VaultLink> | FlowError {
  const row = db.exec(
    'SELECT id, vault_id, project_path, created_at FROM vault_links WHERE id = ? AND vault_id = ?',
    [linkId, vaultId]
  );

  if (!row.length || !row[0].values.length) {
    return {
      success: false,
      error: {
        code: 'LINK_NOT_FOUND',
        message: `No link found with id ${linkId} for this vault`,
        step: '02-validate-link-exists',
        severity: 'error',
        recoverable: true,
        details: { link_id: linkId, vault_id: vaultId },
      },
    };
  }

  const [id, vault_id, project_path, created_at] = row[0].values[0] as [string, string, string, string];

  return {
    success: true,
    data: { id, vault_id, project_path, created_at },
  };
}
