import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ClaudeSkill, FlowEmitter } from '@nori/shared';

// Mock llm-client before importing the module under test
vi.mock('../../shared/utils/llm-client.js', () => ({
  resolveAuth: vi.fn(),
  noAuthError: vi.fn(() => ({
    success: false,
    error: {
      code: 'NO_AUTH',
      message: 'No Anthropic credentials found.',
      severity: 'fatal',
      recoverable: false,
    },
  })),
}));

// Mock Vercel AI SDK streamText
vi.mock('ai', () => ({
  streamText: vi.fn(),
}));

// Mock @ai-sdk/anthropic
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => (model: string) => ({ model })),
}));

import { runSkillChat } from './project-skill-chat.js';
import { resolveAuth } from '../../shared/utils/llm-client.js';
import { streamText } from 'ai';

const mockResolveAuth = vi.mocked(resolveAuth);
const mockStreamText = vi.mocked(streamText);

function makeAsyncIterable(chunks: string[]): AsyncIterable<string> {
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next() {
          if (i < chunks.length) {
            return { value: chunks[i++], done: false };
          }
          return { value: undefined as unknown as string, done: true };
        },
      };
    },
  };
}

const sampleSkills: ClaudeSkill[] = [
  { name: 'skill-a', description: 'Skill A description', alwaysApply: false, path: '.claude/skills/skill-a/SKILL.md' },
  { name: 'skill-b', description: 'Skill B description', alwaysApply: true, path: '.claude/skills/skill-b/SKILL.md' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockResolveAuth.mockReturnValue({ type: 'api_key', key: 'test-key' });
  mockStreamText.mockReturnValue({
    textStream: makeAsyncIterable(['Hello', ' world']),
  } as unknown as ReturnType<typeof streamText>);
});

describe('runSkillChat', () => {
  it('returns FlowError when no auth is configured', async () => {
    mockResolveAuth.mockReturnValue({ type: 'none' });

    const result = await runSkillChat({
      projectPath: '/some/path',
      skillName: 'skill-a',
      messages: [{ role: 'user', content: 'Improve this skill' }],
      allSkills: sampleSkills,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NO_AUTH');
    }
    expect(mockStreamText).not.toHaveBeenCalled();
  });

  it('passes all skill names in the system prompt', async () => {
    await runSkillChat({
      projectPath: '/some/path',
      skillName: 'skill-a',
      messages: [{ role: 'user', content: 'How can I improve this skill?' }],
      allSkills: sampleSkills,
    });

    expect(mockStreamText).toHaveBeenCalledOnce();
    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.system).toContain('skill-a');
    expect(callArgs.system).toContain('skill-b');
  });

  it('emits skill:chat:token for each streamed chunk', async () => {
    const chunks = ['Token1', ' Token2', ' Token3'];
    mockStreamText.mockReturnValue({
      textStream: makeAsyncIterable(chunks),
    } as unknown as ReturnType<typeof streamText>);

    const emittedEvents: Array<{ event: string; data: Record<string, unknown> }> = [];
    const emitter: FlowEmitter = {
      emit: (event, data) => { emittedEvents.push({ event, data: data ?? {} }); },
    };

    await runSkillChat({
      projectPath: '/some/path',
      skillName: 'skill-a',
      messages: [{ role: 'user', content: 'Test' }],
      allSkills: sampleSkills,
    }, emitter);

    const tokenEvents = emittedEvents.filter((e) => e.event === 'skill:chat:token');
    expect(tokenEvents).toHaveLength(3);
    expect(tokenEvents[0].data).toEqual({ token: 'Token1' });
    expect(tokenEvents[1].data).toEqual({ token: ' Token2' });
    expect(tokenEvents[2].data).toEqual({ token: ' Token3' });
  });

  it('emits skill:chat:completed with full response at end', async () => {
    mockStreamText.mockReturnValue({
      textStream: makeAsyncIterable(['Hello', ' world']),
    } as unknown as ReturnType<typeof streamText>);

    const emittedEvents: Array<{ event: string; data: Record<string, unknown> }> = [];
    const emitter: FlowEmitter = {
      emit: (event, data) => { emittedEvents.push({ event, data: data ?? {} }); },
    };

    const result = await runSkillChat({
      projectPath: '/some/path',
      skillName: 'skill-a',
      messages: [{ role: 'user', content: 'Test' }],
      allSkills: sampleSkills,
    }, emitter);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.response).toBe('Hello world');
    }

    const completedEvent = emittedEvents.find((e) => e.event === 'skill:chat:completed');
    expect(completedEvent).toBeDefined();
    expect(completedEvent?.data).toEqual({ response: 'Hello world' });
  });

  it('returns FlowError with LLM_ERROR when streamText throws', async () => {
    mockStreamText.mockReturnValue({
      textStream: {
        [Symbol.asyncIterator]() {
          return {
            async next(): Promise<IteratorResult<string, undefined>> {
              throw new Error('API rate limit exceeded');
            },
          };
        },
      },
    } as unknown as ReturnType<typeof streamText>);

    const result = await runSkillChat({
      projectPath: '/some/path',
      skillName: 'skill-a',
      messages: [{ role: 'user', content: 'Test' }],
      allSkills: sampleSkills,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('LLM_ERROR');
      expect(result.error.message).toContain('API rate limit exceeded');
    }
  });

  it('passes conversation messages to streamText', async () => {
    const messages = [
      { role: 'user' as const, content: 'First message' },
      { role: 'assistant' as const, content: 'First response' },
      { role: 'user' as const, content: 'Second message' },
    ];

    await runSkillChat({
      projectPath: '/some/path',
      skillName: 'skill-a',
      messages,
      allSkills: sampleSkills,
    });

    const callArgs = mockStreamText.mock.calls[0][0];
    const msgs = callArgs.messages ?? [];
    expect(msgs).toHaveLength(3);
    expect(msgs[0]).toEqual({ role: 'user', content: 'First message' });
    expect(msgs[2]).toEqual({ role: 'user', content: 'Second message' });
  });
});
