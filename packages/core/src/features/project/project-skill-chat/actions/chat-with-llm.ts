import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { FlowResult, FlowEmitter, ClaudeSkill } from '@nori/shared';
import { resolveAuth, noAuthError } from '../../../shared/utils/llm-client.js';
import type { LlmMessage } from '../../../shared/utils/llm-client.js';

function buildSystemPrompt(skillName: string, allSkills: ClaudeSkill[]): string {
  const skillsList = allSkills
    .map((s) => {
      const lines = [
        `## Skill: ${s.name}`,
        s.description ? `Description: ${s.description}` : '',
        s.globs?.length ? `Globs: ${s.globs.join(', ')}` : '',
        s.alwaysApply ? 'Always Apply: true' : '',
        s.content ? `\nContent:\n${s.content}` : '',
      ].filter(Boolean);
      return lines.join('\n');
    })
    .join('\n\n---\n\n');

  return `You are an expert assistant helping to improve Claude Code skill definitions.

The user is currently editing the skill "${skillName}".

All available skills in this project:
${skillsList}

Your role:
- Analyze the current skill content and suggest concrete improvements
- When providing a revised version of the skill, wrap the COMPLETE improved file content in a fenced code block with language "markdown":
\`\`\`markdown
---
description: ...
---
The full skill content here
\`\`\`
- Explain your reasoning before showing the code block
- Focus on clarity, specificity, and practical examples
- Skills are markdown files with optional YAML frontmatter (description, globs, alwaysApply)`;
}

export async function chatWithLlm(
  skillName: string,
  messages: LlmMessage[],
  allSkills: ClaudeSkill[],
  emitter?: FlowEmitter,
): Promise<FlowResult<{ response: string }>> {
  const auth = resolveAuth();
  if (auth.type === 'none') return noAuthError();

  const systemPrompt = buildSystemPrompt(skillName, allSkills);
  const modelId = 'claude-haiku-4-5-20251001';

  let anthropicProvider: ReturnType<typeof createAnthropic>;
  if (auth.type === 'api_key') {
    anthropicProvider = createAnthropic({ apiKey: auth.key });
  } else {
    const oauthToken = (auth as { type: 'oauth'; token: string }).token;
    anthropicProvider = createAnthropic({
      apiKey: 'oauth',
      fetch: async (url: Parameters<typeof globalThis.fetch>[0], options?: Parameters<typeof globalThis.fetch>[1]) => {
        const headers = new Headers(options?.headers);
        headers.delete('x-api-key');
        headers.set('Authorization', `Bearer ${oauthToken}`);
        headers.set('anthropic-beta', 'oauth-2025-04-20');
        return globalThis.fetch(url, { ...options, headers });
      },
    });
  }

  emitter?.emit('skill:chat:started', { skillName });

  try {
    const result = streamText({
      model: anthropicProvider(modelId),
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      maxOutputTokens: 4096,
    });

    let fullText = '';
    for await (const chunk of result.textStream) {
      fullText += chunk;
      emitter?.emit('skill:chat:token', { token: chunk });
    }

    emitter?.emit('skill:chat:completed', { response: fullText });
    return { success: true, data: { response: fullText } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: 'LLM_ERROR',
        message: `Chat LLM call failed: ${msg}`,
        severity: 'fatal',
        recoverable: true,
      },
    };
  }
}
