import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import matter from 'gray-matter';
import type { StepResult, FlowError, KnowledgeFrontmatter } from '@nori/shared';

export interface WriteResult {
  entry_id: string;
  file_path: string;
  file_size: number;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function writeMarkdownFile(
  vaultPath: string,
  frontmatter: KnowledgeFrontmatter,
  content: string
): StepResult<WriteResult> | FlowError {
  const entryId = crypto.randomUUID();
  const slug = slugify(frontmatter.title);
  const fileName = `${slug}.md`;
  const categoryDir = join(vaultPath, frontmatter.category);
  const filePath = join(categoryDir, fileName);

  // Check if file already exists
  if (existsSync(filePath)) {
    return {
      success: false,
      error: {
        code: 'FILE_ALREADY_EXISTS',
        message: `File already exists: ${filePath}`,
        step: '03-write-markdown-file',
        severity: 'error',
        recoverable: true,
        details: { file_path: filePath, title: frontmatter.title },
      },
    };
  }

  try {
    // Ensure category directory exists
    mkdirSync(categoryDir, { recursive: true });

    const now = new Date().toISOString();
    const fullFrontmatter = Object.fromEntries(
      Object.entries({
        ...frontmatter,
        created: frontmatter.created ?? now,
        updated: now,
      }).filter(([, v]) => v !== undefined)
    );

    const fileContent = matter.stringify(content, fullFrontmatter);
    writeFileSync(filePath, fileContent, 'utf-8');

    return {
      success: true,
      data: {
        entry_id: entryId,
        file_path: filePath,
        file_size: Buffer.byteLength(fileContent, 'utf-8'),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('EACCES') || message.includes('EPERM')) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: `Permission denied writing to ${filePath}`,
          step: '03-write-markdown-file',
          severity: 'fatal',
          recoverable: false,
          details: { file_path: filePath, error: message, vault_directory: vaultPath },
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'WRITE_FAILED',
        message: `Failed to write knowledge file: ${message}`,
        step: '03-write-markdown-file',
        severity: 'fatal',
        recoverable: false,
        details: { file_path: filePath, error: message },
      },
    };
  }
}
