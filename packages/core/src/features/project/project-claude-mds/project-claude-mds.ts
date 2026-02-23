import type { ClaudeMdFile, FlowResult } from '@nori/shared';
import { listClaudeMds } from './actions/list-claude-mds.js';

export interface ClaudeMdsInput {
  projectPath: string;
}

export async function runListClaudeMds(
  input: ClaudeMdsInput,
): Promise<FlowResult<{ files: ClaudeMdFile[] }>> {
  return listClaudeMds(input.projectPath);
}
