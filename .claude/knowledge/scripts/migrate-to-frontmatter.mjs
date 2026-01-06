#!/usr/bin/env node
import fs from 'fs/promises';
import matter from './lib/frontmatter.mjs';
import path from 'path';

const KNOWLEDGE_JSON_PATH = '.claude/knowledge/knowledge.json';

async function loadKnowledgeJson() {
  const content = await fs.readFile(KNOWLEDGE_JSON_PATH, 'utf-8');
  return JSON.parse(content);
}

async function migrateFile(filePath, metadata) {
  // Check if file exists
  try {
    await fs.access(filePath);
  } catch {
    console.log(`⚠️  File not found: ${filePath}`);
    return { status: 'not_found' };
  }

  // Read existing content
  const content = await fs.readFile(filePath, 'utf-8');
  const parsed = matter(content);

  // Check if already has frontmatter
  if (Object.keys(parsed.data).length > 0) {
    console.log(`⏭️  Skipping ${filePath} (already has frontmatter)`);
    return { status: 'skipped' };
  }

  // Build frontmatter
  const frontmatter = {
    tags: metadata.tags,
    description: metadata.description,
    category: metadata.category,
    required_knowledge: metadata.required_knowledge || [],
  };

  // Create new content with frontmatter
  const newContent = matter.stringify(parsed.content, frontmatter);

  // Write back
  await fs.writeFile(filePath, newContent);
  console.log(`✓ Migrated ${filePath}`);
  return { status: 'migrated' };
}

async function migrateAll() {
  const startTime = Date.now();

  const knowledgeJson = await loadKnowledgeJson();
  let migrated = 0;
  let skipped = 0;
  let notFound = 0;
  let errors = 0;

  const results = [];

  for (const [category, packages] of Object.entries(knowledgeJson.knowledge)) {
    for (const [packageName, metadata] of Object.entries(packages)) {
      const filePath = metadata.knowledge_path;

      try {
        const result = await migrateFile(filePath, metadata);
        results.push({ file: filePath, ...result });

        if (result.status === 'migrated') migrated++;
        else if (result.status === 'skipped') skipped++;
        else if (result.status === 'not_found') notFound++;

      } catch (error) {
        console.error(`❌ Error migrating ${filePath}:`, error.message);
        results.push({ file: filePath, status: 'error', error: error.message });
        errors++;
      }
    }
  }

  const totalTime = Date.now() - startTime;

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Migration Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total packages:  ${migrated + skipped + notFound + errors}`);
  console.log(`Migrated:        ${migrated}`);
  console.log(`Skipped:         ${skipped} (already has frontmatter)`);
  console.log(`Not found:       ${notFound}`);
  console.log(`Errors:          ${errors}`);
  console.log(`Total time:      ${totalTime}ms`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (errors > 0) {
    console.error('❌ Migration completed with errors');
    process.exit(1);
  }

  if (notFound > 0) {
    console.warn('⚠️  Some files were not found (see output above)');
  }

  console.log('✅ Migration completed successfully\n');
}

// CLI
const dryRun = process.argv.includes('--dry-run');

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No files will be modified\n');
  // Override writeFile to do nothing
  const originalWriteFile = fs.writeFile;
  fs.writeFile = async () => {
    // no-op
  };
}

await migrateAll();
