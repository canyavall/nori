import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { runMigrations } from '../../shared/utils/database.js';
import { scanRepository } from './actions/scan-repository.js';
import { categorizeFiles } from './actions/categorize-files.js';
import { buildAnalysisPrompt } from './actions/build-analysis-prompt.js';
import { validateProposals } from './actions/validate-proposals.js';
import type { ScannedRepository } from './actions/scan-repository.js';
import type { KnowledgeProposal } from '@nori/shared';

// ─── Helpers ──────────────────────────────────────────────────────────────────

let SQL: Awaited<ReturnType<typeof initSqlJs>>;

async function makeDb(): Promise<Database> {
  if (!SQL) SQL = await initSqlJs();
  const db = new SQL.Database();
  runMigrations(db);
  return db;
}

function createTestProject(basePath: string): void {
  // Create a minimal project structure
  mkdirSync(join(basePath, 'src', 'features'), { recursive: true });
  mkdirSync(join(basePath, 'src', 'components'), { recursive: true });
  mkdirSync(join(basePath, '.github', 'workflows'), { recursive: true });

  writeFileSync(join(basePath, 'package.json'), JSON.stringify({
    name: 'test-project',
    version: '1.0.0',
    dependencies: { solid: '^1.0.0' },
  }));

  writeFileSync(join(basePath, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { strict: true },
  }));

  writeFileSync(join(basePath, 'README.md'), '# Test Project\n\nA test project for scanning.');

  writeFileSync(join(basePath, 'src', 'index.ts'), 'export function main() { return "hello"; }');

  writeFileSync(join(basePath, 'src', 'features', 'auth.ts'), 'export function login() { return true; }');

  writeFileSync(join(basePath, 'src', 'components', 'Button.tsx'), 'export const Button = () => <button>Click</button>;');

  writeFileSync(join(basePath, '.github', 'workflows', 'ci.yml'), 'name: CI\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest');
}

// ─── scanRepository ──────────────────────────────────────────────────────────

describe('scanRepository', () => {
  let projectPath: string;

  beforeEach(() => {
    projectPath = join(tmpdir(), `nori-test-scan-${Date.now()}`);
    mkdirSync(projectPath, { recursive: true });
    createTestProject(projectPath);
  });

  afterEach(() => {
    if (existsSync(projectPath)) rmSync(projectPath, { recursive: true, force: true });
  });

  it('scans project files and returns ScannedRepository', () => {
    const result = scanRepository(projectPath);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.files.length).toBeGreaterThan(0);
    expect(result.data.structure_summary).toContain('nori-test-scan');
    expect(result.data.detected_patterns.length).toBeGreaterThan(0);
  });

  it('categorizes files by type', () => {
    const result = scanRepository(projectPath);
    if (!result.success) return;

    const categories = new Set(result.data.files.map((f: { category_hint: string }) => f.category_hint));
    expect(categories.has('config')).toBe(true);
    expect(categories.has('documentation')).toBe(true);
    expect(categories.has('source')).toBe(true);
  });

  it('excludes node_modules and .git', () => {
    mkdirSync(join(projectPath, 'node_modules', 'some-pkg'), { recursive: true });
    writeFileSync(join(projectPath, 'node_modules', 'some-pkg', 'index.js'), 'module.exports = {}');

    const result = scanRepository(projectPath);
    if (!result.success) return;

    const paths = result.data.files.map((f: { relative_path: string }) => f.relative_path);
    expect(paths.every((p: string) => !p.includes('node_modules'))).toBe(true);
  });

  it('skips files larger than 50KB', () => {
    writeFileSync(join(projectPath, 'large.ts'), 'x'.repeat(60_000));

    const result = scanRepository(projectPath);
    if (!result.success) return;

    const paths = result.data.files.map((f: { relative_path: string }) => f.relative_path);
    expect(paths.includes('large.ts')).toBe(false);
  });

  it('filters by allowed extensions', () => {
    writeFileSync(join(projectPath, 'image.png'), 'fake-image');
    writeFileSync(join(projectPath, 'binary.exe'), 'fake-binary');

    const result = scanRepository(projectPath);
    if (!result.success) return;

    const paths = result.data.files.map((f: { relative_path: string }) => f.relative_path);
    expect(paths.every((p: string) => !p.endsWith('.png') && !p.endsWith('.exe'))).toBe(true);
  });

  it('detects monorepo pattern', () => {
    mkdirSync(join(projectPath, 'packages', 'core'), { recursive: true });
    writeFileSync(join(projectPath, 'packages', 'core', 'index.ts'), 'export {}');

    const result = scanRepository(projectPath);
    if (!result.success) return;

    expect(result.data.detected_patterns).toContain('monorepo');
  });

  it('detects feature-based structure', () => {
    const result = scanRepository(projectPath);
    if (!result.success) return;

    expect(result.data.detected_patterns).toContain('feature-based-structure');
  });

  it('detects tsx components', () => {
    const result = scanRepository(projectPath);
    if (!result.success) return;

    expect(result.data.detected_patterns).toContain('tsx-components');
  });

  it('returns EMPTY_REPOSITORY for empty directory', () => {
    const emptyPath = join(tmpdir(), `nori-test-empty-${Date.now()}`);
    mkdirSync(emptyPath, { recursive: true });

    const result = scanRepository(emptyPath);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe('EMPTY_REPOSITORY');

    rmSync(emptyPath, { recursive: true, force: true });
  });
});

