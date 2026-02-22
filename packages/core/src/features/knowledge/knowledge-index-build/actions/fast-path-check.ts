import { existsSync, statSync } from 'node:fs';
import type { StepResult } from '@nori/shared';

export interface FastPathResult {
  rebuild_needed: boolean;
  check_duration_ms: number;
}

export function fastPathCheck(vaultPath: string, indexPath: string): StepResult<FastPathResult> {
  const start = Date.now();

  if (!existsSync(indexPath)) {
    return { success: true, data: { rebuild_needed: true, check_duration_ms: Date.now() - start } };
  }

  try {
    const vaultStat = statSync(vaultPath);
    const indexStat = statSync(indexPath);

    const rebuildNeeded = vaultStat.mtimeMs > indexStat.mtimeMs;
    return { success: true, data: { rebuild_needed: rebuildNeeded, check_duration_ms: Date.now() - start } };
  } catch {
    return { success: true, data: { rebuild_needed: true, check_duration_ms: Date.now() - start } };
  }
}
