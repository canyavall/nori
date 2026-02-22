import type { Database } from 'sql.js';
import type { StepResult, FlowError, Project } from '@nori/shared';

export function saveToDb(
  db: Database,
  project: Omit<Project, 'connected_vaults'> & { connected_vaults: string[] },
): StepResult<{ project: Project }> | FlowError {
  try {
    db.run(
      `INSERT OR REPLACE INTO projects (id, name, path, is_git, connected_vaults, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        project.id,
        project.name,
        project.path,
        project.is_git ? 1 : 0,
        JSON.stringify(project.connected_vaults),
        project.created_at,
      ],
    );
    return { success: true, data: { project: project as Project } };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'DB_WRITE_FAILED',
        message: err instanceof Error ? err.message : 'Failed to save project to database',
      },
    };
  }
}
