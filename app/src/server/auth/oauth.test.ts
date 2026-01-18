import { describe, it, expect } from 'vitest';
import { startOAuthFlow } from './oauth.js';

describe('OAuth Flow', () => {
  it('should generate valid authorization URL for console mode', () => {
    const { url, session } = startOAuthFlow('console');

    expect(url).toContain('https://console.anthropic.com/oauth/authorize');
    expect(url).toContain('code=true');
    expect(url).toContain('client_id=9d1c250a-e61b-44d9-88ed-5944d1962f5e');
    expect(url).toContain('response_type=code');
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('scope=org%3Acreate_api_key');
    expect(url).toContain('code_challenge=');
    expect(url).toContain('code_challenge_method=S256');
    expect(url).toContain('state=');

    expect(session.pkce.verifier).toBeDefined();
    expect(session.pkce.challenge).toBeDefined();
    expect(session.state).toBeDefined();
  });

  it('should generate valid authorization URL for max mode', () => {
    const { url, session } = startOAuthFlow('max');

    expect(url).toContain('https://claude.ai/oauth/authorize');
    expect(url).toContain('code=true');
    expect(session.pkce.verifier).toBeDefined();
    expect(session.state).toBeDefined();
  });

  it('should default to console mode', () => {
    const { url } = startOAuthFlow();

    expect(url).toContain('https://console.anthropic.com/oauth/authorize');
  });

  it('should use correct scope encoding', () => {
    const { url } = startOAuthFlow();

    // Verify scope is properly encoded
    expect(url).toContain('scope=org%3Acreate_api_key+user%3Aprofile+user%3Ainference');

    // Should NOT contain unencoded colons
    const scopeMatch = url.match(/scope=([^&]+)/);
    expect(scopeMatch).toBeDefined();
    const scope = scopeMatch![1];
    expect(scope).not.toContain('org:create_api_key'); // Unencoded
  });

  it('should use correct redirect URI', () => {
    const { url } = startOAuthFlow();

    expect(url).toContain('redirect_uri=https%3A%2F%2Fconsole.anthropic.com%2Foauth%2Fcode%2Fcallback');
  });

  it('should include PKCE challenge in URL', () => {
    const { url, session } = startOAuthFlow();

    expect(url).toContain(`code_challenge=${session.pkce.challenge}`);
    expect(url).toContain('code_challenge_method=S256');
  });

  it('should include state parameter in URL', () => {
    const { url, session } = startOAuthFlow();

    expect(url).toContain(`state=${session.state}`);
  });

  it('should generate different URLs on each call', () => {
    const flow1 = startOAuthFlow();
    const flow2 = startOAuthFlow();

    expect(flow1.url).not.toBe(flow2.url);
    expect(flow1.session.state).not.toBe(flow2.session.state);
  });
});
