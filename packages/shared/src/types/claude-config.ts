export interface ClaudeSkill {
  name: string;
  description: string;
  globs?: string[];
  alwaysApply: boolean;
  path: string;
  content?: string;
  parseError?: boolean;
}

export type ClaudeRuleType = 'root' | 'project' | 'modular';

export interface ClaudeRule {
  name: string;
  relativePath: string;
  type: ClaudeRuleType;
  globs?: string[];
  content?: string;
  parseError?: boolean;
}

export type ClaudeHookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'Notification'
  | 'Stop'
  | 'SubagentStop';

export interface ClaudeHookEntry {
  type: 'command';
  command: string;
  timeout?: number;
  matcher?: string;
}

export type ClaudeHookConfig = Partial<
  Record<ClaudeHookEvent, ClaudeHookEntry[]>
>;

export interface ClaudeMcpServer {
  name: string;
  type: 'http' | 'stdio' | 'sse';
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface ClaudeMdFile {
  relativePath: string;
  dir: string;
}
