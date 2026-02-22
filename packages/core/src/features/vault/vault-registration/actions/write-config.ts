import type { Database } from 'sql.js';
import type { StepResult, FlowError, Vault } from '@nori/shared';

export async function writeConfig(
  db: Database,
  vaultName: string,
  gitUrl: string,
  branch: string,
  localPath: string
): Promise<StepResult<Vault> | FlowError> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    db.run(
      `INSERT INTO vaults (id, name, vault_type, git_url, branch, local_path, created_at, updated_at)
       VALUES (?, ?, 'git', ?, ?, ?, ?, ?)`,
      [id, vaultName, gitUrl, branch, localPath, now, now]
    );

    return {
      success: true,
      data: {
        id,
        name: vaultName,
        vault_type: 'git' as const,
        git_url: gitUrl,
        branch,
        local_path: localPath,
        created_at: now,
        updated_at: now,
        last_synced_at: null,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('UNIQUE constraint') || message.includes('unique')) {
      return {
        success: false,
        error: {
          code: 'DUPLICATE_VAULT_NAME',
          message: `Vault name already exists: ${vaultName}`,
          step: '04-write-config',
          severity: 'error',
          recoverable: true,
          details: { vault_name: vaultName, url: gitUrl },
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'DB_WRITE_FAILED',
        message: `Failed to write vault configuration: ${message}`,
        step: '04-write-config',
        severity: 'fatal',
        recoverable: false,
        details: { vault_name: vaultName, url: gitUrl, error: message },
      },
    };
  }
}
