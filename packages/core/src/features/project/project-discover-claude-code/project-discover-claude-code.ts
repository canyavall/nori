import type { DiscoveredProject, FlowResult } from '@nori/shared';
import { readClaudeConfig } from './actions/read-claude-config.js';
import { checkNoriStatus } from './actions/check-nori-status.js';

export interface ProjectDiscoverClaudeCodeInput {
  configPath?: string;
}

export async function runProjectDiscoverClaudeCode(
  input: ProjectDiscoverClaudeCodeInput = {},
): Promise<FlowResult<{ discovered: DiscoveredProject[] }>> {
  const configResult = readClaudeConfig(input.configPath);
  const statusResult = checkNoriStatus(configResult.data.projects);

  return { success: true, data: { discovered: statusResult.data.discovered } };
}
