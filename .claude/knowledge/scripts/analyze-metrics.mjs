#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const METRICS_DIR = '.claude/knowledge/metrics';

// Read JSONL file
const readJSONL = (file) => {
  if (!existsSync(file)) return [];

  try {
    const content = readFileSync(file, 'utf-8').trim();
    if (!content) return [];
    return content.split('\n').map(line => JSON.parse(line));
  } catch {
    return [];
  }
};

// Parse date argument
const parseDate = (args) => {
  const dateArg = args.find(a => a.startsWith('--date='));
  if (dateArg) {
    return dateArg.split('=')[1];
  }

  const last7 = args.includes('--last-7-days');
  if (last7) {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }

  // Default: today
  return new Date().toISOString().split('T')[0];
};

// Filter entries by date
const filterByDate = (entries, startDate) => {
  const cutoff = new Date(startDate);
  return entries.filter(entry => new Date(entry.timestamp) >= cutoff);
};

// Analyze role commands
const analyzeRoleCommands = (commands) => {
  if (commands.length === 0) return null;

  const stats = {};
  commands.forEach(cmd => {
    if (!stats[cmd.command]) {
      stats[cmd.command] = { total: 0, success: 0, error: 0 };
    }
    stats[cmd.command].total++;
    if (cmd.status === 'success') {
      stats[cmd.command].success++;
    } else {
      stats[cmd.command].error++;
    }
  });

  return Object.entries(stats).map(([command, data]) => ({
    command,
    invocations: data.total,
    success_rate: `${Math.round(data.success / data.total * 100)}%`
  }));
};

// Analyze package reads
const analyzePackageReads = (reads) => {
  if (reads.length === 0) return null;

  const counts = {};
  const dedupCounts = {};

  reads.forEach(read => {
    counts[read.package] = (counts[read.package] || 0) + 1;
    if (read.already_loaded) {
      dedupCounts[read.package] = (dedupCounts[read.package] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pkg, count]) => ({
      package: pkg,
      loads: count,
      dedup_rate: dedupCounts[pkg] ? `${Math.round(dedupCounts[pkg] / count * 100)}%` : '0%'
    }));
};

// Analyze searches
const analyzeSearches = (searches) => {
  if (searches.length === 0) return null;

  const withResults = searches.filter(s => s.results_count > 0).length;
  const noResults = searches.filter(s => s.results_count === 0).length;
  const hitRate = searches.length > 0 ? Math.round(withResults / searches.length * 100) : 0;

  const latencies = searches.map(s => s.duration_ms).sort((a, b) => a - b);
  const avgLatency = Math.round(latencies.reduce((sum, l) => sum + l, 0) / latencies.length);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95Latency = latencies[p95Index] || 0;

  return {
    total: searches.length,
    hit_rate: `${hitRate}% (${withResults} with results, ${noResults} no results)`,
    avg_latency: `${avgLatency}ms (p95: ${p95Latency}ms)`
  };
};

// Find zero-result searches
const findZeroResultSearches = (searches) => {
  return searches
    .filter(s => s.results_count === 0)
    .slice(0, 5)
    .map(s => ({
      prompt: s.prompt || 'N/A',
      tags: s.tags.join(', ') || 'none'
    }));
};

// Main analysis
const main = () => {
  const args = process.argv.slice(2);
  const startDate = parseDate(args);

  console.log(`Knowledge System Metrics - Since ${startDate}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Load data
  const roleCommands = filterByDate(readJSONL(join(METRICS_DIR, 'role-commands.jsonl')), startDate);
  const packageReads = filterByDate(readJSONL(join(METRICS_DIR, 'package-reads.jsonl')), startDate);
  const searches = filterByDate(readJSONL(join(METRICS_DIR, 'knowledge-searches.jsonl')), startDate);

  // Role Commands
  const roleStats = analyzeRoleCommands(roleCommands);
  if (roleStats) {
    console.log('Role Commands:');
    roleStats.forEach(stat => {
      console.log(`  ${stat.command.padEnd(20)} ${stat.invocations} invocations (${stat.success_rate} success)`);
    });
    console.log('');
  } else {
    console.log('Role Commands: No data\n');
  }

  // Package Reads
  const packageStats = analyzePackageReads(packageReads);
  if (packageStats) {
    console.log('Top 10 Packages:');
    packageStats.forEach(stat => {
      console.log(`  ${stat.package.padEnd(35)} ${String(stat.loads).padStart(3)} loads (${stat.dedup_rate} dedup rate)`);
    });
    console.log('');
  } else {
    console.log('Package Reads: No data\n');
  }

  // Searches
  const searchStats = analyzeSearches(searches);
  if (searchStats) {
    console.log('Searches:');
    console.log(`  Total: ${searchStats.total} searches`);
    console.log(`  Hit rate: ${searchStats.hit_rate}`);
    console.log(`  Latency: ${searchStats.avg_latency}`);
    console.log('');
  } else {
    console.log('Searches: No data\n');
  }

  // Zero-Result Searches
  const zeroResults = findZeroResultSearches(searches);
  if (zeroResults.length > 0) {
    console.log('Zero-Result Searches (missing knowledge):');
    zeroResults.forEach(search => {
      console.log(`  - "${search.prompt}" (tags: ${search.tags})`);
    });
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
};

main();
