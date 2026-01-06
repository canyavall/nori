import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveAuthTokens, loadAuthTokens, isTokenExpired, deleteAuthTokens, AuthData } from './storage.js';
import { existsSync, unlinkSync, statSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { TokenResponse } from './oauth.js';

const authPath = join(homedir(), '.nori', 'auth.json');

describe('Auth Storage', () => {
  beforeEach(() => {
    // Clean up before each test
    if (existsSync(authPath)) {
      unlinkSync(authPath);
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (existsSync(authPath)) {
      unlinkSync(authPath);
    }
  });

  it('should save auth tokens to file', () => {
    const tokens: TokenResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
    };

    saveAuthTokens(tokens);

    expect(existsSync(authPath)).toBe(true);
  });

  it('should set correct file permissions (0o600)', () => {
    const tokens: TokenResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
    };

    saveAuthTokens(tokens);

    const stats = statSync(authPath);
    const mode = stats.mode & 0o777;

    // On Windows, this might not work as expected
    // On Unix, should be 0o600 (owner read/write only)
    if (process.platform !== 'win32') {
      expect(mode).toBe(0o600);
    }
  });

  it('should load saved auth tokens', () => {
    const tokens: TokenResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
    };

    saveAuthTokens(tokens);
    const loaded = loadAuthTokens();

    expect(loaded).not.toBeNull();
    expect(loaded!.access_token).toBe('test-access-token');
    expect(loaded!.refresh_token).toBe('test-refresh-token');
    expect(loaded!.provider).toBe('anthropic');
  });

  it('should return null when no auth file exists', () => {
    const loaded = loadAuthTokens();
    expect(loaded).toBeNull();
  });

  it('should calculate correct expiry time', () => {
    const tokens: TokenResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600, // 1 hour
    };

    const beforeSave = Date.now();
    saveAuthTokens(tokens);
    const afterSave = Date.now();

    const loaded = loadAuthTokens();
    expect(loaded).not.toBeNull();

    // Expires_at should be approximately created_at + 3600 seconds
    expect(loaded!.expires_at).toBeGreaterThanOrEqual(beforeSave + 3600 * 1000);
    expect(loaded!.expires_at).toBeLessThanOrEqual(afterSave + 3600 * 1000);
  });

  it('should detect non-expired tokens', () => {
    const tokens: TokenResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600, // 1 hour from now
    };

    saveAuthTokens(tokens);
    const loaded = loadAuthTokens();

    expect(loaded).not.toBeNull();
    expect(isTokenExpired(loaded!)).toBe(false);
  });

  it('should detect expired tokens', () => {
    const expiredAuth: AuthData = {
      provider: 'anthropic',
      access_token: 'expired-token',
      refresh_token: 'refresh-token',
      expires_at: Date.now() - 1000, // Expired 1 second ago
      created_at: Date.now() - 7200 * 1000, // Created 2 hours ago
    };

    expect(isTokenExpired(expiredAuth)).toBe(true);
  });

  it('should delete auth tokens', () => {
    const tokens: TokenResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
    };

    saveAuthTokens(tokens);
    expect(existsSync(authPath)).toBe(true);

    deleteAuthTokens();

    // File should exist but be empty
    expect(existsSync(authPath)).toBe(true);
    const loaded = loadAuthTokens();
    expect(loaded).toBeNull(); // Empty file should return null
  });
});
