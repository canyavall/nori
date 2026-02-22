// ─── Response types ───────────────────────────────────────────────

export interface HealthCheckResponse {
  status: 'ok';
  version: string;
}

export interface IntegrityCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  checks: {
    database: boolean;
    vaults: boolean;
    index: boolean;
  };
}

export type AnthropicAccessType = 'cli_auth' | 'api_key' | 'none';

export interface AuthenticationCheckResponse {
  cli_installed: boolean;
  cli_version?: string;
  has_ssh_key: boolean;
  has_credential_helper: boolean;
  issues: string[];
  instructions: string[];
  // Anthropic access
  has_anthropic_access: boolean;
  anthropic_access_type: AnthropicAccessType;
  subscription_type?: string;
  anthropic_email?: string;
}

export interface AutoUpdateResponse {
  current_version: string;
  latest_version: string;
  update_needed: boolean;
}

// ─── SSE event interfaces ─────────────────────────────────────────

export interface IntegrityCheckEvents {
  'app:integrity-check:started': Record<string, unknown>;
  'app:integrity-check:validating-folders': Record<string, unknown>;
  'app:integrity-check:validating-files': Record<string, unknown>;
  'app:integrity-check:self-healing': { missing_dirs: number; missing_files: number };
  'app:integrity-check:completed': { folders_ok: number; files_ok: number; issues_fixed: number; issues_remaining: number };
}

export interface AuthenticationCheckEvents {
  'app:authentication-check:started': Record<string, unknown>;
  'app:authentication-check:checking-claude-code-access': Record<string, unknown>;
  'app:authentication-check:checking-git-credentials': Record<string, unknown>;
  'app:authentication-check:self-healing': { cli_installed: boolean; has_ssh_key: boolean; has_credential_helper: boolean };
  'app:authentication-check:checking-anthropic-access': Record<string, unknown>;
  'app:authentication-check:completed': { cli_installed: boolean; has_ssh_key: boolean; has_credential_helper: boolean; has_anthropic_access: boolean; issues_count: number };
}

export interface AutoUpdateEvents {
  'app:autoupdate:started': Record<string, unknown>;
  'app:autoupdate:checking-current-version': Record<string, unknown>;
  'app:autoupdate:fetching-latest-version': Record<string, unknown>;
  'app:autoupdate:skipped': { reason: string };
  'app:autoupdate:comparing-versions': { current_version: string; latest_version: string };
  'app:autoupdate:up-to-date': { current_version: string };
  'app:autoupdate:applying-update': { new_version: string };
  'app:autoupdate:completed': { current_version: string; new_version: string; applied: boolean };
}

// ─── API route constants ──────────────────────────────────────────

export const HEALTH_CHECK_API = {
  method: 'GET' as const,
  path: '/api/health',
} as const;

export const APP_INTEGRITY_CHECK_API = {
  method: 'POST' as const,
  path: '/api/app/integrity-check',
} as const;

export const APP_AUTHENTICATION_CHECK_API = {
  method: 'POST' as const,
  path: '/api/app/authentication-check',
} as const;

export const APP_AUTOUPDATE_API = {
  method: 'POST' as const,
  path: '/api/app/autoupdate',
} as const;

export const APP_INFO_API = {
  method: 'GET' as const,
  path: '/api/app/info',
} as const;

export interface AppInfoResponse {
  data_dir: string;   // e.g. /Users/alice/.nori  (Mac) or C:\Users\alice\.nori (Windows)
  vaults_dir: string; // e.g. /Users/alice/.nori/vaults
}
