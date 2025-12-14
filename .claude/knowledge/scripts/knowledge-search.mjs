#!/usr/bin/env node

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  KNOWLEDGE_BASE_PATH,
  loadKnowledgeMapping,
  buildPackageIndex,
  findPackageByName,
  estimateTokens,
} from './knowledge-lib.mjs';
import { initializeFromSearch } from '../hooks/unified-tracking.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const parseArguments = (args) => {
  const result = {
    tags: [],
    text: null,
    agent: null,
    category: null,
    help: false,
    agentName: null,
    agentId: null,
    sessionId: null,
    promptId: null,
    commandProfile: null,
    prompt: null,
    listCategories: false,
    listTags: false,
    filePath: null,
    maxResults: 15,
  };

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
      return result;
    }

    if (arg === '--list-categories') {
      result.listCategories = true;
      continue;
    }

    if (arg === '--list-tags') {
      result.listTags = true;
      continue;
    }

    if (arg === '--tags' && nextArg) {
      result.tags = nextArg.split(',').map(t => t.trim()).filter(Boolean);
      i++;
      continue;
    }

    if (arg === '--text' && nextArg) {
      result.text = nextArg;
      i++;
      continue;
    }

    if (arg === '--agent' && nextArg) {
      result.agent = nextArg;
      i++;
      continue;
    }

    if (arg === '--category' && nextArg) {
      result.category = nextArg;
      i++;
      continue;
    }

    if (arg === '--agent-name' && nextArg) {
      result.agentName = nextArg;
      i++;
      continue;
    }

    if (arg === '--agent-id' && nextArg) {
      result.agentId = nextArg;
      i++;
      continue;
    }

    if (arg === '--session-id' && nextArg) {
      result.sessionId = nextArg;
      i++;
      continue;
    }

    if (arg === '--prompt-id' && nextArg) {
      result.promptId = nextArg;
      i++;
      continue;
    }

    if (arg === '--command-profile' && nextArg) {
      result.commandProfile = nextArg;
      i++;
      continue;
    }

    if (arg === '--prompt' && nextArg) {
      result.prompt = nextArg;
      i++;
      continue;
    }

    if (arg === '--file-path' && nextArg) {
      result.filePath = nextArg;
      i++;
      continue;
    }

    if (arg === '--max-results' && nextArg) {
      result.maxResults = parseInt(nextArg, 10);
      i++;
      continue;
    }
  }

  return result;
};

// Format date as MM-DD HH:mm:ss (no year, no milliseconds)
const formatTimestamp = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Detect language from file path
 * Returns: 'typescript', 'javascript', 'java', 'python', 'go', 'terraform', or null
 */
const detectLanguage = (filePath) => {
  if (!filePath) return null;

  const lowerPath = filePath.toLowerCase();

  // TypeScript (most specific first)
  if (lowerPath.match(/\.(ts|tsx)$/)) return 'typescript';

  // JavaScript
  if (lowerPath.match(/\.(js|jsx|mjs|cjs)$/)) return 'javascript';

  // Java
  if (lowerPath.match(/\.java$/)) return 'java';

  // Python
  if (lowerPath.match(/\.py$/)) return 'python';

  // Go
  if (lowerPath.match(/\.go$/)) return 'go';

  // Terraform/HCL
  if (lowerPath.match(/\.tf$/)) return 'terraform';

  // Rust
  if (lowerPath.match(/\.rs$/)) return 'rust';

  // C#
  if (lowerPath.match(/\.cs$/)) return 'csharp';

  return null;
};

/**
 * Calculate relevance score for a package based on tag matching
 * Returns score between 0 and 1
 */
