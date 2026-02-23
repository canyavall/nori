import type { FlowResult, FlowEmitter, ClaudeSkill } from '@nori/shared';
import type { LlmMessage } from '../../shared/utils/llm-client.js';
import { chatWithLlm } from './actions/chat-with-llm.js';

export interface SkillChatInput {
  projectPath: string;
  skillName: string;
  messages: LlmMessage[];
  allSkills: ClaudeSkill[];
}

export async function runSkillChat(
  input: SkillChatInput,
  emitter?: FlowEmitter,
): Promise<FlowResult<{ response: string }>> {
  return chatWithLlm(input.skillName, input.messages, input.allSkills, emitter);
}
