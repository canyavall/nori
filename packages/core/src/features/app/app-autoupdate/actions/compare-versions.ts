import type { StepResult, FlowError } from '@nori/shared';

export interface CompareVersionsResult {
  current_version: string;
  latest_version: string;
  update_needed: boolean;
}

function parseSemver(version: string): [number, number, number] | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

export function compareVersions(
  currentVersion: string,
  latestVersion: string
): StepResult<CompareVersionsResult> | FlowError {
  const current = parseSemver(currentVersion);
  const latest = parseSemver(latestVersion);

  if (!current || !latest) {
    return {
      success: true,
      data: {
        current_version: currentVersion,
        latest_version: latestVersion,
        update_needed: false,
      },
    };
  }

  const updateNeeded =
    latest[0] > current[0] ||
    (latest[0] === current[0] && latest[1] > current[1]) ||
    (latest[0] === current[0] && latest[1] === current[1] && latest[2] > current[2]);

  return {
    success: true,
    data: {
      current_version: currentVersion,
      latest_version: latestVersion,
      update_needed: updateNeeded,
    },
  };
}
