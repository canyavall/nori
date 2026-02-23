import { z } from 'zod';
import type {
  ClaudeSkill,
  ClaudeRule,
  ClaudeHookConfig,
  ClaudeMcpServer,
  ClaudeMdFile,
} from '../types/claude-config.js';

// --- Skills ---

export interface ClaudeSkillListResponse {
  data: ClaudeSkill[];
}

export interface ClaudeSkillReadResponse {
  data: { name: string; content: string; path: string };
}

export interface ClaudeSkillWriteResponse {
  data: ClaudeSkill;
}

// --- Rules ---

export interface ClaudeRuleListResponse {
  data: ClaudeRule[];
}

export interface ClaudeRuleReadResponse {
  data: { relativePath: string; content: string; type: string };
}

export interface ClaudeRuleWriteResponse {
  data: ClaudeRule;
}

// --- Hooks ---

export interface ClaudeHooksResponse {
  data: {
    shared: ClaudeHookConfig | null;
    local: ClaudeHookConfig | null;
    sharedRaw: string;
    localRaw: string;
  };
}

export interface ClaudeHooksWriteResponse {
  data: { hooks: ClaudeHookConfig };
}

// --- MCPs ---

export interface ClaudeMcpListResponse {
  data: { servers: ClaudeMcpServer[]; raw: string };
}

export interface ClaudeMcpWriteResponse {
  data: { servers: ClaudeMcpServer[] };
}

// --- CLAUDE.md files ---

export interface ClaudeMdListResponse {
  data: ClaudeMdFile[];
}

// --- API route constants ---

export const CLAUDE_SKILLS_LIST_API = {
  method: 'GET' as const,
  path: '/api/project/claude/skills',
} as const;

export const CLAUDE_SKILLS_READ_API = {
  method: 'GET' as const,
  path: '/api/project/claude/skills/:name',
} as const;

export const CLAUDE_SKILLS_WRITE_API = {
  method: 'PUT' as const,
  path: '/api/project/claude/skills/:name',
} as const;

export const CLAUDE_RULES_LIST_API = {
  method: 'GET' as const,
  path: '/api/project/claude/rules',
} as const;

// Note: :relativePath is a multi-segment parameter (can contain forward slashes)
export const CLAUDE_RULES_READ_API = {
  method: 'GET' as const,
  path: '/api/project/claude/rules/:relativePath',
} as const;

// Note: :relativePath is a multi-segment parameter (can contain forward slashes)
export const CLAUDE_RULES_WRITE_API = {
  method: 'PUT' as const,
  path: '/api/project/claude/rules/:relativePath',
} as const;

export const CLAUDE_HOOKS_READ_API = {
  method: 'GET' as const,
  path: '/api/project/claude/hooks',
} as const;

export const CLAUDE_HOOKS_WRITE_API = {
  method: 'PUT' as const,
  path: '/api/project/claude/hooks',
} as const;

export const CLAUDE_MCPS_READ_API = {
  method: 'GET' as const,
  path: '/api/project/claude/mcps',
} as const;

export const CLAUDE_MCPS_WRITE_API = {
  method: 'PUT' as const,
  path: '/api/project/claude/mcps',
} as const;

export const CLAUDE_MDS_LIST_API = {
  method: 'GET' as const,
  path: '/api/project/claude/claude-mds',
} as const;

// --- Skill Chat ---

export const skillChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const skillChatSchema = z.object({
  messages: z.array(skillChatMessageSchema),
  allSkills: z.array(z.any()),
});

export type SkillChatMessage = z.infer<typeof skillChatMessageSchema>;

export interface SkillChatSSEEvents {
  'skill:chat:started': { skillName: string };
  'skill:chat:token': { token: string };
  'skill:chat:completed': { response: string };
}

export const SKILL_CHAT_API = {
  method: 'POST' as const,
  path: '/api/project/claude/skills/:name/chat',
} as const;
