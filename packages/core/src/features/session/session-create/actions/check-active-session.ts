import type { Database } from 'sql.js';
import type { StepResult, FlowError, Session } from '@nori/shared';
import { queryOne } from '../../../shared/utils/database.js';

export interface CheckActiveResult {
  had_active: boolean;
  previous_session?: Session;
}

export function checkActiveSession(
  db: Database
): StepResult<CheckActiveResult> | FlowError {
  try {
    const row = queryOne(db, `SELECT * FROM sessions WHERE status = 'active' LIMIT 1`);

    if (!row) {
      return { success: true, data: { had_active: false } };
    }

    const previous = row as unknown as Session;

    // Archive the previously active session (non-fatal if fails)
    try {
      db.run(
        `UPDATE sessions SET status = 'archived', updated_at = datetime('now') WHERE id = ?`,
        [previous.id]
      );
    } catch {
      // Non-fatal: per step 02 error handling, failure to archive previous is not blocking
    }

    return {
      success: true,
      data: { had_active: true, previous_session: previous },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'CHECK_ACTIVE_FAILED',
        message: `Failed to check active sessions: ${message}`,
        step: '01-check-active-session',
        severity: 'fatal',
        recoverable: false,
        details: { error: message },
      },
    };
  }
}
