import { existsSync } from 'node:fs';
import type { Database } from 'sql.js';
import type { FlowResult, Project } from '@nori/shared';
import { queryAll } from '../../shared/utils/database.js';

export interface ProjectListInput {
  db: Database;
}

export async function runProjectList(
  input: ProjectListInput,
): Promise<FlowResult<{ projects: Project[] }>> {
  const rows = queryAll(input.db, 'SELECT * FROM projects ORDER BY created_at DESC');

  const projects: Project[] = rows.map((row) => {
    // vault_links is the source of truth — connected_vaults column is stale after registration
    const links = queryAll(
      input.db,
      'SELECT vault_id FROM vault_links WHERE project_path = ?',
      [row.path],
    );
    return {
      id: row.id as string,
      name: row.name as string,
      path: row.path as string,
      is_git: (row.is_git as number) === 1,
      connected_vaults: links.map((l) => l.vault_id as string),
      created_at: row.created_at as string,
    };
  });

  // Filter out projects whose path no longer exists on disk
  const existing = projects.filter((p) => existsSync(p.path));

  return { success: true, data: { projects: existing } };
}
