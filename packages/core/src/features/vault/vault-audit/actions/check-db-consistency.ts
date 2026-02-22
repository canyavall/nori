import { existsSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { StepResult, FlowError } from '@nori/shared';
import type { DbEntry } from './load-all-entries.js';

export interface ConsistencyResult {
  orphaned_db: string[];
  orphaned_files: string[];
}

function findMarkdownFiles(dir: string, baseDir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name.startsWith('.nori')) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      findMarkdownFiles(fullPath, baseDir, files);
    } else if (extname(entry.name) === '.md') {
      const relativePath = fullPath.slice(baseDir.length + 1);
      files.push(relativePath);
    }
  }
  return files;
}

export function checkDbConsistency(
  entries: DbEntry[],
  vaultPath: string
): StepResult<ConsistencyResult> | FlowError {
  const dbPaths = new Set(entries.map((e) => e.file_path));
  const diskPaths = new Set(findMarkdownFiles(vaultPath, vaultPath));

  // DB entries with no file on disk
  const orphanedDb: string[] = [];
  for (const dbPath of dbPaths) {
    if (!diskPaths.has(dbPath)) {
      orphanedDb.push(dbPath);
    }
  }

  // Files on disk with no DB entry
  const orphanedFiles: string[] = [];
  for (const diskPath of diskPaths) {
    if (!dbPaths.has(diskPath)) {
      orphanedFiles.push(diskPath);
    }
  }

  return {
    success: true,
    data: {
      orphaned_db: orphanedDb,
      orphaned_files: orphanedFiles,
    },
  };
}
