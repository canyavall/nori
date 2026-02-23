import { readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import type { ClaudeMdFile, FlowResult } from '@nori/shared';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  '.turbo',
  '.cache',
  '.next',
  '.nuxt',
  'coverage',
]);

const MAX_DEPTH = 8;

function scan(dir: string, projectPath: string, depth: number, results: ClaudeMdFile[]): void {
  if (depth > MAX_DEPTH) return;

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath, { throwIfNoEntry: false });
    if (!stat) continue;

    if (stat.isDirectory()) {
      if (!IGNORED_DIRS.has(entry)) {
        scan(fullPath, projectPath, depth + 1, results);
      }
    } else if (entry === 'CLAUDE.md') {
      const relativePath = relative(projectPath, fullPath).replace(/\\/g, '/');
      const dir_ = dirname(relativePath).replace(/\\/g, '/');
      results.push({ relativePath, dir: dir_ === '.' ? '.' : dir_ });
    }
  }
}

export function listClaudeMds(
  projectPath: string,
): FlowResult<{ files: ClaudeMdFile[] }> {
  const files: ClaudeMdFile[] = [];
  scan(projectPath, projectPath, 0, files);

  // Sort shallowest first, then alphabetically
  files.sort((a, b) => {
    const depthA = a.relativePath.split('/').length;
    const depthB = b.relativePath.split('/').length;
    if (depthA !== depthB) return depthA - depthB;
    return a.relativePath.localeCompare(b.relativePath);
  });

  return { success: true, data: { files } };
}
