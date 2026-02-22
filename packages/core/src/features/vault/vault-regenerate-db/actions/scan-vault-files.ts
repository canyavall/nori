import { readdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { StepResult } from '@nori/shared';

export interface ScanResult {
  file_paths: string[];
  file_count: number;
  scan_duration_ms: number;
}

function findMarkdownFiles(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name.startsWith('.nori')) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      findMarkdownFiles(fullPath, files);
    } else if (extname(entry.name) === '.md') {
      files.push(fullPath);
    }
  }
  return files;
}

export function scanVaultFiles(vaultPath: string): StepResult<ScanResult> {
  const start = Date.now();
  const filePaths = findMarkdownFiles(vaultPath);

  return {
    success: true,
    data: {
      file_paths: filePaths,
      file_count: filePaths.length,
      scan_duration_ms: Date.now() - start,
    },
  };
}
