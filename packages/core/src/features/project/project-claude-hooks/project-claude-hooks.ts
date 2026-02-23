import type { ClaudeHookConfig, FlowResult } from '@nori/shared';
import { readHooks } from './actions/read-hooks.js';
import { writeHooks } from './actions/write-hooks.js';

export interface ClaudeHooksInput {
  projectPath: string;
}

export async function runReadClaudeHooks(
  input: ClaudeHooksInput,
): Promise<
  FlowResult<{
    shared: ClaudeHookConfig | null;
    local: ClaudeHookConfig | null;
    sharedRaw: string;
    localRaw: string;
  }>
> {
  return readHooks(input.projectPath);
}

export async function runWriteClaudeHooks(
  input: ClaudeHooksInput & { target: 'shared' | 'local'; hooksJson: string },
): Promise<FlowResult<{ hooks: ClaudeHookConfig }>> {
  return writeHooks(input.projectPath, input.target, input.hooksJson);
}
