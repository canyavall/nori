#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const parseArguments = (args) => {
  const result = {
    planPath: null,
    maxTags: 6,
    help: false,
  };

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
      return result;
    }

    if (arg === '--plan-path' && nextArg) {
      result.planPath = nextArg;
      i++;
      continue;
    }

    if (arg === '--max-tags' && nextArg) {
      result.maxTags = parseInt(nextArg, 10);
      i++;
      continue;
    }
  }

  return result;
};

const showHelp = () => {
  const helpText = `
Extract Tags from Plan.md

Analyzes plan.md content and extracts relevant knowledge tags for automatic knowledge loading.

USAGE:
  node extract-tags-from-plan.mjs --plan-path <path>

OPTIONS:
  --plan-path <path>    Path to plan.md file (required)
  --max-tags <number>   Maximum tags to return (default: 6)
  --help, -h            Show this help message

OUTPUT:
  JSON array of tags: ["tag1", "tag2", "tag3", ...]

EXAMPLES:
  node extract-tags-from-plan.mjs --plan-path .claude/epics/epic-0001/plan.md
  node extract-tags-from-plan.mjs --plan-path .claude/epics/epic-0002/plan.md --max-tags 8
`;

  console.log(helpText);
};

/**
 * Get all available tags from knowledge.json
 */
const getAvailableTags = () => {
  try {
    const output = execSync('node .claude/knowledge/scripts/knowledge-search.mjs --list-tags', {
      encoding: 'utf-8',
      cwd: join(__dirname, '../../..'),
    });
    const parsed = JSON.parse(output);
    return new Set(parsed.tags || []);
  } catch (error) {
    console.error('Error loading available tags:', error.message);
    return new Set();
  }
};

/**
 * Keyword patterns mapped to knowledge tags
 * These are common technical terms that appear in plans
 */
const KEYWORD_TAG_MAPPING = {
  // Frameworks & Libraries
  'react': ['react', 'react-patterns', 'frontend'],
  'typescript': ['typescript', 'typescript-types', 'type-safety'],
  'jest': ['jest', 'testing', 'testing-basics'],
  'testing library': ['jest', 'rtl', 'testing-components-basics'],
  'rtl': ['jest', 'rtl', 'testing-components-basics'],
  'chakra': ['chakra-ui', 'chakra', 'sygnum-ui'],
  'mui': ['mui', 'suil'],
  'react-router': ['react-router', 'routing', 'navigation'],
  'react router': ['react-router', 'routing', 'navigation'],
  'msw': ['msw', 'api-mocking', 'testing'],
  'storybook': ['storybook', 'component-library', 'documentation'],
  'valtio': ['valtio', 'state-management'],
  'zustand': ['zustand', 'state-management'],
  'd3': ['d3', 'charts', 'data-visualization'],
  'nx': ['nx', 'monorepo', 'tooling'],

  // UI Components & Libraries
  'sygnum-ui': ['sygnum-ui', 'chakra', 'components'],
  'sygnum-themes': ['sygnum-themes', 'chakra', 'theming'],
  'suil': ['suil', 'mui', 'components'],
  'sygnum-shared-components': ['sygnum-shared-components', 'shared-components'],

  // Data & API
  'sygnum-query': ['sygnum-query', 'react-query', 'data-fetching', 'api'],
  'react-query': ['sygnum-query', 'react-query', 'data-fetching'],
  'react query': ['sygnum-query', 'react-query', 'data-fetching'],
  'api': ['api', 'api-integration', 'data-fetching'],
  'graphql': ['graphql', 'api'],
  'rest': ['api', 'rest-api'],

  // Forms
  'yoda-form': ['yoda-form', 'forms', 'validation'],
  'form': ['forms', 'validation', 'input'],
  'validation': ['validation', 'forms'],
  'stepper': ['sygnum-stepper', 'multi-step-forms', 'forms'],

  // Data Display
  'sygnum-table': ['sygnum-table', 'data-tables', 'tanstack-table'],
  'table': ['data-tables', 'sygnum-table'],
  'chart': ['charts', 'sygnum-charts', 'data-visualization'],
  'sygnum-charts': ['sygnum-charts', 'charts', 'd3'],

  // Routing & Navigation
  'routing': ['routing', 'react-router', 'navigation'],
  'route': ['routing', 'react-router', 'navigation'],
  'navigation': ['navigation', 'routing'],
  'loader': ['loaders', 'react-router', 'data-loading'],
  'action': ['actions', 'react-router', 'data-mutation'],

  // State Management
  'state': ['state-management', 'context', 'hooks'],
  'context': ['context', 'react', 'state-management'],
  'hook': ['hooks', 'react-hooks', 'custom-hooks'],
  'sidehook': ['sidehooks-structure', 'hooks', 'custom-hooks'],

  // Testing
  'test': ['testing', 'jest', 'testing-basics'],
  'mock': ['mocking', 'jest', 'msw'],
  'unit test': ['testing-basics', 'jest', 'unit-testing'],
  'integration test': ['integration-testing', 'testing'],
  'e2e': ['e2e-testing', 'testing'],

  // Authentication & Authorization
  'auth': ['authentication', 'authorization', 'sygnum-idp'],
  'authentication': ['authentication', 'sygnum-idp', 'auth0'],
  'authorization': ['authorization', 'sygnum-access', 'rbac'],
  'permission': ['permissions', 'authorization', 'access-control'],
  'rbac': ['rbac', 'authorization', 'permissions'],
  'sygnum-idp': ['sygnum-idp', 'authentication', 'auth0'],
  'sygnum-access': ['sygnum-access', 'authorization', 'rbac'],

  // Utilities
  'sygnum-csv': ['sygnum-csv', 'csv', 'export'],
  'csv': ['csv', 'sygnum-csv', 'export'],
  'toast': ['sygnum-toastify', 'notifications', 'toast'],
  'notification': ['notifications', 'sygnum-toastify'],
  'error handling': ['error-handling', 'error-boundary'],
  'error boundary': ['error-boundary', 'error-handling'],
  'monitoring': ['monitoring', 'sygnum-watch', 'observability'],
  'sygnum-watch': ['sygnum-watch', 'monitoring', 'error-tracking'],

  // Styling
  'style': ['styling', 'css', 'design-system'],
  'css': ['css', 'styling'],
  'theme': ['theming', 'design-tokens', 'sygnum-themes'],
  'design system': ['design-system', 'components', 'patterns'],

  // Patterns
  'component': ['component-patterns', 'react-patterns', 'components'],
  'pattern': ['component-patterns', 'best-practices'],
  'architecture': ['architecture', 'patterns', 'best-practices'],
  'refactor': ['refactoring', 'code-quality'],

  // Standards
  'accessibility': ['accessibility', 'a11y', 'aria'],
  'a11y': ['accessibility', 'a11y', 'aria'],
  'i18n': ['i18n', 'internationalization', 'translation'],
  'performance': ['performance', 'optimization'],
  'security': ['security', 'best-practices'],
};

