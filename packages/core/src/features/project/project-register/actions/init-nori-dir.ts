import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { StepResult, FlowError, ProjectSettings } from '@nori/shared';
import { NORI_DATA_DIR_NAME } from '@nori/shared';

export function initNoriDir(
  projectPath: string,
  projectId: string,
): StepResult<{ nori_path: string; settings: ProjectSettings }> | FlowError {
  const noriPath = join(projectPath, NORI_DATA_DIR_NAME);
  const settingsPath = join(noriPath, 'settings.json');

  if (!existsSync(noriPath)) {
    mkdirSync(noriPath, { recursive: true });
  }

  // If settings.json already exists, read it (re-registering existing project)
  if (existsSync(settingsPath)) {
    try {
      const existing: ProjectSettings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      return { success: true, data: { nori_path: noriPath, settings: existing } };
    } catch {
      // Overwrite if corrupted
    }
  }

  const settings: ProjectSettings = {
    version: '1',
    project_id: projectId,
    connected_vaults: [],
    created_at: new Date().toISOString(),
  };

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');

  // Also write a .gitignore inside .nori to keep logs out of git
  const gitignorePath = join(noriPath, '.gitignore');
  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, 'logs/\n*.log\n', 'utf-8');
  }

  return { success: true, data: { nori_path: noriPath, settings } };
}
