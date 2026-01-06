import { createHash, randomBytes } from 'crypto';

export interface PKCEPair {
  verifier: string;
  challenge: string;
}

/**
 * Generate PKCE code verifier and challenge
 * Matches OpenCode implementation exactly
 */
export function generatePKCE(): PKCEPair {
  // 32 random bytes for verifier
  const verifierBytes = randomBytes(32);
  const verifier = verifierBytes.toString('base64url'); // Node.js built-in base64url (no padding)

  // SHA256 hash for challenge
  const hash = createHash('sha256').update(verifier).digest();
  const challenge = hash.toString('base64url');

  return { verifier, challenge };
}

/**
 * Generate secure state parameter
 * CRITICAL: Must be 64 bytes (not 16)
 */
export function generateState(): string {
  const stateBytes = randomBytes(64);
  return stateBytes.toString('base64url');
}
