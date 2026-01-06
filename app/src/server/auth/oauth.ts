import { generatePKCE, generateState, PKCEPair } from './pkce.js';

const CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e'; // OpenCode's public client ID
const REDIRECT_URI = 'https://console.anthropic.com/oauth/code/callback';
const SCOPE = 'org%3Acreate_api_key+user%3Aprofile+user%3Ainference';

export interface OAuthSession {
  pkce: PKCEPair;
  state: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Start OAuth flow - generate authorization URL
 */
export function startOAuthFlow(): { url: string; session: OAuthSession } {
  const pkce = generatePKCE();
  const state = generateState();

  const url = `https://claude.ai/oauth/authorize?code=true&client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${SCOPE}&code_challenge=${pkce.challenge}&code_challenge_method=S256&state=${state}`;

  return {
    url,
    session: { pkce, state },
  };
}

/**
 * Complete OAuth flow - exchange authorization code for tokens
 * CRITICAL: Authorization code format is "code#state" - must split before sending
 */
export async function completeOAuthFlow(authorizationCode: string, session: OAuthSession): Promise<TokenResponse> {
  // Split authorization code on # (Anthropic's non-standard format)
  const parts = authorizationCode.trim().split('#');
  const codePart = parts[0] || '';
  const statePart = parts[1] || '';

  if (!codePart || !statePart) {
    throw new Error('Invalid authorization code format. Expected format: code#state');
  }

  // Token exchange request (CRITICAL: Use JSON, not form-urlencoded)
  const requestBody = {
    code: codePart,
    state: statePart,
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_verifier: session.pkce.verifier,
  };

  const response = await fetch('https://console.anthropic.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
  }

  const tokens = (await response.json()) as TokenResponse;
  return tokens;
}
