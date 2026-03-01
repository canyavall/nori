import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { Database } from 'sql.js';
import type { StepResult, FlowError } from '@nori/shared';
import type { ParsedEntry } from './parse-files.js';

export interface ImportResult {
  imported_count: number;
  skipped_count: number;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function importEntries(
  db: Database,
  vaultId: string,
  vaultPath: string,
  entries: ParsedEntry[],
  onProgress: (title: string) => void
): StepResult<ImportResult> | FlowError {
  let importedCount = 0;
  let skippedCount = 0;
  const now = new Date().toISOString();

  for (const entry of entries) {
    const title = entry.title ?? 'untitled';
    const category = entry.category ?? 'general';
    onProgress(title);

    const slug = slugify(title);
    const categoryDir = join(vaultPath, category);
    const destPath = join(categoryDir, `${slug}.md`);

    if (existsSync(destPath)) {
      console.log(`[import-entries] skip (exists): ${destPath}`);
      skippedCount++;
      continue;
    }

    try {
      mkdirSync(categoryDir, { recursive: true });

      const frontmatter = {
        title,
        category,
        tags: entry.tags,
        description: entry.description ?? '',
        rules: entry.rules,
        required_knowledge: entry.required_knowledge,
        created: entry.created ?? now,
        updated: now,
      };
      const fileContent = matter.stringify(entry.content, frontmatter);
      writeFileSync(destPath, fileContent, 'utf-8');

      const entryId = crypto.randomUUID();
      const contentHash = Buffer.from(entry.content).toString('base64').slice(0, 32);

      db.run(
        `INSERT OR IGNORE INTO knowledge_entries (id, vault_id, file_path, title, category, tags, description, rules, required_knowledge, content_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [entryId, vaultId, destPath, title, category, JSON.stringify(entry.tags), entry.description ?? '', JSON.stringify(entry.rules), JSON.stringify(entry.required_knowledge), contentHash, now, now]
      );

      importedCount++;
    } catch (err) {
      console.log(`[import-entries] skip (write error): ${destPath} — ${err instanceof Error ? err.message : String(err)}`);
      skippedCount++;
    }
  }

  return { success: true, data: { imported_count: importedCount, skipped_count: skippedCount } };
}
