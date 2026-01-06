import { describe, it, expect } from 'vitest';
import { generatePKCE, generateState } from './pkce.js';
import { createHash } from 'crypto';

describe('PKCE Generation', () => {
  it('should generate valid verifier and challenge', () => {
    const { verifier, challenge } = generatePKCE();

    expect(verifier).toBeDefined();
    expect(challenge).toBeDefined();
    expect(verifier.length).toBeGreaterThan(0);
    expect(challenge.length).toBeGreaterThan(0);
  });

  it('should generate base64url encoded values (no padding)', () => {
    const { verifier, challenge } = generatePKCE();

    // Base64url should not contain +, /, or =
    expect(verifier).not.toContain('+');
    expect(verifier).not.toContain('/');
    expect(verifier).not.toContain('=');

    expect(challenge).not.toContain('+');
    expect(challenge).not.toContain('/');
    expect(challenge).not.toContain('=');
  });

  it('should generate challenge as SHA256 hash of verifier', () => {
    const { verifier, challenge } = generatePKCE();

    // Verify challenge is SHA256(verifier)
    const expectedChallenge = createHash('sha256').update(verifier).digest('base64url');

    expect(challenge).toBe(expectedChallenge);
  });

  it('should generate unique values on each call', () => {
    const pair1 = generatePKCE();
    const pair2 = generatePKCE();

    expect(pair1.verifier).not.toBe(pair2.verifier);
    expect(pair1.challenge).not.toBe(pair2.challenge);
  });
});

describe('State Generation', () => {
  it('should generate 64-byte state parameter', () => {
    const state = generateState();

    expect(state).toBeDefined();
    expect(state.length).toBeGreaterThan(0);

    // 64 bytes base64url encoded should be ~86 characters
    // (64 bytes * 8 bits / 6 bits per base64 char = 85.33 chars)
    expect(state.length).toBeGreaterThanOrEqual(85);
  });

  it('should generate base64url encoded state (no padding)', () => {
    const state = generateState();

    expect(state).not.toContain('+');
    expect(state).not.toContain('/');
    expect(state).not.toContain('=');
  });

  it('should generate unique state on each call', () => {
    const state1 = generateState();
    const state2 = generateState();

    expect(state1).not.toBe(state2);
  });
});
