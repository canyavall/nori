import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { StepResult, FlowError } from '@nori/shared';

export interface CurrentVersionResult {
  current_version: string;
  version_source: string;
}

export function checkCurrentVersion(): StepResult<CurrentVersionResult> | FlowError {
  try {
    // Read version from the root package.json
    const pkgPath = join(process.cwd(), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

    if (!pkg.version) {
      return {
        success: true,
        data: { current_version: '0.0.0', version_source: 'fallback' },
      };
    }

    return {
      success: true,
      data: { current_version: pkg.version, version_source: 'package.json' },
    };
  } catch {
    return {
      success: true,
      data: { current_version: '0.0.0', version_source: 'fallback' },
    };
  }
}
