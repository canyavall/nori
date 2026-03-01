import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { StepResult, FlowError } from '@nori/shared';

const READABLE_TEXT_EXTENSIONS = new Set(['.md', '.txt', '.rst', '.mdx', '.markdown']);

export interface ScanResult {
  file_paths: string[];
}

function collectTextFiles(dirPath: string, results: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dirPath);
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        collectTextFiles(fullPath, results);
      } else if (READABLE_TEXT_EXTENSIONS.has(extname(entry).toLowerCase())) {
        results.push(fullPath);
      }
    } catch {
      // Skip inaccessible entries
    }
  }
}

export function scanSources(
  sourcePaths: string[]
): StepResult<ScanResult> | FlowError {
  const filePaths: string[] = [];

  for (const sourcePath of sourcePaths) {
    try {
      const stat = statSync(sourcePath);
      if (stat.isDirectory()) {
        collectTextFiles(sourcePath, filePaths);
      } else if (READABLE_TEXT_EXTENSIONS.has(extname(sourcePath).toLowerCase())) {
        filePaths.push(sourcePath);
      }
    } catch {
      return {
        success: false,
        error: {
          code: 'SOURCE_NOT_ACCESSIBLE',
          message: `Cannot access source path: ${sourcePath}`,
          step: '02-scan-sources',
          severity: 'error',
          recoverable: true,
          details: { path: sourcePath },
        },
      };
    }
  }

  if (!filePaths.length) {
    return {
      success: false,
      error: {
        code: 'NO_TEXT_FILES',
        message: 'No text files found in the provided sources',
        step: '02-scan-sources',
        severity: 'error',
        recoverable: true,
        details: { source_paths: sourcePaths },
      },
    };
  }

  return { success: true, data: { file_paths: filePaths } };
}
