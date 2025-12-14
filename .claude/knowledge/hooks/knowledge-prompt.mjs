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
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { logHookError } from './hook-error-logger.mjs';

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
 * Get state file path for tracking first prompt
 * State file location: .claude/knowledge/tracker/knowledge-session-state.jsonl
 */
const getStateFilePath = () => {
  const projectRoot = process.cwd();
  return join(projectRoot, '.claude', 'knowledge', 'tracker', 'knowledge-session-state.jsonl');
};

/**
 * Check if this is the first prompt in session
 * Returns: { isFirstPrompt: boolean }
 *
 * Reads JSONL format - last line is current state.
 * Empty file = first prompt (no error).
 */
const getSessionState = () => {
  const stateFile = getStateFilePath();

  if (!existsSync(stateFile)) {
    return { isFirstPrompt: true };
  }

  try {
    const data = readFileSync(stateFile, 'utf-8').trim();

    // Empty file is valid (first prompt)
    if (!data) {
      return { isFirstPrompt: true };
    }

    // Read last line (current state)
    const lines = data.split('\n').filter(Boolean);
    const lastLine = lines[lines.length - 1];
    const state = JSON.parse(lastLine);

    return {
      isFirstPrompt: false
    };
  } catch (error) {
    // If state file is corrupted, treat as first prompt
    return { isFirstPrompt: true };
  }
};

/**
 * Mark that categories have been shown
 * Appends JSONL entry to state file.
 */
const markCategoriesShown = () => {
  const stateFile = getStateFilePath();
  const stateDir = dirname(stateFile);

  try {
    // Ensure directory exists
    if (!existsSync(stateDir)) {
      mkdirSync(stateDir, { recursive: true });
    }

    const state = {
      categoriesShown: true,
      timestamp: new Date().toISOString()
    };

    // Append JSONL entry
    const entry = JSON.stringify(state) + '\n';

    // If file doesn't exist, write. Otherwise append.
    if (!existsSync(stateFile)) {
      writeFileSync(stateFile, entry, 'utf-8');
    } else {
      appendFileSync(stateFile, entry, 'utf-8');
    }
  } catch (error) {
    // Silent fail - session state is not critical
  }
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
 * Extract file paths from prompt text
 * Looks for common patterns: /path/to/file.ext or relative paths
 */
const extractFilePaths = (text) => {
  const patterns = [
    // Absolute paths: /path/to/file.ext
    /(?:^|\s)([\/][\w\-\.\/]+\.\w+)/g,
    // Relative paths with directories: path/to/file.ext
    /((?:[\w\-]+\/)+[\w\-]+\.\w+)/g,
    // Paths in quotes: "path/to/file.ext" or 'path/to/file.ext'
    /["']([\w\-\.\/]+\.\w+)["']/g,
  ];

  const paths = new Set();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const path = match[1];
      // Filter out likely false positives (URLs, etc)
      if (!path.includes('http') && !path.includes('www.')) {
        paths.add(path);
      }
    }
  }

  return Array.from(paths);
};

/**
 * Detect domain from file path
 * Returns: 'frontend', 'backend', 'infrastructure', or null
 */
const detectDomainFromPath = (filePath) => {
  const lowerPath = filePath.toLowerCase();

  // Frontend indicators
  if (lowerPath.includes('frontend') ||
      lowerPath.includes('/apps/') ||
      lowerPath.includes('/libs/') ||
      lowerPath.match(/\.(tsx?|jsx?)$/) ||
      lowerPath.includes('components') ||
      lowerPath.includes('pages')) {
    return 'frontend';
  }

  // Backend indicators
  if (lowerPath.includes('backend') ||
      lowerPath.includes('bff') ||
      lowerPath.includes('api') ||
      lowerPath.includes('controller') ||
      lowerPath.includes('service') ||
      lowerPath.includes('.nest')) {
    return 'backend';
  }

  // Infrastructure indicators
  if (lowerPath.includes('terraform') ||
      lowerPath.includes('infrastructure') ||
      lowerPath.includes('.tf') ||
      lowerPath.includes('docker') ||
      lowerPath.includes('k8s') ||
      lowerPath.includes('kubernetes')) {
    return 'infrastructure';
  }

  return null;
};

/**
 * Determine domain from prompt text
 * Returns domain string for --file-path parameter or null
 */
const extractDomainFromPrompt = (promptText) => {
  const filePaths = extractFilePaths(promptText);

  if (filePaths.length === 0) {
    return null; // No files = cross-cutting (default in search)
  }

  const domains = filePaths
    .map(path => detectDomainFromPath(path))
    .filter(Boolean); // Remove nulls

  if (domains.length === 0) {
    return null; // Couldn't detect domain
  }

  const uniqueDomains = [...new Set(domains)];

  if (uniqueDomains.length === 1) {
    // All files from same domain - use first file path for detection
    return filePaths[0];
  }

  // Mixed domains - return null (will default to cross-cutting)
  return null;
};

/**
 * Format abbreviated reminder for subsequent prompts
 */
