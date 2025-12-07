#!/usr/bin/env node

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, relative } from 'path';
import { fileURLToPath } from 'url';
import {
  KNOWLEDGE_BASE_PATH,
  loadKnowledgeMapping,
  resolvePath,
} from './knowledge-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TARGET_LINES = 70;  // Ideal target
const MAX_LINES = 105;    // Hard limit (error if exceeded)

// Whitelist for comprehensive guides that exceed limits (with justification)
const WHITELIST_COMPREHENSIVE = [
  'qa-scenarios-patterns.md',         // Comprehensive QA guide covering all scenario types, heuristics, and examples
  'button-ux-guidelines.md',          // Comprehensive Figma design system documentation with detailed specs
  'sygnum-ui-overview.md',            // Comprehensive Chakra UI component library catalog and migration guide
  'knowledge-tracking.md',            // Comprehensive knowledge tracking system documentation
  'hooks-system.md',                  // Comprehensive hooks system guide with all patterns
  'testing-flaky.md',                 // Comprehensive flaky test patterns and solutions
  'testing-isolation.md',             // Comprehensive test isolation patterns
  'testing-timer-patterns.md',        // Comprehensive timer and async testing patterns
  'testing-components-mocking.md',    // Comprehensive component mocking guide
  'testing-async-debugging.md',       // Comprehensive async debugging patterns
  'standards-lint-prevention.md',     // Comprehensive linting rules and prevention strategies
];

// Whitelist for non-knowledge files (should not be registered)
const WHITELIST_NON_KNOWLEDGE = [
  'tracker.md',                          // Knowledge usage tracking log
  '_templates',                          // Template directories
  'knowledge-usage-matrix.md',           // Analysis documents
];

const isWhitelistedNonKnowledge = (filePath) => {
  const relativePath = relative(KNOWLEDGE_BASE_PATH, filePath);
  return WHITELIST_NON_KNOWLEDGE.some(pattern =>
    relativePath.includes(pattern) || basename(filePath) === pattern
  );
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Parse CLI arguments
const args = process.argv.slice(2);
const summaryOnly = args.includes('--summary');
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
${colors.blue}Knowledge Validator${colors.reset}

Validates that all knowledge files comply with knowledge creation rules:
  - Files exist at declared paths
  - JSON keys match filenames
  - Tags are not empty
  - Categories are valid
  - Required knowledge references exist
  - No circular dependencies
  - Target: ≤70 lines (warn if 70-105, error if >105)
  - NO YAML frontmatter (plain markdown only)
  - Kebab-case naming

${colors.cyan}Usage:${colors.reset}
  node .ai/knowledge/scripts/validate-knowledge.mjs [options]

${colors.cyan}Options:${colors.reset}
  --summary    Show only summary statistics (hide detailed errors)
  --help, -h   Show this help message

${colors.cyan}Examples:${colors.reset}
  node .ai/knowledge/scripts/validate-knowledge.mjs           # Full validation with details
  node .ai/knowledge/scripts/validate-knowledge.mjs --summary # Quick summary only

${colors.cyan}Exit Codes:${colors.reset}
  0 - All knowledge files are compliant
  1 - Validation errors found
`);
  process.exit(0);
}

const log = {
  error: (msg) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.warn(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.blue}━━━ ${msg} ━━━${colors.reset}`),
};

const getFileLineCount = (filePath) => {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch (error) {
    return null;
  }
};

const hasYAMLFrontmatter = (filePath) => {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return content.trimStart().startsWith('---');
  } catch (error) {
    return false;
  }
};

