import { getDatabase } from './index.js';
import { Role } from './types.js';

/**
 * Save active role
 */
export function saveActiveRole(role: string): void {
  const db = getDatabase();
  db.prepare('UPDATE roles SET active_role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(role);
}

/**
 * Load active role
 */
export function loadActiveRole(): string {
  const db = getDatabase();
  const result = db.prepare('SELECT active_role FROM roles WHERE id = 1').get() as Role | undefined;
  return result?.active_role || 'engineer';
}
