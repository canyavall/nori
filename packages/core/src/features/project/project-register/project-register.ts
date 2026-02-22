import { basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Database } from 'sql.js';
import type { FlowResult, Project } from '@nori/shared';
import { validatePath } from './actions/validate-path.js';
import { detectGit } from './actions/detect-git.js';
import { initNoriDir } from './actions/init-nori-dir.js';
import { saveToDb } from './actions/save-to-db.js';

export interface ProjectRegisterInput {
  path: string;
  name?: string;
  db: Database;
}

export async function runProjectRegister(
  input: ProjectRegisterInput,
): Promise<FlowResult<{ project: Project }>> {
  const { path, name, db } = input;

  const pathResult = validatePath(path);
  if (!pathResult.success) return pathResult;

  const gitResult = detectGit(path);
  if (!gitResult.success) return gitResult;

  const projectId = randomUUID();
  const projectName = name ?? basename(path);

  const noriResult = initNoriDir(path, projectId);
  if (!noriResult.success) return noriResult;

  const project: Project = {
    id: projectId,
    name: projectName,
    path,
    is_git: gitResult.data.is_git,
    connected_vaults: noriResult.data.settings.connected_vaults,
    created_at: new Date().toISOString(),
  };

  const saveResult = saveToDb(db, project);
  if (!saveResult.success) return saveResult;

  return { success: true, data: { project: saveResult.data.project } };
}