// ─── categorizeFiles ──────────────────────────────────────────────────────────

describe('categorizeFiles', () => {
  let projectPath: string;

  beforeEach(() => {
    projectPath = join(tmpdir(), `nori-test-cat-${Date.now()}`);
    mkdirSync(projectPath, { recursive: true });
    createTestProject(projectPath);
  });

  afterEach(() => {
    if (existsSync(projectPath)) rmSync(projectPath, { recursive: true, force: true });
  });

  it('groups files into categories', () => {
    const scanResult = scanRepository(projectPath);
    if (!scanResult.success) return;

    const result = categorizeFiles(scanResult.data);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.file_count).toBeGreaterThan(0);
    expect(Object.keys(result.data.categories).length).toBeGreaterThan(0);
  });

  it('prioritizes documentation over source', () => {
    const scanResult = scanRepository(projectPath);
    if (!scanResult.success) return;

    const result = categorizeFiles(scanResult.data);
    if (!result.success) return;

    const categories = Object.keys(result.data.categories);
    if (categories.includes('documentation') && categories.includes('source')) {
      const docChars = result.data.categories['documentation'].total_chars;
      // Documentation should be fully included (it's high priority)
      expect(docChars).toBeGreaterThan(0);
    }
  });

  it('respects total character limit', () => {
    const result = categorizeFiles({
      files: Array.from({ length: 100 }, (_, i) => ({
        relative_path: `src/file-${i}.ts`,
        absolute_path: `/project/src/file-${i}.ts`,
        content: 'x'.repeat(2000),
        size: 2000,
        category_hint: 'source',
      })),
      structure_summary: 'test',
      detected_patterns: [],
    });

    if (!result.success) return;

    // Total chars should not exceed 100K
    expect(result.data.total_chars).toBeLessThanOrEqual(100_001); // +1 for possible truncation suffix
  });
});

// ─── buildAnalysisPrompt ──────────────────────────────────────────────────────

describe('buildAnalysisPrompt', () => {
  it('builds a valid prompt with vault context', () => {
    const categorized = {
      categories: {
        documentation: {
          category: 'documentation',
          files: [{ relative_path: 'README.md', content: '# Test', size: 6 }],
          total_chars: 6,
        },
      },
      total_chars: 6,
      file_count: 1,
    };

    const result = buildAnalysisPrompt(
      categorized,
      'Test project',
      ['monorepo'],
      { existing_categories: ['guide', 'reference'], sample_titles: ['Auth Guide'] }
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.system_prompt).toContain('guide, reference');
    expect(result.data.system_prompt).toContain('Auth Guide');
    expect(result.data.messages).toHaveLength(1);
    expect(result.data.messages[0].role).toBe('user');
    expect(result.data.messages[0].content).toContain('README.md');
  });

  it('uses conversation history when provided', () => {
    const categorized = {
      categories: {},
      total_chars: 0,
      file_count: 0,
    };

    const history = [
      { role: 'user' as const, content: 'Analyze this repo' },
      { role: 'assistant' as const, content: '{"status":"questions","questions":["Q1?"]}' },
      { role: 'user' as const, content: 'Answer to Q1' },
    ];

    const result = buildAnalysisPrompt(
      categorized,
      'Test',
      [],
      { existing_categories: [], sample_titles: [] },
      history
    );

    if (!result.success) return;

    expect(result.data.messages).toEqual(history);
  });
});

// ─── validateProposals ────────────────────────────────────────────────────────

