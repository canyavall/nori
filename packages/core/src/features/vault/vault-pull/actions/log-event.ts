import type { Database } from 'sql.js';
import type { StepResult, FlowError } from '@nori/shared';

export interface LogEventResult {
  logged: boolean;
  last_synced_at: string;
}

export function logEvent(db: Database, vaultId: string): StepResult<LogEventResult> | FlowError {
  try {
    const now = new Date().toISOString();

    db.run(
      "UPDATE vaults SET last_synced_at = ?, updated_at = datetime('now') WHERE id = ?",
      [now, vaultId]
    );

    return {
      success: true,
      data: {
        logged: true,
        last_synced_at: now,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'LOG_EVENT_FAILED',
        message: `Failed to log pull event: ${message}`,
        step: '07-log-event',
        severity: 'warning',
        recoverable: true,
        details: { vault_id: vaultId, error: message },
      },
    };
  }
}
