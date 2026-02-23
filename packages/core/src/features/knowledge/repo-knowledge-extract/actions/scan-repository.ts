import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, basename, relative } from 'node:path';
import type { StepResult, FlowError } from '@nori/shared';

export interface ScannedFile {
  relative_path: string;
  absolute_path: string;
  content: string;
  size: number;
  category_hint: string;
}

export interface ScannedRepository {
  files: ScannedFile[];
  structure_summary: string;
  detected_patterns: string[];
}

const SCAN_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.json', '.yaml', '.yml', '.toml', '.md', '.mdx',
]);

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.nori', '.next', '.turbo',
  '.cache', '.output', 'target', '__pycache__', '.venv',
]);

const EXCLUDE_FILES = new Set([
  'bun.lock', 'bun.lockb', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'shrinkwrap.json', 'Cargo.lock',
]);

const MAX_FILE_SIZE = 50 * 1024; // 50KB

function categorizeFile(relativePath: string, fileName: string): string {
  const lower = fileName.toLowerCase();
  const lowerPath = relativePath.toLowerCase();

  // Config files
  if (/^tsconfig/.test(lower) || /\.(eslint|prettier)/.test(lower) ||
      /tailwind\.config/.test(lower) || /vite\.config/.test(lower) ||
      /jest\.config/.test(lower) || /vitest\.config/.test(lower) ||
      /\.babelrc/.test(lower) || lower === 'turbo.json' ||
      lower === 'biome.json' || lower === '.editorconfig') {
    return 'config';
  }

  // Documentation
  if (/readme/i.test(lower) || /contributing/i.test(lower) ||
      /architecture/i.test(lower) || /claude\.md/i.test(lower) ||
      /changelog/i.test(lower) || /adr\//i.test(lowerPath) ||
      /docs?\//i.test(lowerPath)) {
    return 'documentation';
  }

  // CI/CD
  if (/\.github\//i.test(lowerPath) || /\.gitlab-ci/i.test(lower) ||
      /dockerfile/i.test(lower) || /docker-compose/i.test(lower) ||
      /\.circleci/i.test(lowerPath) || /jenkinsfile/i.test(lower)) {
    return 'cicd';
  }

  // Package/dependency files
  if (lower === 'package.json' || lower === 'cargo.toml' || lower === 'pyproject.toml') {
    return 'dependencies';
  }

  // Source code
  return 'source';
}

function detectPatterns(files: ScannedFile[]): string[] {
  const patterns: string[] = [];
  const paths = files.map((f) => f.relative_path);

  // Monorepo detection
  if (paths.some((p) => p.startsWith('packages/')) || paths.some((p) => p.startsWith('apps/'))) {
    patterns.push('monorepo');
  }

  // Feature-based structure
  if (paths.some((p) => /src\/features\//.test(p))) {
    patterns.push('feature-based-structure');
  }

  // Component folder structure
  if (paths.some((p) => /src\/components\//.test(p))) {
    patterns.push('component-folder-structure');
  }

  // SolidJS / React detection
  if (paths.some((p) => p.endsWith('.tsx'))) {
    patterns.push('tsx-components');
  }

  // Test files
  if (paths.some((p) => /\.test\.(ts|tsx|js|jsx)$/.test(p) || /\.spec\.(ts|tsx|js|jsx)$/.test(p))) {
    patterns.push('co-located-tests');
  }

  // Hook pattern
  if (paths.some((p) => /\.hook\.ts$/.test(p))) {
    patterns.push('hook-pattern');
  }

  // Type files
  if (paths.some((p) => /\.type\.ts$/.test(p))) {
    patterns.push('type-file-pattern');
  }

  return patterns;
}

function buildStructureSummary(files: ScannedFile[], projectPath: string): string {
  const topLevelDirs = new Set<string>();
  for (const f of files) {
    const parts = f.relative_path.split('/');
    if (parts.length > 1) topLevelDirs.add(parts[0]);
  }

  const categoryCount: Record<string, number> = {};
  for (const f of files) {
    categoryCount[f.category_hint] = (categoryCount[f.category_hint] ?? 0) + 1;
  }

  const lines: string[] = [
    `Project: ${basename(projectPath)}`,
    `Total scanned files: ${files.length}`,
    `Top-level directories: ${[...topLevelDirs].sort().join(', ')}`,
    `File categories: ${Object.entries(categoryCount).map(([k, v]) => `${k}(${v})`).join(', ')}`,
  ];

  return lines.join('\n');
}

function walkDirectory(dir: string, rootDir: string, result: ScannedFile[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry)) continue;
    if (entry.startsWith('.') && entry !== '.github' && entry !== '.gitlab-ci.yml') continue;

    const fullPath = join(dir, entry);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      walkDirectory(fullPath, rootDir, result);
      continue;
    }

    if (!stat.isFile()) continue;
    if (EXCLUDE_FILES.has(entry)) continue;

    const ext = extname(entry);
    if (!SCAN_EXTENSIONS.has(ext)) continue;
    if (stat.size > MAX_FILE_SIZE) continue;

    let content: string;
    try {
      content = readFileSync(fullPath, 'utf-8');
    } catch {
      continue;
    }

    const relativePath = relative(rootDir, fullPath);
    result.push({
      relative_path: relativePath,
      absolute_path: fullPath,
      content,
      size: stat.size,
      category_hint: categorizeFile(relativePath, entry),
    });
  }
}

export function scanRepository(
  projectPath: string
): StepResult<ScannedRepository> | FlowError {
  try {
    const files: ScannedFile[] = [];
    walkDirectory(projectPath, projectPath, files);

    if (files.length === 0) {
      return {
        success: false,
        error: {
          code: 'EMPTY_REPOSITORY',
          message: 'No scannable files found in the project directory.',
          severity: 'fatal',
          recoverable: false,
        },
      };
    }

    const detected_patterns = detectPatterns(files);
    const structure_summary = buildStructureSummary(files, projectPath);

    return {
      success: true,
      data: { files, structure_summary, detected_patterns },
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'SCAN_ERROR',
        message: `Failed to scan repository: ${err instanceof Error ? err.message : String(err)}`,
        severity: 'fatal',
        recoverable: false,
      },
    };
  }
}
