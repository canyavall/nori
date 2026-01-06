#!/usr/bin/env node

/**
 * Script Usage Analyzer
 *
 * Analyzes scripts-usage.jsonl to show performance metrics and usage patterns.
 *
 * Usage:
 *   node analyze-script-usage.mjs [--script knowledge-search|knowledge-load]
 *   node analyze-script-usage.mjs --last N (show last N entries)
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USAGE_LOG = join(__dirname, '../tracker/scripts-usage.jsonl');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const result = { script: null, last: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--script') {
      result.script = args[i + 1];
      i++;
    } else if (args[i] === '--last') {
      result.last = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return result;
};

const readLog = () => {
  if (!existsSync(USAGE_LOG)) {
    console.error('No usage log found at:', USAGE_LOG);
    return [];
  }

  const content = readFileSync(USAGE_LOG, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);

  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (error) {
      console.error('Failed to parse line:', line.substring(0, 50));
      return null;
    }
  }).filter(Boolean);
};

const analyzeUsage = (entries, scriptFilter) => {
  const filtered = scriptFilter
    ? entries.filter(e => e.script === scriptFilter)
    : entries;

  if (filtered.length === 0) {
    console.log('No entries found');
    return;
  }

  // Group by script
  const byScript = {};
  filtered.forEach(entry => {
    if (!byScript[entry.script]) {
      byScript[entry.script] = [];
    }
    byScript[entry.script].push(entry);
  });

  console.log(`\n📊 Script Usage Analysis\n`);
  console.log(`Total entries: ${filtered.length}`);
  console.log(`Date range: ${filtered[0].timestamp} to ${filtered[filtered.length - 1].timestamp}\n`);

  // Stats per script
  for (const [script, scriptEntries] of Object.entries(byScript)) {
    console.log(`\n━━━ ${script} ━━━`);
    console.log(`Executions: ${scriptEntries.length}`);

    const times = scriptEntries.map(e => e.execution_time_ms);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log(`Performance:`);
    console.log(`  Avg: ${avgTime.toFixed(1)}ms`);
    console.log(`  Min: ${minTime}ms`);
    console.log(`  Max: ${maxTime}ms`);

    const successes = scriptEntries.filter(e => e.result.status === 'success').length;
    const errors = scriptEntries.filter(e => e.result.status === 'error').length;

    console.log(`Success rate: ${successes}/${scriptEntries.length} (${((successes / scriptEntries.length) * 100).toFixed(1)}%)`);

    if (errors > 0) {
      console.log(`Errors: ${errors}`);
      const errorTypes = {};
      scriptEntries
        .filter(e => e.result.error)
        .forEach(e => {
          const errMsg = e.result.error.substring(0, 50);
          errorTypes[errMsg] = (errorTypes[errMsg] || 0) + 1;
        });
      console.log('Error types:');
      Object.entries(errorTypes).forEach(([err, count]) => {
        console.log(`  - ${err}... (${count}x)`);
      });
    }

    // Script-specific stats
    if (script === 'knowledge-search') {
      const avgResults = scriptEntries
        .filter(e => e.result.count !== undefined)
        .reduce((sum, e) => sum + e.result.count, 0) / scriptEntries.length;
      console.log(`Avg results per search: ${avgResults.toFixed(1)}`);

      const avgTokens = scriptEntries
        .filter(e => e.result.token_estimate)
        .reduce((sum, e) => sum + e.result.token_estimate, 0) / scriptEntries.length;
      console.log(`Avg token estimate: ${avgTokens.toFixed(0)}`);
    }

    if (script === 'knowledge-load') {
      const avgLoaded = scriptEntries
        .filter(e => e.result.loaded !== undefined)
        .reduce((sum, e) => sum + e.result.loaded, 0) / scriptEntries.length;
      console.log(`Avg packages loaded: ${avgLoaded.toFixed(1)}`);

      const cacheHitRate = scriptEntries
        .filter(e => e.result.already_loaded !== undefined)
        .reduce((sum, e) => sum + (e.result.already_loaded > 0 ? 1 : 0), 0) / scriptEntries.length;
      console.log(`Cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%`);
    }
  }

  console.log('\n');
};

const showLast = (entries, count) => {
  const recent = entries.slice(-count);

  console.log(`\n📝 Last ${count} Script Executions:\n`);

  recent.forEach((entry, idx) => {
    const time = new Date(entry.timestamp).toLocaleTimeString();
    const status = entry.result.status === 'success' ? '✓' : '✗';
    console.log(`${idx + 1}. [${time}] ${status} ${entry.script} (${entry.execution_time_ms}ms)`);
    console.log(`   Caller: ${entry.caller_id || 'unknown'}`);

    if (entry.args.tags) {
      console.log(`   Tags: ${entry.args.tags.join(', ')}`);
    }
    if (entry.args.packages) {
      console.log(`   Packages: ${entry.args.packages.join(', ')}`);
    }
    if (entry.result.count !== undefined) {
      console.log(`   Results: ${entry.result.count}`);
    }
    if (entry.result.error) {
      console.log(`   Error: ${entry.result.error}`);
    }
    console.log('');
  });
};

const main = () => {
  const args = parseArgs();
  const entries = readLog();

  if (entries.length === 0) {
    return;
  }

  if (args.last) {
    showLast(entries, args.last);
  } else {
    analyzeUsage(entries, args.script);
  }
};

main();
