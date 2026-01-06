export interface HookInfo {
  name: string;
  path: string;
  event: string;
  enabled: boolean;
}

export interface HookResult {
  success: boolean;
  output: unknown | null;
  error: string | null;
  stdout: string;
  stderr: string;
}

export type LifecycleEvent =
  | 'UserPromptSubmit'
  | 'PreToolUse'
  | 'PostToolUse'
  | 'SessionStart'
  | 'SessionEnd';