const validateKnowledgeFile = (packageName, packageData, category) => {
  const errors = [];
  const warnings = [];

  // Get the file path using shared library
  const filePath = resolvePath(packageName, packageData, category);

  // 1. Check file exists
  if (!existsSync(filePath)) {
    errors.push(`File not found: ${filePath}`);
    return { errors, warnings }; // Can't check other rules if file doesn't exist
  }

  // 2. Check JSON key matches filename
  const fileNameWithoutExt = basename(filePath, '.md');
  if (fileNameWithoutExt !== packageName) {
    errors.push(`JSON key "${packageName}" doesn't match filename "${fileNameWithoutExt}.md"`);
  }

  // 3. Check tags are not empty
  const tags = packageData.tags || [];
  if (tags.length === 0) {
    errors.push(`Package has no tags - tags are MANDATORY`);
  }

  // 4. Validate tag format
  for (const tag of tags) {
    // Check lowercase
    if (tag !== tag.toLowerCase()) {
      warnings.push(`Tag not in lowercase: "${tag}" (should be "${tag.toLowerCase()}")`);
    }

    // Check kebab-case (no underscores)
    if (tag.includes('_')) {
      warnings.push(`Tag uses underscore: "${tag}" (should be "${tag.replace(/_/g, '-')}")`);
    }

    // Check for spaces
    if (tag.includes(' ')) {
      errors.push(`Tag contains spaces: "${tag}" (should use kebab-case)`);
    }
  }

  // 5. Check for too many tags
  if (tags.length > 8) {
    warnings.push(`Too many tags: ${tags.length} tags (recommend 3-6 tags)`);
  }

  // 6. Check line count
  const lineCount = getFileLineCount(filePath);
  const fileName = basename(filePath);
  const isWhitelisted = WHITELIST_COMPREHENSIVE.includes(fileName);

  if (lineCount === null) {
    errors.push(`Could not read file: ${filePath}`);
  } else if (lineCount > MAX_LINES && !isWhitelisted) {
    errors.push(`File exceeds hard limit of ${MAX_LINES} lines (has ${lineCount} lines): ${filePath}`);
  } else if (lineCount > TARGET_LINES && !isWhitelisted) {
    warnings.push(`File exceeds target of ${TARGET_LINES} lines (has ${lineCount} lines, max ${MAX_LINES}): ${filePath}`);
  } else if (isWhitelisted && lineCount > MAX_LINES) {
    warnings.push(`Whitelisted file exceeds limit (has ${lineCount} lines): ${filePath}`);
  }

  // 7. Check for YAML frontmatter
  if (hasYAMLFrontmatter(filePath)) {
    errors.push(`File has YAML frontmatter (should be plain markdown): ${filePath}`);
  }

  // 8. Check filename is kebab-case
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(packageName)) {
    warnings.push(`Package name "${packageName}" is not kebab-case`);
  }

  // 9. Check if knowledge_path is needed
  const expectedPath = resolvePath(packageName, { ...packageData, knowledge_path: null }, category);
  if (filePath !== expectedPath && !packageData.knowledge_path) {
    warnings.push(`File is at non-standard path but missing explicit knowledge_path field`);
  }

  return { errors, warnings, lineCount, filePath };
};

const validateCrossReferences = (packageName, packageData, allPackages) => {
  const errors = [];
  const warnings = [];

  // Check required_knowledge exists
  for (const dep of packageData.required_knowledge || []) {
    if (!allPackages.has(dep)) {
      errors.push(`required_knowledge references non-existent package: "${dep}"`);
    }
  }

  return { errors, warnings };
};

const detectCircularDependencies = (packageName, packageData, knowledgeByCategory, visited = new Set(), path = []) => {
  if (visited.has(packageName)) {
    // Found a cycle
    const cycleStart = path.indexOf(packageName);
    const cycle = [...path.slice(cycleStart), packageName];
    return [`Circular dependency detected: ${cycle.join(' → ')}`];
  }

  visited.add(packageName);
  path.push(packageName);

  const errors = [];
  const dependencies = packageData.required_knowledge || [];

  for (const dep of dependencies) {
    // Find the dependency package
    let depData = null;
    for (const packages of Object.values(knowledgeByCategory)) {
      if (packages[dep]) {
        depData = packages[dep];
        break;
      }
    }

    if (depData) {
      const cycleErrors = detectCircularDependencies(dep, depData, knowledgeByCategory, new Set(visited), [...path]);
      errors.push(...cycleErrors);
    }
  }

  return errors;
};

const getAllMarkdownFiles = (dir, fileList = []) => {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      getAllMarkdownFiles(filePath, fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  }

  return fileList;
};

const checkOrphanedFiles = (knowledgeByCategory) => {
  // Build set of all registered file paths
  const registeredFiles = new Set();

  for (const [category, packages] of Object.entries(knowledgeByCategory)) {
    if (typeof packages !== 'object' || packages === null) continue;

    for (const [packageName, packageData] of Object.entries(packages)) {
      if (typeof packageData !== 'object' || packageData === null) continue;

      // Get the file path using shared library
      const fullPath = resolvePath(packageName, packageData, category);
      registeredFiles.add(fullPath);
    }
  }

  // Get all markdown files in knowledge directory
  const allMarkdownFiles = getAllMarkdownFiles(KNOWLEDGE_BASE_PATH);

  // Find orphaned files (excluding whitelisted non-knowledge files)
  const orphanedFiles = allMarkdownFiles.filter(file =>
    !registeredFiles.has(file) && !isWhitelistedNonKnowledge(file)
  );

  return orphanedFiles;
};

const validateCategories = (knowledgeByCategory) => {
  const errors = [];
  const warnings = [];

  // Check if category structure is valid
  for (const [category, packages] of Object.entries(knowledgeByCategory)) {
    // Check category naming (should be hierarchical like technical/react)
    if (!category.includes('/') && category !== 'business' && category !== 'ai') {
      warnings.push(`Category "${category}" might need hierarchical structure (e.g., "domain/subcategory")`);
    }

    // Check if category has packages
    if (typeof packages !== 'object' || packages === null || Object.keys(packages).length === 0) {
      warnings.push(`Category "${category}" has no packages`);
    }
  }

  return { errors, warnings };
};