const calculateRelevanceScore = (packageData, searchTags, category, language) => {
  // 1. Calculate tag match score (0-1.0)
  const packageTags = (packageData.tags || []).map(t => t.toLowerCase());
  const lowerSearchTags = searchTags.map(t => t.toLowerCase());

  let tagScore = 0;
  let tagMatches = 0;

  for (const searchTag of lowerSearchTags) {
    // Exact match
    if (packageTags.includes(searchTag)) {
      tagMatches += 1.0;
    }
    // Partial match
    else if (packageTags.some(pt => pt.includes(searchTag) || searchTag.includes(pt))) {
      tagMatches += 0.5;
    }
  }

  if (lowerSearchTags.length > 0) {
    tagScore = tagMatches / lowerSearchTags.length;
  } else {
    tagScore = 0.5; // No tags specified = moderate base score
  }

  // 2. Language filtering (CRITICAL for standards packages)
  const categoryLower = category.toLowerCase();

  // If we detected a language, filter language-specific standards
  if (language) {
    // Check if package is language-specific by category name
    const languageIndicators = {
      typescript: ['typescript', 'ts-'],
      javascript: ['javascript', 'js-'],
      java: ['java'],
      python: ['python', 'py-'],
      go: ['golang', 'go-'],
      terraform: ['terraform', 'tf-'],
      rust: ['rust'],
      csharp: ['csharp', 'c#', 'dotnet']
    };

    // For standards/ and tooling/ packages, check language compatibility
    if (categoryLower.startsWith('standards/') || categoryLower.startsWith('tooling/')) {
      // Check if package mentions a different language
      for (const [lang, indicators] of Object.entries(languageIndicators)) {
        if (lang !== language) {
          // If package category contains a different language indicator, reject it
          if (indicators.some(indicator => categoryLower.includes(indicator))) {
            return 0; // HARD REJECT - wrong language
          }
        }
      }
    }
  }

  // Return tag score (already 0-1.0)
  return tagScore;
};

const matchesTags = (packageTags, searchTags) => {
  if (searchTags.length === 0) {
    return true;
  }

  return searchTags.some(searchTag => {
    const lowerSearchTag = searchTag.toLowerCase();
    return packageTags.some(packageTag => {
      const lowerPackageTag = packageTag.toLowerCase();
      return lowerPackageTag === lowerSearchTag || lowerPackageTag.includes(lowerSearchTag);
    });
  });
};

const matchesText = (description, searchText) => {
  if (!searchText) {
    return true;
  }

  return description.toLowerCase().includes(searchText.toLowerCase());
};

const matchesAgent = (usedByAgents, searchAgent) => {
  if (!searchAgent) {
    return true;
  }

  if (!usedByAgents || usedByAgents.length === 0) {
    return false;
  }

  const lowerSearchAgent = searchAgent.toLowerCase();
  return usedByAgents.some(agent => agent.toLowerCase().includes(lowerSearchAgent));
};

const resolveDependencies = (mapping, packageIndex, packageName, visited = new Set(), maxDepth = 1, currentDepth = 0) => {
  if (visited.has(packageName)) {
    return [];
  }

  if (currentDepth >= maxDepth) {
    return [];
  }

  visited.add(packageName);

  const packageInfo = findPackageByName(packageIndex, packageName);
  if (!packageInfo) {
    return [];
  }

  const dependencies = [];
  const requiredKnowledge = packageInfo.data.required_knowledge ?? [];

  for (const knowledgeName of requiredKnowledge) {
    const depInfo = findPackageByName(packageIndex, knowledgeName);
    if (depInfo) {
      dependencies.push({
        name: knowledgeName,
        category: depInfo.category,
        description: depInfo.data.description ?? '',
        tags: depInfo.data.tags ?? [],
        used_by_agents: depInfo.data.used_by_agents ?? [],
        required_knowledge: depInfo.data.required_knowledge ?? [],
        optional_knowledge: depInfo.data.optional_knowledge ?? [],
        knowledge_path: depInfo.data.knowledge_path ?? `${KNOWLEDGE_BASE_PATH}/wisdom/${depInfo.category}/${knowledgeName}/${knowledgeName}.md`,
      });

      const nestedDeps = resolveDependencies(mapping, packageIndex, knowledgeName, visited, maxDepth, currentDepth + 1);
      dependencies.push(...nestedDeps);
    }
  }

  return dependencies;
};

