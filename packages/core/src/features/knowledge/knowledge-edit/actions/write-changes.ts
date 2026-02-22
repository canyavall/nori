import { writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import matter from 'gray-matter';
import type { StepResult, FlowError, KnowledgeFrontmatter } from '@nori/shared';

export interface WriteChangesResult {
  file_path: string;
  file_size: number;
}

export function writeChanges(
  filePath: string,
  frontmatter: KnowledgeFrontmatter,
  content: string
): StepResult<WriteChangesResult> | FlowError {
  const dir = dirname(filePath);
  const tmpPath = join(dir, `.${Date.now()}.tmp`);

  try {
    const updatedFrontmatter = {
      ...frontmatter,
      updated: new Date().toISOString(),
    };

    const fileContent = matter.stringify(content, updatedFrontmatter);

    // Atomic write: write to temp file, then rename
    writeFileSync(tmpPath, fileContent, 'utf-8');
    renameSync(tmpPath, filePath);

    return {
      success: true,
      data: {
        file_path: filePath,
        file_size: Buffer.byteLength(fileContent, 'utf-8'),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // Attempt to clean up temp file
    try {
      unlinkSync(tmpPath);
    } catch {
      // Ignore cleanup errors
    }

    if (message.includes('EACCES') || message.includes('EPERM')) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: `Permission denied writing to ${filePath}`,
          step: '03-write-changes',
          severity: 'fatal',
          recoverable: false,
          details: { file_path: filePath, error: message, vault_directory: dir },
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'WRITE_FAILED',
        message: `Failed to write changes to knowledge file: ${message}`,
        step: '03-write-changes',
        severity: 'fatal',
        recoverable: false,
        details: { file_path: filePath, error: message },
      },
    };
  }
}
