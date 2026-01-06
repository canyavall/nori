import { getDatabase } from './index.js';
import { OAuthToken } from './types.js';

/**
 * Save OAuth token
 */
export function saveOAuthToken(
  provider: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: number
): void {
  const db = getDatabase();
  const now = Date.now();

  const existing = db.prepare('SELECT id FROM oauth_tokens WHERE provider = ?').get(provider) as
    | { id: number }
    | undefined;

  if (existing) {
    db.prepare(
      'UPDATE oauth_tokens SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = ? WHERE id = ?'
    ).run(accessToken, refreshToken, expiresAt, now, existing.id);
  } else {
    db.prepare(
      'INSERT INTO oauth_tokens (provider, access_token, refresh_token, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(provider, accessToken, refreshToken, expiresAt, now, now);
  }
}

/**
 * Load OAuth token
 */
export function loadOAuthToken(provider: string): OAuthToken | null {
  const db = getDatabase();
  const result = db.prepare('SELECT * FROM oauth_tokens WHERE provider = ?').get(provider) as OAuthToken | undefined;
  return result || null;
}

/**
 * Delete OAuth token
 */
export function deleteOAuthToken(provider: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM oauth_tokens WHERE provider = ?').run(provider);
}

/**
 * Save API key
 */
export function saveApiKey(provider: string, apiKey: string): void {
  const db = getDatabase();
  const now = Date.now();

  const existing = db.prepare('SELECT id FROM api_keys WHERE provider = ?').get(provider) as { id: number } | undefined;

  if (existing) {
    db.prepare('UPDATE api_keys SET api_key = ?, updated_at = ? WHERE id = ?').run(apiKey, now, existing.id);
  } else {
    db.prepare('INSERT INTO api_keys (provider, api_key, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
      provider,
      apiKey,
      now,
      now
    );
  }
}

/**
 * Load API key
 */
export function loadApiKey(provider: string): string | null {
  const db = getDatabase();
  const result = db.prepare('SELECT api_key FROM api_keys WHERE provider = ?').get(provider) as
    | { api_key: string }
    | undefined;
  return result?.api_key || null;
}

/**
 * Delete API key
 */
export function deleteApiKey(provider: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM api_keys WHERE provider = ?').run(provider);
}