const loadCommandProfile = (mapping, profileName) => {
  if (!mapping.command_profiles || !mapping.command_profiles[profileName]) {
    throw new Error(`Command profile not found: ${profileName}. Available profiles: ${Object.keys(mapping.command_profiles || {}).join(', ')}`);
  }

  return mapping.command_profiles[profileName];
};

/**
 * Search for knowledge packages using a command profile.
 * Loads always_load packages + optional tag-based search via --tags parameter.
 *
 * @param {Object} mapping - Knowledge mapping
 * @param {Map} packageIndex - Package index for fast lookups
 * @param {Object} profile - Profile object from command_profiles
 * @param {Array<string>} additionalTags - Optional tags from --tags parameter
 * @returns {Array} Array of matching knowledge packages
 */
const searchByProfile = (mapping, packageIndex, profile, additionalTags = []) => {
  const allResults = [];
  const seenNames = new Set();

  // Load always_load packages directly by name
  for (const knowledgeName of profile.always_load || []) {
    const packageInfo = findPackageByName(packageIndex, knowledgeName);
    if (packageInfo) {
      const result = {
        name: knowledgeName,
        category: packageInfo.category,
        description: packageInfo.data.description ?? '',
        tags: packageInfo.data.tags ?? [],
        used_by_agents: packageInfo.data.used_by_agents ?? [],
        required_knowledge: packageInfo.data.required_knowledge ?? [],
        optional_knowledge: packageInfo.data.optional_knowledge ?? [],
        knowledge_path: packageInfo.data.knowledge_path ?? `${KNOWLEDGE_BASE_PATH}/wisdom/${packageInfo.category}/${knowledgeName}/${knowledgeName}.md`,
        source: 'always_load',
      };
      allResults.push(result);
      seenNames.add(knowledgeName);
    }
  }

  // Search using profile filters
  const filters = profile.search_filters || {};
  const profileTags = filters.tags || [];
  const combinedTags = [...profileTags, ...additionalTags];
  const hasSearchFilters = filters.category || combinedTags.length > 0;

  if (hasSearchFilters) {
    const searchResults = searchKnowledge(mapping, {
      tags: combinedTags,
      text: null,
      agent: null,
      category: filters.category || null,
    });

    // Add search results that weren't already loaded
    for (const result of searchResults) {
      if (!seenNames.has(result.name)) {
        result.source = 'search_filters';
        allResults.push(result);
        seenNames.add(result.name);
      }
    }
  }

  return allResults;
};

const searchKnowledge = (mapping, filters) => {
  const results = [];
  const { tags, text, agent, category, filePath, prompt, maxResults } = filters;

  // Detect language from file path
  const language = detectLanguage(filePath);

  let categoriesToSearch;

  if (category) {
    // Exact category match (supports both flat and hierarchical paths)
    categoriesToSearch = category.split(',').map(c => c.trim()).filter(c => mapping.knowledge[c]);
  } else {
    // No filter, search all categories
    categoriesToSearch = Object.keys(mapping.knowledge);
  }

  for (const cat of categoriesToSearch) {
    const packages = mapping.knowledge[cat];
    if (!packages) {
      continue;
    }

    for (const [name, packageData] of Object.entries(packages)) {
      const packageTags = packageData.tags ?? [];
      const packageDescription = packageData.description ?? '';
      const usedByAgents = packageData.used_by_agents ?? [];

      if (!matchesTags(packageTags, tags)) {
        continue;
      }

      if (!matchesText(packageDescription, text)) {
        continue;
      }

      if (!matchesAgent(usedByAgents, agent)) {
        continue;
      }

      // Calculate relevance score with language filtering
      const relevanceScore = calculateRelevanceScore(packageData, tags, cat, language);

      results.push({
        name,
        category: cat,
        description: packageDescription,
        tags: packageTags,
        used_by_agents: usedByAgents,
        required_knowledge: packageData.required_knowledge ?? [],
        optional_knowledge: packageData.optional_knowledge ?? [],
        knowledge_path: packageData.knowledge_path ?? `${mapping.skills_location}/${cat}/${name}/${name}.md`,
        relevance_score: parseFloat(relevanceScore.toFixed(3)),
        detected_language: language,
      });
    }
  }

  // Sort by relevance score (highest first)
  results.sort((a, b) => b.relevance_score - a.relevance_score);

  // Apply maxResults limit (default 15)
  const limit = maxResults || 15;
  return results.slice(0, limit);
};

