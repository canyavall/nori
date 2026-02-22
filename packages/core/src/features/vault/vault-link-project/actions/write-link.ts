import type { Database } from 'sql.js';
import type { StepResult, FlowError, VaultLink } from '@nori/shared';

export function writeLink(
  db: Database,
  vaultId: string,
  projectPath: string
): StepResult<VaultLink> | FlowError {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    db.run(
      `INSERT INTO vault_links (id, vault_id, project_path, created_at) VALUES (?, ?, ?, ?)`,
      [id, vaultId, projectPath, now]
    );

    return {
      success: true,
      data: {
        id,
        vault_id: vaultId,
        project_path: projectPath,
        created_at: now,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('UNIQUE') || message.includes('unique')) {
      return {
        success: false,
        error: {
          code: 'DUPLICATE_LINK',
          message: `Vault is already linked to this project`,
          step: '03-write-link',
          severity: 'error',
          recoverable: true,
          details: { vault_id: vaultId, project_path: projectPath },
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'DB_WRITE_FAILED',
        message: `Failed to write link: ${message}`,
        step: '03-write-link',
        severity: 'fatal',
        recoverable: false,
        details: { vault_id: vaultId, project_path: projectPath, error: message },
      },
    };
  }
}
