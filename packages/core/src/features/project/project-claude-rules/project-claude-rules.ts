import type { ClaudeRule, ClaudeRuleType, FlowResult } from '@nori/shared';
import { listRules } from './actions/list-rules.js';
import { readRule } from './actions/read-rule.js';
import { writeRule } from './actions/write-rule.js';

export interface ClaudeRulesInput {
  projectPath: string;
}

export async function runListClaudeRules(
  input: ClaudeRulesInput,
): Promise<FlowResult<{ rules: ClaudeRule[] }>> {
  return listRules(input.projectPath);
}

export async function runReadClaudeRule(
  input: ClaudeRulesInput & { relativePath: string },
): Promise<FlowResult<{ relativePath: string; content: string; type: ClaudeRuleType }>> {
  return readRule(input.projectPath, input.relativePath);
}

export async function runWriteClaudeRule(
  input: ClaudeRulesInput & { relativePath: string; content: string },
): Promise<FlowResult<{ rule: ClaudeRule }>> {
  return writeRule(input.projectPath, input.relativePath, input.content);
}
