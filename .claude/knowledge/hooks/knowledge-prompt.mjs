#!/usr/bin/env node

/**
 * Knowledge Prompt Hook (Investigate-First Workflow)
 *
 * First prompt: Shows ALL available knowledge (categories + tags)
 * Subsequent prompts: Shows abbreviated reminder
 *
 * Workflow:
 * 1. Agent investigates first (reads files, explores codebase, gathers context)
 * 2. AFTER investigation, agent identifies what knowledge is relevant
 * 3. Loads knowledge LIBERALLY (8-15 for complex, 4-8 for simple tasks)
 * 4. Reports compliance: "Loaded: [list]" or "No knowledge needed: [reason]"
 *
 * Key principles:
 * - Investigation BEFORE knowledge loading (not upfront guessing)
 * - Liberal loading based on findings (load ALL relevance_score >= 0.3)
 * - Better to load extra than miss critical context (reading is cheap ~2-3k tokens)
 *
 * Token savings: ~90% reduction after first prompt (1-2k → ~100 tokens)
 *
 * Design:
 * - Detects first prompt via state file
 * - Shows complete category-tag map on first prompt
 * - Shows abbreviated reminder on subsequent prompts
 * - Slash commands (/epic, /task, /implement) handle their own loading
 */

import { loadKnowledgeMapping } from '../scripts/knowledge-lib.mjs';
import { logHookError } from './hook-error-logger.mjs';
import { renderTemplate, escapePrompt } from './template-renderer.mjs';
import { checkCategoriesShown, markCategoriesShown } from '../scripts/session-manager.mjs';

/**
 * Read JSON from stdin
 */
const readStdin = () => {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
};



/**
 * Build category-tag map from knowledge.json
 * Returns: { category: [tags] }
 */
const buildCategoryTagMap = (mapping) => {
  const categoryTagMap = {};

  for (const [category, packages] of Object.entries(mapping.knowledge || {})) {
    const tagSet = new Set();

    for (const packageData of Object.values(packages)) {
      if (packageData.tags && Array.isArray(packageData.tags)) {
        packageData.tags.forEach(tag => tagSet.add(tag));
      }
    }

    if (tagSet.size > 0) {
      categoryTagMap[category] = Array.from(tagSet).sort();
    }
  }

  return categoryTagMap;
};

/**
 * Format category-tag map as compact text for prompt
 */
const formatCategoryTagMap = (categoryTagMap) => {
  const lines = [];

  for (const [category, tags] of Object.entries(categoryTagMap)) {
    // Show category with top 5 most common tags (to keep it concise)
    const topTags = tags.slice(0, 5);
    const more = tags.length > 5 ? ` +${tags.length - 5} more` : '';
    lines.push(`  ${category} [${topTags.join(', ')}${more}]`);
  }

  return lines.join('\n');
};

/**
 * Get mandatory core knowledge for ANY code work
 * These are ALWAYS required to enforce standards
 *
 * Note: Templates use different variable formats:
 * - CORE_PACKAGES: "pkg1, pkg2, pkg3" (comma-separated for abbreviated template)
 * - CORE_PACKAGES_LIST: "- pkg1\n- pkg2\n- pkg3" (markdown list for first-prompt)
 */
const getMandatoryCoreKnowledge = () => {
  return {
    tags: ['standards', 'typescript', 'react', 'testing', 'component-patterns'],
    packages: [
      'code-conventions',
      'component-architecture',
      'typescript-types',
      'typescript-type-safety',
      'react-patterns',
      'testing-core',
      'testing-components-basics'
    ]
  };
};

/**
 * Format abbreviated reminder for subsequent prompts
 */
const formatAbbreviatedReminder = (userPrompt) => {
  const coreKnowledge = getMandatoryCoreKnowledge();

  return renderTemplate('abbreviated.template.md', {
    CORE_TAGS: coreKnowledge.tags.join(','),
    CORE_PACKAGES: coreKnowledge.packages.join(', '),
    ESCAPED_PROMPT: escapePrompt(userPrompt),
    USER_PROMPT: userPrompt
  });
};

(async () => {
  let userPrompt = '';
  let stdinData = '';

  try {
    stdinData = await readStdin();

    try {
      const hookData = JSON.parse(stdinData);
      userPrompt = hookData.prompt || '';
    } catch (error) {
      // Fallback: treat as plain text
      userPrompt = stdinData.trim();
    }

    // Skip empty or very short prompts
    if (!userPrompt || userPrompt.trim().length < 10) {
      console.log(userPrompt || '');
      process.exit(0);
    }

    // Don't transform if prompt already contains knowledge loading instructions
    if (userPrompt.includes('Available Knowledge Categories') ||
        userPrompt.includes('Knowledge System Available') ||
        userPrompt.includes('knowledge-search.mjs')) {
      console.log(userPrompt);
      process.exit(0);
    }

    // Check if this is first prompt in session
    const { isFirstPrompt } = checkCategoriesShown();

    let transformedPrompt;

    if (isFirstPrompt) {
      // FIRST PROMPT: Show full categories
      const mapping = loadKnowledgeMapping();
      const categoryTagMap = buildCategoryTagMap(mapping);
      const formattedMap = formatCategoryTagMap(categoryTagMap);
      const categoriesCount = Object.keys(categoryTagMap).length;
      const coreKnowledge = getMandatoryCoreKnowledge();

      transformedPrompt = renderTemplate('first-prompt.template.md', {
        CATEGORIES_COUNT: categoriesCount,
        FORMATTED_MAP: formattedMap,
        CORE_TAGS: coreKnowledge.tags.join(','),
        CORE_PACKAGES_LIST: '- ' + coreKnowledge.packages.join('\n- '),
        ESCAPED_PROMPT: escapePrompt(userPrompt),
        USER_PROMPT: userPrompt
      });

      // Mark categories as shown
      markCategoriesShown();
    } else {
      // SUBSEQUENT PROMPTS: Show abbreviated reminder
      transformedPrompt = formatAbbreviatedReminder(userPrompt);
    }

    console.log(transformedPrompt);
    process.exit(0);
  } catch (error) {
    // Log error with context (safe fallback if session state unavailable)
    let isFirstPrompt = false;
    try {
      const state = checkCategoriesShown();
      isFirstPrompt = state.isFirstPrompt;
    } catch {}

    logHookError('knowledge-prompt', error, {
      promptLength: userPrompt?.length || 0,
      stdinLength: stdinData?.length || 0,
      isFirstPrompt
    });
    // On any error, pass through the original prompt
    console.error('Hook error:', error.message);
    console.log(userPrompt || stdinData);
    process.exit(0);
  }
})();
