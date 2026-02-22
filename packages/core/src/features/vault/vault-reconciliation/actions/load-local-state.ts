import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, extname } from 'node:path';
import type { StepResult, FlowError } from '@nori/shared';

export interface LocalState {
  file_hashes: Map<string, string>;
  file_count: number;
  scan_duration_ms: number;
}

function collectFiles(dir: string, baseDir: string, hashes: Map<string, string>): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name.startsWith('.nori')) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, baseDir, hashes);
    } else if (extname(entry.name) === '.md') {
      const content = readFileSync(fullPath, 'utf-8');
      const hash = createHash('sha256').update(content).digest('hex').slice(0, 16);
      const relativePath = fullPath.slice(baseDir.length + 1);
      hashes.set(relativePath, hash);
    }
  }
}

export function loadLocalState(vaultPath: string): StepResult<LocalState> | FlowError {
  const start = Date.now();

  try {
    const fileHashes = new Map<string, string>();
    collectFiles(vaultPath, vaultPath, fileHashes);

    return {
      success: true,
      data: {
        file_hashes: fileHashes,
        file_count: fileHashes.size,
        scan_duration_ms: Date.now() - start,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'LOCAL_STATE_FAILED',
        message: `Failed to load local vault state: ${message}`,
        step: '01-load-local-state',
        severity: 'error',
        recoverable: false,
        details: { vault_path: vaultPath, error: message },
      },
    };
  }
}