/**
 * Extract technical keywords from plan text
 */
const extractKeywords = (planText) => {
  const lowerText = planText.toLowerCase();
  const foundKeywords = new Set();

  // Check each keyword pattern
  for (const [keyword, _tags] of Object.entries(KEYWORD_TAG_MAPPING)) {
    // Use word boundary matching to avoid partial matches
    const regex = new RegExp(`\\b${keyword.replace(/[-\/]/g, '[-\/]?')}\\b`, 'gi');
    if (regex.test(lowerText)) {
      foundKeywords.add(keyword);
    }
  }

  return Array.from(foundKeywords);
};

/**
 * Map keywords to knowledge tags and prioritize by frequency
 */
const mapKeywordsToTags = (keywords, availableTags) => {
  const tagFrequency = new Map();

  for (const keyword of keywords) {
    const tags = KEYWORD_TAG_MAPPING[keyword] || [];
    for (const tag of tags) {
      // Only include tags that actually exist in knowledge.json
      if (availableTags.has(tag)) {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      }
    }
  }

  // Sort by frequency (most common first)
  return Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
};

/**
 * Main extraction logic
 */
const extractTagsFromPlan = (planPath, maxTags) => {
  try {
    // Read plan.md
    const planContent = readFileSync(planPath, 'utf-8');

    // Get available tags from knowledge.json
    const availableTags = getAvailableTags();

    if (availableTags.size === 0) {
      throw new Error('Could not load available tags from knowledge.json');
    }

    // Extract keywords from plan
    const keywords = extractKeywords(planContent);

    // Map keywords to tags
    const tags = mapKeywordsToTags(keywords, availableTags);

    // Return top N tags
    return tags.slice(0, maxTags);
  } catch (error) {
    throw new Error(`Failed to extract tags from plan: ${error.message}`);
  }
};

const main = () => {
  try {
    const args = parseArguments(process.argv);

    if (args.help) {
      showHelp();
      process.exit(0);
    }

    if (!args.planPath) {
      console.error('Error: --plan-path is required');
      showHelp();
      process.exit(1);
    }

    const tags = extractTagsFromPlan(args.planPath, args.maxTags);

    // Output as JSON array
    console.log(JSON.stringify(tags));

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