const formatAbbreviatedReminder = (userPrompt) => {
  // Escape user prompt for shell command
  const escapedPrompt = userPrompt
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ');

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Knowledge System Available

Categories with tags were shown in first prompt. Refer to that list.

Workflow: Investigate first → Load targeted knowledge when ready

Load knowledge AFTER investigation:
  node .claude/knowledge/scripts/knowledge-search.mjs \\
    --tags [tag1,tag2] \\
    --agent-name user \\
    --agent-id prompt-$(date +%s) \\
    --prompt "${escapedPrompt}"

Report what you loaded:
  node .claude/knowledge/scripts/track-read.mjs \\
    --agent-id [same-id] \\
    --packages pkg1,pkg2,pkg3

⚠️ LOADING STRATEGY:
   - Complex tasks: Load 8-15 packages
   - Simple tasks: Load 4-8 packages
   - Load ALL relevance_score >= 0.3 (don't be conservative!)
   - Document WHY you skipped packages (not just "not relevant")

✅ Start response with: "Loaded: [packages]" or "No knowledge needed: [reason]"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
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
    const { isFirstPrompt } = getSessionState();

    let transformedPrompt;

    if (isFirstPrompt) {
      // FIRST PROMPT: Show full categories
      const mapping = loadKnowledgeMapping();
      const categoryTagMap = buildCategoryTagMap(mapping);
      const formattedMap = formatCategoryTagMap(categoryTagMap);
      const categoriesCount = Object.keys(categoryTagMap).length;

      // Extract domain from prompt for better filtering
      const detectedFilePath = extractDomainFromPrompt(userPrompt);
      const filePathParam = detectedFilePath
        ? ` \\\n     --file-path "${detectedFilePath}"`
        : '';

      // Escape user prompt for shell command (escape double quotes and newlines)
      const escapedPrompt = userPrompt
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, ' ');

      transformedPrompt = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 KNOWLEDGE SYSTEM AVAILABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available Knowledge Categories (${categoriesCount} total):

${formattedMap}

WORKFLOW - Investigate First, Load When Ready:

1. INVESTIGATE the user request first:
   - Read relevant files to understand the actual context
   - Explore the codebase to identify specific patterns/issues
   - Gather enough information to know what knowledge is needed

2. AFTER investigation, identify what knowledge is relevant:
   - Review available categories/tags above
   - Match your findings to specific knowledge areas
   - Be LIBERAL: Load 8-15 packages for complex tasks, 4-8 for simple
   - Load ALL packages with relevance_score >= 0.3 (don't be conservative!)

3. LOAD knowledge using TWO-PHASE approach:

   **PHASE 1 - Broad Initial Search:**
   node .claude/knowledge/scripts/knowledge-search.mjs \\
     --tags [core-tags] \\
     --max-results 20 \\
     --agent-name user \\
     --agent-id prompt-$(date +%s) \\
     --prompt "${escapedPrompt}"${filePathParam}

   Load: Core patterns + domain knowledge (8-15 packages)

   **PHASE 2 - Specific Issue Search (if needed):**
   When you hit a specific issue (error, tool problem):
   node .claude/knowledge/scripts/knowledge-search.mjs \\
     --tags [specific-tool-tags] \\
     --agent-name user \\
     --agent-id [same-agent-id] \\
     --prompt "specific issue description"

   Load: Tool-specific knowledge (2-5 additional packages)

4. REPORT what you loaded:

   node .claude/knowledge/scripts/track-read.mjs \\
     --agent-id [same-agent-id-from-search] \\
     --packages pkg1,pkg2,pkg3

5. DOCUMENT your selection (MANDATORY):

\`\`\`json:knowledge-selection
{
  "search_results": {
    "total_found": 15,
    "loaded": 8,
    "skipped": 7
  },
  "loaded": ["package1", "package2", "package3", "..."],
  "reasoning": {
    "package1": "Specific reason based on investigation findings",
    "package2": "Why needed for this specific task"
  },
  "considered_but_skipped": ["package8", "package9"],
  "skip_reasoning": {
    "package8": "SPECIFIC reason why not needed (not just 'not relevant')",
    "package9": "Concrete justification based on task scope"
  }
}
\`\`\`

⚠️ CRITICAL REMINDERS:
   - If search found 15 packages but you only loaded 2: EXPLAIN WHY
   - Each skipped package needs SPECIFIC reasoning
   - "Not relevant" is NOT sufficient - explain WHAT makes it not relevant
   - Loading is cheap (2-3k tokens), missing patterns is EXPENSIVE
   - When in doubt, LOAD IT (liberal > conservative)

6. START response with: "Loaded: [packages]" or "No knowledge needed: [reason]"

✅ COMPLIANCE PROOF:
   - Investigation completed first (files read, context gathered)
   - Knowledge loaded LIBERALLY based on findings (8-15 for complex tasks)
   - ALL relevance_score >= 0.3 packages loaded (unless explicitly justified)
   - Track-read command executed
   - Response starts with "Loaded:" or "No knowledge needed:"
   - Skip reasoning provided for ALL considered packages

Note: Slash commands (/epic, /task, /implement) handle their own knowledge loading.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER REQUEST:
${userPrompt}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

      // Mark categories as shown
      markCategoriesShown();
    } else {
      // SUBSEQUENT PROMPTS: Show abbreviated reminder
      const reminder = formatAbbreviatedReminder(userPrompt);
      transformedPrompt = `${reminder}

USER REQUEST:
${userPrompt}`;
    }

    console.log(transformedPrompt);
    process.exit(0);
  } catch (error) {
    logHookError('knowledge-prompt', error, {
      promptLength: userPrompt.length,
      stdinLength: stdinData.length,
      isFirstPrompt: getSessionState().isFirstPrompt
    });
    // On any error, pass through the original prompt
    console.error('Hook error:', error.message);
    console.log(userPrompt || stdinData);
    process.exit(0);
  }
})();