const formatOutput = (results, filters, mapping, packageIndex) => {
  let allResults = [...results];

  if (filters.withDeps) {
    const depsMap = new Map();

    for (const result of results) {
      const deps = resolveDependencies(mapping, packageIndex, result.name, new Set(), filters.maxDepth || 1);
      for (const dep of deps) {
        if (!depsMap.has(dep.name) && !results.some(r => r.name === dep.name)) {
          depsMap.set(dep.name, dep);
        }
      }
    }

    allResults = [...results, ...Array.from(depsMap.values())];
  }

  const outputText = JSON.stringify(allResults, null, 2);
  const tokenEstimate = estimateTokens(outputText);

  const output = {
    query: filters,
    count: results.length,
    total_with_deps: allResults.length,
    token_estimate: tokenEstimate,
    results: allResults,
  };

  return JSON.stringify(output, null, 2);
};

const showHelp = () => {
  const helpText = `
Knowledge Search Tool

USAGE:
  node knowledge-search.mjs [OPTIONS]

OPTIONS:
  --command-profile <name>  Load knowledge based on command profile (plan, implementation)
  --tags <tag1,tag2>        Search by tags (comma-separated). Can combine with --command-profile.
  --text <text>             Search by description text (case-insensitive)
  --agent <agent>           Filter by agent name (partial match)
  --category <cat>          Filter by category (exact match: technical/frameworks, business/trading)
  --file-path <path>        File path for language detection (e.g., /path/to/file.spec.tsx)
  --max-results <number>    Maximum results to return (default: 15)
  --agent-name <name>       Agent name for tracking (enables automatic tracking)
  --agent-id <id>           Agent ID for tracking (enables automatic tracking)
  --prompt <text>           User prompt for tracking (populated by hooks)
  --help, -h                Show this help message

DISCOVERY OPTIONS:
  --list-categories         List all available categories
  --list-tags               List all available tags

DISCOVERY EXAMPLES:
  node knowledge-search.mjs --list-categories
  node knowledge-search.mjs --list-tags

DEPENDENCIES:
  Dependencies are loaded automatically (1-level depth)

TRACKING:
  When --agent-name and --agent-id are provided, all knowledge loads are automatically
  tracked to .claude/knowledge/tracker/tracker.jsonl

COMMAND PROFILE MODE (RECOMMENDED):
  Uses pre-configured profiles from knowledge.json
  Automatically loads always_load packages + optional tag-based search

  # Load based on command profile only
  node knowledge-search.mjs --command-profile plan

  # Load based on command profile + additional tags
  node knowledge-search.mjs --command-profile plan --tags routing,permissions

  # With tracking
  node knowledge-search.mjs --command-profile plan --tags routing --agent-name plan-command --agent-id plan-123

MANUAL SEARCH MODE:
  node knowledge-search.mjs --tags routing
  node knowledge-search.mjs --tags react,testing
  node knowledge-search.mjs --text "API integration"
  node knowledge-search.mjs --category technical
  node knowledge-search.mjs --tags routing --agent-name implementation-agent --agent-id task-123

DOMAIN-AWARE SEARCH (NEW):
  # Automatically detects frontend domain and prioritizes frontend packages
  node knowledge-search.mjs --tags testing,flaky-tests \\
    --file-path /path/to/OrderHistory.spec.tsx \\
    --prompt "Check if this test is flaky"

  # Limit to top 10 results
  node knowledge-search.mjs --tags testing --max-results 10

  # Results include relevance_score and detected_language fields

OUTPUT:
  Structured JSON with matching knowledge packages, dependencies, and token estimate
  When --agent-name and --agent-id are provided, tracking is logged to .claude/knowledge/tracker/tracker.jsonl
  Agent profile results include 'source' field: 'always_load' or 'tag_search'
`;

  console.log(helpText);
};

