#!/usr/bin/env node
import fs from 'fs/promises';
import matter from './lib/frontmatter.mjs';
import { glob } from './lib/glob.mjs';

const REQUIRED_FIELDS = ['tags', 'description', 'category'];
const OPTIONAL_FIELDS = ['required_knowledge'];

async function validateFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');

  let data;
  try {
    const parsed = matter(content);
    data = parsed.data;
  } catch (error) {
    return [`Failed to parse frontmatter: ${error.message}`];
  }

  const errors = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate tags
  if (data.tags) {
    if (!Array.isArray(data.tags)) {
      errors.push('tags must be an array');
    } else if (data.tags.length < 3) {
      errors.push('tags must have at least 3 items');
    } else if (data.tags.length > 12) {
      errors.push('tags must have at most 12 items');
    }
  }

  // Validate description
  if (data.description && typeof data.description !== 'string') {
    errors.push('description must be a string');
  } else if (data.description && data.description.length === 0) {
    errors.push('description cannot be empty');
  }

  // Validate category
  if (data.category && typeof data.category !== 'string') {
    errors.push('category must be a string');
  }

  // Validate required_knowledge
  if (data.required_knowledge && !Array.isArray(data.required_knowledge)) {
    errors.push('required_knowledge must be an array');
  }

  return errors;
}

async function validateAll() {
  const files = await glob('.claude/knowledge/vault/**/*.md');
  const results = [];

  let totalFiles = 0;
  let validFiles = 0;
  let invalidFiles = 0;

  for (const file of files) {
    totalFiles++;
    try {
      const errors = await validateFile(file);
      if (errors.length > 0) {
        results.push({ file, errors });
        invalidFiles++;
      } else {
        validFiles++;
      }
    } catch (error) {
      results.push({ file, errors: [`Validation error: ${error.message}`] });
      invalidFiles++;
    }
  }

  if (results.length > 0) {
    console.error('\n❌ Validation errors found:\n');
    results.forEach(({ file, errors }) => {
      console.error(`${file}:`);
      errors.forEach(err => console.error(`  - ${err}`));
      console.error('');
    });
    console.error(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.error(`📊 Validation Summary`);
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.error(`Total files:   ${totalFiles}`);
    console.error(`Valid:         ${validFiles}`);
    console.error(`Invalid:       ${invalidFiles}`);
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    process.exit(1);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Frontmatter Validation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total files:   ${totalFiles}`);
  console.log(`Valid:         ${validFiles}`);
  console.log(`Invalid:       ${invalidFiles}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`✓ All ${files.length} files have valid frontmatter\n`);
}

await validateAll();