const validateAllKnowledge = () => {
  log.section('Knowledge Validation');

  let mapping;
  try {
    mapping = loadKnowledgeMapping();
  } catch (error) {
    log.error(`Failed to load knowledge.json: ${error.message}`);
    process.exit(1);
  }

  const knowledgeByCategory = mapping.knowledge || {};

  // Build set of all package names for cross-reference validation
  const allPackages = new Set();
  for (const packages of Object.values(knowledgeByCategory)) {
    if (typeof packages === 'object' && packages !== null) {
      for (const packageName of Object.keys(packages)) {
        allPackages.add(packageName);
      }
    }
  }

  let totalFiles = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  const failedPackages = [];
  const circularDeps = new Set(); // Track circular dependencies to avoid duplicates

  // Validate categories
  const categoryResult = validateCategories(knowledgeByCategory);
  totalErrors += categoryResult.errors.length;
  totalWarnings += categoryResult.warnings.length;

  if (categoryResult.errors.length > 0 || categoryResult.warnings.length > 0) {
    if (!summaryOnly) {
      log.section('Category Validation');
      categoryResult.errors.forEach(error => log.error(error));
      categoryResult.warnings.forEach(warning => log.warning(warning));
    }
  }

  // Iterate through categories, then through packages within each category
  for (const [category, packages] of Object.entries(knowledgeByCategory)) {
    if (typeof packages !== 'object' || packages === null) continue;

    for (const [packageName, packageData] of Object.entries(packages)) {
      if (typeof packageData !== 'object' || packageData === null) continue;

      totalFiles++;

      const result = validateKnowledgeFile(packageName, packageData, category);

      // Add cross-reference validation
      const crossRefResult = validateCrossReferences(packageName, packageData, allPackages);
      result.errors.push(...crossRefResult.errors);
      result.warnings.push(...crossRefResult.warnings);

      // Check for circular dependencies (only once per package)
      if (!circularDeps.has(packageName)) {
        const circularErrors = detectCircularDependencies(packageName, packageData, knowledgeByCategory);
        if (circularErrors.length > 0) {
          // Mark all packages in the cycle as checked
          circularErrors.forEach(err => {
            const match = err.match(/: (.+)$/);
            if (match) {
              const cycle = match[1].split(' → ');
              cycle.forEach(pkg => circularDeps.add(pkg));
            }
          });
          result.errors.push(...circularErrors);
        }
      }

      if (result.errors.length > 0 || result.warnings.length > 0) {
        if (!summaryOnly) {
          console.log(`\n${colors.cyan}Package: ${packageName} (${category})${colors.reset}`);

          result.errors.forEach(error => {
            log.error(error);
          });

          result.warnings.forEach(warning => {
            log.warning(warning);
          });
        }

        totalErrors += result.errors.length;
        totalWarnings += result.warnings.length;

        if (result.errors.length > 0) {
          failedPackages.push(`${category}/${packageName}`);
        }
      }

      if (result.lineCount && !summaryOnly) {
        const linePercentage = Math.round((result.lineCount / MAX_LINES) * 100);
        if (linePercentage >= 90 && linePercentage < 100) {
          console.log(`${colors.yellow}  ${category}/${packageName}: ${result.lineCount}/${MAX_LINES} lines (${linePercentage}%)${colors.reset}`);
        }
      }
    }
  }

  // Check for orphaned files
  const orphanedFiles = checkOrphanedFiles(knowledgeByCategory);
  if (orphanedFiles.length > 0) {
    if (!summaryOnly) {
      log.section('Orphaned Knowledge Files');
      console.log(`${colors.yellow}Found ${orphanedFiles.length} markdown file(s) not registered in knowledge.json:${colors.reset}`);
      orphanedFiles.forEach(file => {
        const relativePath = relative(join(__dirname, '../..'), file);
        log.warning(`${relativePath}`);
      });
      console.log('');
      log.info('These files exist but are not in knowledge.json. Either:');
      log.info('  1. Add them to knowledge.json if they should be tracked');
      log.info('  2. Delete them if they are obsolete');
      log.info('  3. Move them outside .ai/knowledge/ if they are not knowledge files');
    }
    totalWarnings += orphanedFiles.length;
  }

  // Summary
  log.section('Validation Summary');
  console.log(`Total files checked: ${totalFiles}`);
  console.log(`${colors.green}Passed: ${totalFiles - failedPackages.length}${colors.reset}`);

  if (totalErrors > 0) {
    console.log(`${colors.red}Failed: ${failedPackages.length} (${totalErrors} errors)${colors.reset}`);
  }

  if (totalWarnings > 0) {
    console.log(`${colors.yellow}Warnings: ${totalWarnings}${colors.reset}`);
  }

  if (orphanedFiles.length > 0) {
    console.log(`${colors.yellow}Orphaned files: ${orphanedFiles.length}${colors.reset}`);
  }

  if (failedPackages.length > 0 && !summaryOnly) {
    log.section('Failed Packages');
    failedPackages.forEach(pkg => console.log(`  - ${pkg}`));
  }

  // Exit with error code if validation failed
  if (totalErrors > 0) {
    console.log('');
    log.error('Knowledge validation failed!');
    if (summaryOnly) {
      log.info('Run without --summary to see detailed errors');
    }
    process.exit(1);
  } else {
    console.log('');
    log.success('All knowledge files are compliant!');
    process.exit(0);
  }
};

// Run validation
validateAllKnowledge();
