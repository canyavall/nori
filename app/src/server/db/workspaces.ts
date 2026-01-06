import { getDatabase } from './index.js';
import { Workspace, AppState } from './types.js';

/**
 * Create new workspace
 */
export function createWorkspace(name: string, path: string, vault?: string, vaultPath?: string): Workspace {
  const db = getDatabase();
  const now = Date.now();

  const result = db
    .prepare(
      `INSERT INTO workspaces (name, path, vault, vault_path, created_at, last_opened_at)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`
    )
    .get(name, path, vault || null, vaultPath || null, now, now) as Workspace;

  return result;
}

/**
 * Get all workspaces
 */
export function getAllWorkspaces(): Workspace[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM workspaces ORDER BY last_opened_at DESC').all() as Workspace[];
}

/**
 * Get workspace by ID
 */
export function getWorkspaceById(id: number): Workspace | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id) as Workspace | undefined;
}

/**
 * Update workspace
 */
export function updateWorkspace(id: number, updates: Partial<Omit<Workspace, 'id'>>): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.path !== undefined) {
    fields.push('path = ?');
    values.push(updates.path);
  }
  if (updates.vault !== undefined) {
    fields.push('vault = ?');
    values.push(updates.vault);
  }
  if (updates.vault_path !== undefined) {
    fields.push('vault_path = ?');
    values.push(updates.vault_path);
  }
  if (updates.last_opened_at !== undefined) {
    fields.push('last_opened_at = ?');
    values.push(updates.last_opened_at);
  }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE workspaces SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
}

/**
 * Delete workspace
 */
export function deleteWorkspace(id: number): void {
  const db = getDatabase();
  db.prepare('DELETE FROM workspaces WHERE id = ?').run(id);
}

/**
 * Get active workspace ID
 */
export function getActiveWorkspaceId(): number | null {
  const db = getDatabase();
  const result = db.prepare('SELECT active_workspace_id FROM app_state WHERE id = 1').get() as AppState | undefined;
  return result?.active_workspace_id || null;
}

/**
 * Set active workspace ID
 */
export function setActiveWorkspaceId(workspaceId: number | null): void {
  const db = getDatabase();
  db.prepare('UPDATE app_state SET active_workspace_id = ? WHERE id = 1').run(workspaceId);
}
