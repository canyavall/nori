#!/usr/bin/env node

import { appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  KNOWLEDGE_BASE_PATH,
  loadKnowledgeMapping,
  buildPackageIndex,
  findPackageByName,
  estimateTokens,
} from './knowledge-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TRACKER_PATH = join(__dirname, '../tracker/tracker.jsonl');
const METRICS_PATH = join(__dirname, '../tracker/metrics.jsonl');

const parseArguments = (args) => {
  const result = {
    tags: [],
    text: null,
    agent: null,
    category: null,
    help: false,
    agentName: null,
    agentId: null,
    commandProfile: null,
    prompt: null,
    listCategories: false,
    listTags: false,
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

// Extract category and filename from knowledge path
const extractCategoryAndFile = (knowledgePath) => {
  // Example: .ai/knowledge/core/react/react-components.md
  // Returns: { category: 'core', file: 'react-components.md' }
  const parts = knowledgePath.split('/');
  const category = parts[3] || 'unknown'; // .ai/knowledge/[category]/...
  const filename = parts[parts.length - 1] || 'unknown';
  return { category, file: filename };
};

const trackKnowledgeLoad = (knowledgePath, agentName, agentId) => {
  const timestamp = formatTimestamp(new Date());
  const { category, file } = extractCategoryAndFile(knowledgePath);

  const logEntry = JSON.stringify({
    category: category,
    file: file,
    agent_name: agentName,
    agent_id: agentId,
    timestamp: timestamp
  }) + '\n';

  try {
    appendFileSync(TRACKER_PATH, logEntry, 'utf-8');
  } catch (error) {
    console.error(`Warning: Failed to track knowledge load: ${error.message}`, { toStderr: true });
  }
};

const trackMultipleKnowledge = (results, agentName, agentId) => {
  if (!agentName || !agentId) {
    console.error('Warning: --agent-name and --agent-id are required for tracking', { toStderr: true });
    return;
  }

  for (const result of results) {
    trackKnowledgeLoad(result.knowledge_path, agentName, agentId);
  }
};

const trackMetrics = (args, results, tokenEstimate, allResults) => {
  // Extract unique categories from loaded packages
  const categories = [...new Set(allResults.map(r => r.category))].sort();

  const metrics = {
    timestamp: formatTimestamp(new Date()),
    pack_returned: results.length,
    pack_tracked: allResults.length, // Actual number of tracker.jsonl entries with this agent_id
    tokens: tokenEstimate,
    search_mode: args.commandProfile ? 'command-profile' : 'manual',
    command_profile: args.commandProfile || null,
    tags: args.tags.length > 0 ? args.tags : null,
    categories: categories.length > 0 ? categories : null,
    agent_name: args.agentName || null,
    agent_id: args.agentId || null,
    user_prompt: args.prompt || null,
  };

  try {
    appendFileSync(METRICS_PATH, JSON.stringify(metrics) + '\n', 'utf-8');
  } catch (error) {
    // Silent fail - don't break search execution
  }
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

  // Apply exclude_categories filter if specified
  const excludeCategories = profile.exclude_categories || [];
  if (excludeCategories.length > 0) {
    return allResults.filter(result => {
      // Use prefix matching to support hierarchical categories
      // e.g., exclude_categories: ["business"] should exclude both "business" and "business/tokenization"
      return !excludeCategories.some(excl =>
        result.category === excl || result.category.startsWith(excl + '/')
      );
    });
  }

  return allResults;
};

const searchKnowledge = (mapping, filters) => {
  const results = [];
  const { tags, text, agent, category } = filters;

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

      results.push({
        name,
        category: cat,
        description: packageDescription,
        tags: packageTags,
        used_by_agents: usedByAgents,
        required_knowledge: packageData.required_knowledge ?? [],
        optional_knowledge: packageData.optional_knowledge ?? [],
        knowledge_path: packageData.knowledge_path ?? `${mapping.skills_location}/${cat}/${name}/${name}.md`,
      });
    }
  }

  return results;
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

OUTPUT:
  Structured JSON with matching knowledge packages, dependencies, and token estimate
  When --agent-name and --agent-id are provided, tracking is logged to .claude/knowledge/tracker/tracker.jsonl
  Agent profile results include 'source' field: 'always_load' or 'tag_search'
`;

  console.log(helpText);
};

const listCategories = (mapping) => {
  const metadata = mapping.metadata;
  if (!metadata || !metadata.categories) {
    console.error(JSON.stringify({ error: 'Metadata not found in knowledge.json' }, null, 2));
    process.exit(1);
  }

  const output = {
    count: metadata.categories.length,
    categories: metadata.categories
  };

  console.log(JSON.stringify(output, null, 2));
};

const listTags = (mapping) => {
  const metadata = mapping.metadata;
  if (!metadata || !metadata.tags) {
    console.error(JSON.stringify({ error: 'Metadata not found in knowledge.json' }, null, 2));
    process.exit(1);
  }

  const output = {
    count: metadata.tags.length,
    tags: metadata.tags
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

    // Track knowledge loads (mandatory when agent-name and agent-id are provided)
    if (args.agentName && args.agentId) {
      trackMultipleKnowledge(allResults, args.agentName, args.agentId);
    }

    const output = formatOutput(results, args, mapping, packageIndex);

    // Parse output to get token estimate
    const outputData = JSON.parse(output);
    trackMetrics(args, results, outputData.token_estimate || 0, allResults);

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
