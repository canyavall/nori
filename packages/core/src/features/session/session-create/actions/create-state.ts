import type { Database } from 'sql.js';
import type { StepResult, FlowError, SessionCreateResponse } from '@nori/shared';

export function createState(
  db: Database,
  vaultId: string,
  title: string
): StepResult<SessionCreateResponse> | FlowError {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    db.run(
      `INSERT INTO sessions (id, vault_id, title, status, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?)`,
      [id, vaultId, title, now, now]
    );

    return {
      success: true,
      data: { id, title },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'SESSION_CREATE_FAILED',
        message: `Failed to create session: ${message}`,
        step: '02-create-state',
        severity: 'fatal',
        recoverable: false,
        details: { vault_id: vaultId, title, error: message },
      },
    };
  }
}
