import type { ClaudeSkill, FlowResult } from '@nori/shared';
import { listSkills } from './actions/list-skills.js';
import { readSkill } from './actions/read-skill.js';
import { writeSkill } from './actions/write-skill.js';

export interface ClaudeSkillsInput {
  projectPath: string;
}

export async function runListClaudeSkills(
  input: ClaudeSkillsInput,
): Promise<FlowResult<{ skills: ClaudeSkill[] }>> {
  return listSkills(input.projectPath);
}

export async function runReadClaudeSkill(
  input: ClaudeSkillsInput & { name: string },
): Promise<FlowResult<{ name: string; content: string; path: string }>> {
  return readSkill(input.projectPath, input.name);
}

export async function runWriteClaudeSkill(
  input: ClaudeSkillsInput & { name: string; content: string },
): Promise<FlowResult<{ skill: ClaudeSkill }>> {
  return writeSkill(input.projectPath, input.name, input.content);
}
