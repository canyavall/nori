import type { Database } from 'sql.js';
import type { StepResult, FlowError } from '@nori/shared';

export interface DeleteLinkResult {
  link_id: string;
  vault_id: string;
  project_path: string;
}

export function deleteLink(
  db: Database,
  vaultId: string,
  linkId: string,
  projectPath: string
): StepResult<DeleteLinkResult> | FlowError {
  try {
    db.run(
      'DELETE FROM vault_links WHERE id = ? AND vault_id = ?',
      [linkId, vaultId]
    );

    return {
      success: true,
      data: { link_id: linkId, vault_id: vaultId, project_path: projectPath },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'DB_DELETE_FAILED',
        message: `Failed to delete link: ${message}`,
        step: '03-delete-link',
        severity: 'fatal',
        recoverable: false,
        details: { link_id: linkId, vault_id: vaultId, error: message },
      },
    };
  }
}
