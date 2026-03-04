import type { Database } from 'sql.js';
import type { StepResult, FlowError, Session } from '@nori/shared';
import { querySessionById } from '../../shared/session-queries.js';

export function validateSessionExists(
  db: Database,
  sessionId: string
): StepResult<Session> | FlowError {
  try {
    const session = querySessionById(db, sessionId);

    if (!session) {
      return {
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Session not found: ${sessionId}`,
          step: '01-validate-session-exists',
          severity: 'error',
          recoverable: true,
          details: { session_id: sessionId },
        },
      };
    }

    return { success: true, data: session };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'SESSION_LOOKUP_FAILED',
        message: `Failed to look up session: ${message}`,
        step: '01-validate-session-exists',
        severity: 'fatal',
        recoverable: false,
        details: { session_id: sessionId, error: message },
      },
    };
  }
}