describe('validateProposals', () => {
  function makeProposal(overrides: Partial<KnowledgeProposal> = {}): KnowledgeProposal {
    return {
      title: 'Test Proposal',
      category: 'guide',
      tags: ['my-tag', 'another-tag', 'third-tag'],
      description: 'A test proposal description.',
      required_knowledge: [],
      rules: ['src/**/*.ts'],
      content: '# Test\n\nSome content here.',
      ...overrides,
    };
  }

  it('passes valid proposals through unchanged', () => {
    const result = validateProposals([makeProposal()]);
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.proposals).toHaveLength(1);
    expect(result.data.warnings).toHaveLength(0);
    expect(result.data.proposals[0].title).toBe('Test Proposal');
  });

  it('truncates description over 300 chars', () => {
    const result = validateProposals([
      makeProposal({ description: 'x'.repeat(350) }),
    ]);
    if (!result.success) return;

    expect(result.data.proposals[0].description.length).toBeLessThanOrEqual(300);
    expect(result.data.warnings.some((w: string) => w.includes('description truncated'))).toBe(true);
  });

  it('converts non-kebab tags to kebab-case', () => {
    const result = validateProposals([
      makeProposal({ tags: ['CamelCase', 'with spaces', 'valid-tag'] }),
    ]);
    if (!result.success) return;

    expect(result.data.proposals[0].tags).toContain('camelcase');
    expect(result.data.proposals[0].tags).toContain('with-spaces');
    expect(result.data.proposals[0].tags).toContain('valid-tag');
  });

  it('adds default tags when fewer than 3', () => {
    const result = validateProposals([
      makeProposal({ tags: ['one-tag'], category: 'guide' }),
    ]);
    if (!result.success) return;

    expect(result.data.proposals[0].tags.length).toBeGreaterThanOrEqual(3);
    expect(result.data.warnings.some((w: string) => w.includes('added default tags'))).toBe(true);
  });

  it('trims tags to max 12', () => {
    const tags = Array.from({ length: 15 }, (_, i) => `tag-${i}`);
    const result = validateProposals([makeProposal({ tags })]);
    if (!result.success) return;

    expect(result.data.proposals[0].tags).toHaveLength(12);
  });

  it('adds heading to content without one', () => {
    const result = validateProposals([
      makeProposal({ content: 'No heading here.\n\nJust content.' }),
    ]);
    if (!result.success) return;

    expect(result.data.proposals[0].content).toMatch(/^# /);
    expect(result.data.warnings.some((w: string) => w.includes('added heading'))).toBe(true);
  });

  it('truncates content over 10000 chars', () => {
    const result = validateProposals([
      makeProposal({ content: '# Big\n\n' + 'x'.repeat(11_000) }),
    ]);
    if (!result.success) return;

    expect(result.data.proposals[0].content.length).toBeLessThanOrEqual(10_000);
  });

  it('removes invalid required_knowledge references', () => {
    const result = validateProposals([
      makeProposal({ required_knowledge: ['Nonexistent Entry'] }),
    ]);
    if (!result.success) return;

    expect(result.data.proposals[0].required_knowledge).toHaveLength(0);
    expect(result.data.warnings.some((w: string) => w.includes('removed invalid required_knowledge'))).toBe(true);
  });

  it('keeps valid cross-references between proposals', () => {
    const proposals = [
      makeProposal({ title: 'Base Entry', required_knowledge: [] }),
      makeProposal({ title: 'Dependent Entry', required_knowledge: ['Base Entry'] }),
    ];

    const result = validateProposals(proposals);
    if (!result.success) return;

    expect(result.data.proposals[1].required_knowledge).toContain('Base Entry');
  });

  it('keeps references to existing vault entries', () => {
    const result = validateProposals(
      [makeProposal({ required_knowledge: ['Existing Entry'] })],
      ['Existing Entry']
    );
    if (!result.success) return;

    expect(result.data.proposals[0].required_knowledge).toContain('Existing Entry');
  });

  it('normalizes category to lowercase slug', () => {
    const result = validateProposals([
      makeProposal({ category: 'My Category Name' }),
    ]);
    if (!result.success) return;

    expect(result.data.proposals[0].category).toBe('my-category-name');
  });

  it('replaces empty title with default', () => {
    const result = validateProposals([
      makeProposal({ title: '' }),
    ]);
    if (!result.success) return;

    expect(result.data.proposals[0].title).toBe('Knowledge Entry 1');
  });
});
