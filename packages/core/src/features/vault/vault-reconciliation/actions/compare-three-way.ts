import type { StepResult, FlowError } from '@nori/shared';

export interface ThreeWayComparison {
  added: string[];
  modified: string[];
  deleted: string[];
  conflicts: string[];
}

/**
 * Compare local, remote, and cache states using three-way merge logic.
 *
 * - added: files in local but not in cache (new local files)
 * - modified: files in local with different hash from cache
 * - deleted: files in cache but not in local
 * - conflicts: files modified in both local and remote relative to cache
 */
export function compareThreeWay(
  local: Map<string, string>,
  remote: Map<string, string>,
  cache: Map<string, string>
): StepResult<ThreeWayComparison> | FlowError {
  const added: string[] = [];
  const modified: string[] = [];
  const deleted: string[] = [];
  const conflicts: string[] = [];

  const allPaths = new Set([...local.keys(), ...remote.keys(), ...cache.keys()]);

  for (const path of allPaths) {
    const localHash = local.get(path);
    const remoteHash = remote.get(path);
    const cacheHash = cache.get(path);

    const localChanged = localHash !== cacheHash;
    const remoteChanged = remoteHash !== cacheHash;

    if (localHash && !cacheHash && !remoteHash) {
      // New local file, not known to cache or remote
      added.push(path);
    } else if (!localHash && cacheHash) {
      // File existed in cache but no longer locally
      if (remoteChanged && remoteHash) {
        // Remote also changed -> conflict
        conflicts.push(path);
      } else {
        deleted.push(path);
      }
    } else if (localChanged && remoteChanged && localHash !== remoteHash) {
      // Both sides modified differently -> conflict
      conflicts.push(path);
    } else if (localChanged && !remoteChanged) {
      // Only local changed
      modified.push(path);
    } else if (!localChanged && remoteChanged) {
      // Only remote changed — will be handled by pull, not a local modification
      // We still report it for the report
      modified.push(path);
    }
  }

  return {
    success: true,
    data: { added, modified, deleted, conflicts },
  };
}
