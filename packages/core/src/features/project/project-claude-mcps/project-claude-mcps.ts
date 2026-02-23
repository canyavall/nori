import type { ClaudeMcpServer, FlowResult } from '@nori/shared';
import { readMcps } from './actions/read-mcps.js';
import { writeMcps } from './actions/write-mcps.js';

export interface ClaudeMcpsInput {
  projectPath: string;
}

export async function runReadClaudeMcps(
  input: ClaudeMcpsInput,
): Promise<FlowResult<{ servers: ClaudeMcpServer[]; raw: string }>> {
  return readMcps(input.projectPath);
}

export async function runWriteClaudeMcps(
  input: ClaudeMcpsInput & { content: string },
): Promise<FlowResult<{ servers: ClaudeMcpServer[] }>> {
  return writeMcps(input.projectPath, input.content);
}
