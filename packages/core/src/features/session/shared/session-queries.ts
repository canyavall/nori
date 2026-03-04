import type { Database } from 'sql.js';
import type { Session } from '@nori/shared';
import { queryOne, mapRow } from '../../shared/utils/database.js';

const SESSION_SPEC = {};

export function querySessionById(db: Database, id: string): Session | null {
  const row = queryOne(db, 'SELECT * FROM sessions WHERE id = ?', [id]);
  return row ? mapRow<Session>(row, SESSION_SPEC) : null;
}

export function queryActiveSession(db: Database): Session | null {
  const row = queryOne(db, "SELECT * FROM sessions WHERE status = 'active' LIMIT 1");
  return row ? mapRow<Session>(row, SESSION_SPEC) : null;
}
