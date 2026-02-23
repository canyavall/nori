import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { StepResult, FlowError, KnowledgeEntry } from '@nori/shared';

export interface ExportResult {
  exported_count: number;
  destination_path: string;
}

export function exportFiles(
  entries: KnowledgeEntry[],
  destinationPath: string,
  onProgress: (title: string) => void
): StepResult<ExportResult> | FlowError {
  try {
    mkdirSync(destinationPath, { recursive: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'DESTINATION_NOT_WRITABLE',
        message: `Cannot create destination directory: ${message}`,
        step: '03-export-files',
        severity: 'fatal',
        recoverable: false,
        details: { destination_path: destinationPath, error: message },
      },
    };
  }

  let exportedCount = 0;

  for (const entry of entries) {
    onProgress(entry.title);

    try {
      if (!existsSync(entry.file_path)) continue;

      const content = readFileSync(entry.file_path, 'utf-8');
      const categoryDir = join(destinationPath, entry.category);
      mkdirSync(categoryDir, { recursive: true });

      const fileName = basename(entry.file_path);
      writeFileSync(join(categoryDir, fileName), content, 'utf-8');
      exportedCount++;
    } catch {
      // Skip files that can't be read/written
    }
  }

  return { success: true, data: { exported_count: exportedCount, destination_path: destinationPath } };
}
