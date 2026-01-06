import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'fs';
import { TokenResponse } from './oauth.js';

export interface AuthData {
  provider: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  created_at: number;
}

/**
 * Get auth file path (~/.nori/auth.json)
 */
function getAuthFilePath(): string {
  const homeDir = homedir();
  const noriDir = join(homeDir, '.nori');

  // Ensure .nori directory exists
  if (!existsSync(noriDir)) {
    mkdirSync(noriDir, { recursive: true, mode: 0o755 });
  }

  return join(noriDir, 'auth.json');
}

/**
 * Save OAuth tokens to auth.json
 * CRITICAL: File must have mode 0o600 (read/write for owner only)
 */
export function saveAuthTokens(tokens: TokenResponse): void {
  const authData: AuthData = {
    provider: 'anthropic',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
    created_at: Date.now(),
  };

  const authPath = getAuthFilePath();

  // Write auth file
  writeFileSync(authPath, JSON.stringify(authData, null, 2), { encoding: 'utf-8', mode: 0o600 });

  // Ensure correct permissions (some filesystems ignore mode in writeFile)
  try {
    chmodSync(authPath, 0o600);
  } catch (err) {
    console.warn('[Auth] Failed to set auth.json permissions:', err);
  }
}

/**
 * Load OAuth tokens from auth.json
 */
export function loadAuthTokens(): AuthData | null {
  const authPath = getAuthFilePath();

  if (!existsSync(authPath)) {
    return null;
  }

  try {
    const content = readFileSync(authPath, 'utf-8');
    const data = JSON.parse(content) as AuthData;
    return data;
  } catch (err) {
    console.error('[Auth] Failed to read auth.json:', err);
    return null;
  }
}

/**
 * Check if auth tokens are expired
 */
export function isTokenExpired(auth: AuthData): boolean {
  return Date.now() >= auth.expires_at;
}

/**
 * Delete auth tokens
 */
export function deleteAuthTokens(): void {
  const authPath = getAuthFilePath();

  if (existsSync(authPath)) {
    try {
      writeFileSync(authPath, '', { mode: 0o600 });
    } catch (err) {
      console.error('[Auth] Failed to delete auth.json:', err);
    }
  }
}
