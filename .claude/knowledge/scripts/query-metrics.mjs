#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'fs';
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

// Query: Top packages by load frequency
const topPackages = (limit = 10) => {
  const reads = readJSONL(join(METRICS_DIR, 'package-reads.jsonl'));
  const counts = {};

  reads.forEach(entry => {
    counts[entry.package] = (counts[entry.package] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([pkg, count]) => ({ package: pkg, loads: count }));
};

// Query: Failed commands
const failedCommands = (days = 7) => {
  const commands = readJSONL(join(METRICS_DIR, 'role-commands.jsonl'));
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return commands.filter(entry => {
    return entry.status === 'error' && new Date(entry.timestamp) >= cutoff;
  });
};

// Query: Search misses (no results)
const searchMisses = () => {
  const searches = readJSONL(join(METRICS_DIR, 'knowledge-searches.jsonl'));
  return searches.filter(entry => entry.results_count === 0);
};

// Query: Role stats
const roleStats = () => {
  const commands = readJSONL(join(METRICS_DIR, 'role-commands.jsonl'));
  const stats = {};

  commands.forEach(entry => {
    if (!stats[entry.command]) {
      stats[entry.command] = { total: 0, success: 0, errors: 0 };
    }
    stats[entry.command].total++;
    if (entry.status === 'success') {
      stats[entry.command].success++;
    } else {
      stats[entry.command].errors++;
    }
  });

  return stats;
};

// Query: Search stats
const searchStats = () => {
  const searches = readJSONL(join(METRICS_DIR, 'knowledge-searches.jsonl'));

  if (searches.length === 0) {
    return {
      total: 0,
      with_results: 0,
      no_results: 0,
      hit_rate: 0,
      avg_latency_ms: 0,
      p95_latency_ms: 0
    };
  }

  const withResults = searches.filter(s => s.results_count > 0).length;
  const noResults = searches.filter(s => s.results_count === 0).length;
  const hitRate = searches.length > 0 ? (withResults / searches.length * 100).toFixed(1) : 0;

  const latencies = searches.map(s => s.duration_ms).sort((a, b) => a - b);
  const avgLatency = (latencies.reduce((sum, l) => sum + l, 0) / latencies.length).toFixed(1);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95Latency = latencies[p95Index] || 0;

  return {
    total: searches.length,
    with_results: withResults,
    no_results: noResults,
    hit_rate: `${hitRate}%`,
    avg_latency_ms: parseFloat(avgLatency),
    p95_latency_ms: p95Latency
  };
};

// CLI
const main = () => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '--top-packages') {
    const limit = parseInt(args[1] || '10', 10);
    console.log(JSON.stringify(topPackages(limit), null, 2));
  } else if (command === '--failures') {
    const daysArg = args.find(a => a.startsWith('--days='));
    const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : 7;
    console.log(JSON.stringify(failedCommands(days), null, 2));
  } else if (command === '--search-misses') {
    console.log(JSON.stringify(searchMisses(), null, 2));
  } else if (command === '--role-stats') {
    console.log(JSON.stringify(roleStats(), null, 2));
  } else if (command === '--search-stats') {
    console.log(JSON.stringify(searchStats(), null, 2));
  } else {
    console.log('Usage:');
    console.log('  query-metrics.mjs --top-packages [limit]');
    console.log('  query-metrics.mjs --failures [--days=N]');
    console.log('  query-metrics.mjs --search-misses');
    console.log('  query-metrics.mjs --role-stats');
    console.log('  query-metrics.mjs --search-stats');
  }
};

main();