const listCategories = (mapping) => {
  const categories = Object.keys(mapping.knowledge).sort();

  const output = {
    count: categories.length,
    categories: categories
  };

  console.log(JSON.stringify(output, null, 2));
};

const listTags = (mapping) => {
  const tagsSet = new Set();

  // Extract all tags from all packages
  for (const category of Object.values(mapping.knowledge)) {
    for (const pkg of Object.values(category)) {
      if (pkg.tags && Array.isArray(pkg.tags)) {
        pkg.tags.forEach(tag => tagsSet.add(tag));
      }
    }
  }

  const tags = Array.from(tagsSet).sort();

  const output = {
    count: tags.length,
    tags: tags
  };

  console.log(JSON.stringify(output, null, 2));
};

const main = () => {
  try {
    const args = parseArguments(process.argv);

    if (args.help) {
      showHelp();
      process.exit(0);
    }

    const mapping = loadKnowledgeMapping();

    // Handle discovery operations
    if (args.listTaskTypes) {
      listTaskTypes(mapping, args.commandProfile);
      process.exit(0);
    }

    if (args.listCategories) {
      listCategories(mapping);
      process.exit(0);
    }

    if (args.listTags) {
      listTags(mapping);
      process.exit(0);
    }

    const packageIndex = buildPackageIndex(mapping);

    // Use agent profile or manual search
    let results;
    if (args.commandProfile) {
      const profile = loadCommandProfile(mapping, args.commandProfile);
      // Pass additional tags from command line if provided
      results = searchByProfile(mapping, packageIndex, profile, args.tags);
    } else {
      results = searchKnowledge(mapping, args);
    }

    // Compute allResults with dependencies for tracking
    const depsMap = new Map();
    for (const result of results) {
      const deps = resolveDependencies(mapping, packageIndex, result.name, new Set());
      for (const dep of deps) {
        if (!depsMap.has(dep.name) && !results.some(r => r.name === dep.name)) {
          depsMap.set(dep.name, dep);
        }
      }
    }
    const allResults = [...results, ...Array.from(depsMap.values())];

    // Warn if no results found (help user debug search)
    if (results.length === 0 && !args.help) {
      const suggestions = [];

      if (args.text) {
        suggestions.push("Remove --text filter (text is AND-ed with tags, very restrictive)");
        suggestions.push(`Try searching with tags only: --tags ${args.tags.join(',')}`);
      }

      if (args.tags.length > 3) {
        suggestions.push(`Use fewer, more focused tags (currently ${args.tags.length}). Try 2-3 max.`);
      }

      if (args.tags.length > 0) {
        suggestions.push(`Try with single tag: --tags ${args.tags[0]}`);
      }

      if (!args.commandProfile) {
        suggestions.push("Try using --command-profile with --tags for more precise results");
      }

      suggestions.push("Use --help to see all available options");
      suggestions.push("Manually check knowledge.json with: grep 'pattern-name' .ai/knowledge/knowledge.json");

      console.error('\n⚠️  WARNING: No results found\n');
      console.error('Suggestions:');
      suggestions.forEach((s, i) => console.error(`  ${i + 1}. ${s}`));
      console.error('');
    }

    // Track knowledge loads with unified tracking
    if (args.agentName && args.agentId) {
      const categories = [...new Set(allResults.map(r => r.category))].sort();
      const consideredPackages = allResults.map(r => r.name);

      initializeFromSearch({
        agentId: args.agentId,
        agentName: args.agentName,
        sessionId: args.sessionId || null,
        prompt: args.prompt || null,
        tags: args.tags || [],
        categories,
        consideredPackages,
      });
    }

    const output = formatOutput(results, args, mapping, packageIndex);

    console.log(output);

    process.exit(0);
  } catch (error) {
    const errorOutput = {
      error: error.message,
      query: null,
      count: 0,
      total_with_deps: 0,
      token_estimate: 0,
      results: [],
    };

    console.error(JSON.stringify(errorOutput, null, 2));
    process.exit(1);
  }
};

main();
