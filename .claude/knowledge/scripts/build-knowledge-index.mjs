#!/usr/bin/env node
import fs from 'fs/promises';
import matter from './lib/frontmatter.mjs';
import { glob } from './lib/glob.mjs';
import path from 'path';

const VAULT_PATH = '.claude/knowledge/vault';
const CACHE_PATH = '.claude/knowledge/.cache/parsed-metadata.json';
const OUTPUT_PATH = '.claude/knowledge/knowledge.json';

async function getFingerprint(filePath) {
  const stat = await fs.stat(filePath);
  return `${stat.mtimeMs}-${stat.size}`;
}

async function loadCache() {
  try {
    const content = await fs.readFile(CACHE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { version: 1, files: {} };
  }
}

async function parseFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const { data } = matter(content);

  // Check if file has frontmatter
  if (Object.keys(data).length === 0) {
    return null; // No frontmatter, skip this file
  }

  // Validate required fields - skip if incomplete (work-in-progress)
  const required = ['tags', 'description', 'category'];
  for (const field of required) {
    if (!data[field]) {
      return null; // Incomplete frontmatter, skip this file
    }
  }

  return data;
}

async function buildIndex() {
  const startTime = Date.now();

  const cache = await loadCache();
  const files = await glob(`${VAULT_PATH}/**/*.md`);

  const knowledge = {};
  let rebuilt = 0;
  let cached = 0;
  let skipped = 0;
  const errors = [];
  const timings = []; // Track per-file timings

  await Promise.all(files.map(async (file) => {
    const fileStartTime = Date.now();

    try {
      const fingerprint = await getFingerprint(file);
      const cachedEntry = cache.files[file];

      // Check cache
      if (cachedEntry?.fingerprint === fingerprint) {
        // Restore from cache
        const metadata = cachedEntry.metadata;
        const category = metadata.category;
        const packageName = path.basename(file, '.md');

        if (!knowledge[category]) {
          knowledge[category] = {};
        }

        knowledge[category][packageName] = metadata;
        cached++;
        timings.push({ file, time: Date.now() - fileStartTime, cached: true });
        return;
      }

      // Parse file
      const metadata = await parseFile(file);

      // Skip files without frontmatter (orphaned or work-in-progress)
      if (!metadata) {
        skipped++;
        timings.push({ file, time: Date.now() - fileStartTime, skipped: true });
        return;
      }

      const packageName = path.basename(file, '.md');
      const category = metadata.category;

      if (!knowledge[category]) {
        knowledge[category] = {};
      }

      // Build package entry (use relative path for portability in submodules)
      const relativePath = path.relative(process.cwd(), file);
      const packageEntry = {
        tags: metadata.tags,
        description: metadata.description,
        required_knowledge: metadata.required_knowledge || [],
        knowledge_path: relativePath,
        category: category
      };

      knowledge[category][packageName] = packageEntry;

      // Update cache with full package entry
      cache.files[file] = {
        fingerprint,
        metadata: packageEntry
      };
      rebuilt++;

      const fileTime = Date.now() - fileStartTime;
      timings.push({ file, time: fileTime, cached: false });

    } catch (error) {
      errors.push({ file, error: error.message });
      timings.push({ file, time: Date.now() - fileStartTime, error: true });
    }
  }));

  // Report errors
  if (errors.length > 0) {
    console.error('\n❌ Errors during build:');
    errors.forEach(({ file, error }) => {
      console.error(`   ${file}: ${error}`);
    });
    process.exit(1);
  }

  // Write cache
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));

  // Write knowledge.json
  const output = { knowledge };
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2));

  // Performance summary
  const totalTime = Date.now() - startTime;
  const total = rebuilt + cached;
  const hitRate = total > 0 ? Math.round((cached / total) * 100) : 0;

  // Find slowest files
  const slowest = timings
    .filter(t => !t.cached && !t.error)
    .sort((a, b) => b.time - a.time)
    .slice(0, 5);

  const avgParseTime = rebuilt > 0
    ? timings
        .filter(t => !t.cached && !t.error)
        .reduce((sum, t) => sum + t.time, 0) / rebuilt
    : 0;

  // Performance gate - fail if too slow
  if (totalTime > 20000) {
    console.error('❌ CRITICAL: Build time >20s. This is unacceptable for SessionStart.');
    process.exit(1);
  }

  // Summary output
  const verbose = process.argv.includes('--verbose');

  if (verbose) {
    // Detailed output for debugging
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Knowledge Index Build Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total files:     ${files.length}`);
    console.log(`Indexed:         ${total} (${rebuilt} rebuilt, ${cached} cached)`);
    if (skipped > 0) {
      console.log(`Skipped:         ${skipped} (no frontmatter)`);
    }
    console.log(`Total time:      ${totalTime}ms`);
    console.log(`Avg parse time:  ${Math.round(avgParseTime)}ms per file`);

    if (slowest.length > 0 && rebuilt > 0) {
      console.log('\nSlowest files:');
      slowest.forEach(({ file, time }, i) => {
        const shortPath = path.relative(VAULT_PATH, file);
        console.log(`  ${i + 1}. ${shortPath} (${time}ms)`);
      });
    }

    if (totalTime > 1000) {
      console.log('\n⚠️  Warning: Build time >1s. Consider optimizing or reducing file count.');
    } else {
      console.log('\n✅ Performance: Acceptable (<1s)');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } else {
    // Simple one-line output for session start
    console.log(`✅ Knowledge index generated (${total} packages, ${totalTime}ms)`);
  }
}

// CLI
const forceRebuild = process.argv.includes('--force-rebuild');

if (forceRebuild) {
  try {
    await fs.unlink(CACHE_PATH);
    console.log('🗑️  Cache cleared (--force-rebuild)');
  } catch {}
}

await buildIndex();
