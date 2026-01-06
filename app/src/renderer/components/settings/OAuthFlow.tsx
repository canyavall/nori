import { useState } from 'react';
import { invokeCommand } from '../../lib/api';

interface OAuthFlowProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function OAuthFlow({ onSuccess, onError }: OAuthFlowProps) {
  const [authUrl, setAuthUrl] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'max' | 'console'>('console');

  const startOAuthFlow = async () => {
    setLoading(true);
    try {
      const response = await invokeCommand<{ url: string; sessionId: string }>('/auth/start', {
        method: 'POST',
        body: JSON.stringify({ mode }),
      });
      setAuthUrl(response.url);
      setSessionId(response.sessionId);
      // Open URL in default browser
      window.open(response.url, '_blank');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      onError?.(errorMsg);
      console.error('Failed to start OAuth flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOAuthFlow = async () => {
    if (!code.trim()) {
      onError?.('Please paste the authorization code');
      return;
    }

    setLoading(true);
    try {
      const response = await invokeCommand<{ success: boolean; message: string }>('/auth/complete', {
        method: 'POST',
        body: JSON.stringify({
          code: code.trim(),
          sessionId,
        }),
      });
      onSuccess?.(response.message);
      setAuthUrl('');
      setSessionId('');
      setCode('');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      onError?.(errorMsg);
      console.error('Failed to complete OAuth flow:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="oauth-flow">
      <div className="oauth-mode-selector">
        <label>
          <input
            type="radio"
            value="console"
            checked={mode === 'console'}
            onChange={(e) => setMode(e.target.value as 'console' | 'max')}
            disabled={!!authUrl}
          />
          Create API Key (Console)
        </label>
        <label>
          <input
            type="radio"
            value="max"
            checked={mode === 'max'}
            onChange={(e) => setMode(e.target.value as 'console' | 'max')}
            disabled={!!authUrl}
          />
          Claude Pro/Max (OAuth)
        </label>
      </div>

      {!authUrl ? (
        <button onClick={startOAuthFlow} disabled={loading}>
          {loading ? 'Starting...' : 'Start OAuth Flow'}
        </button>
      ) : (
        <div className="oauth-steps">
          <div className="step">
            <h4>Step 1: Authorize</h4>
            <p>A browser window should have opened. If not, click the link below:</p>
            <a href={authUrl} target="_blank" rel="noopener noreferrer">
              Open Authorization URL
            </a>
          </div>

          <div className="step">
            <h4>Step 2: Paste Code</h4>
            <p>After authorizing, you'll receive a code. Paste it here:</p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste authorization code here"
              disabled={loading}
            />
          </div>

          <div className="actions">
            <button onClick={completeOAuthFlow} disabled={loading || !code.trim()}>
              {loading ? 'Completing...' : 'Complete OAuth'}
            </button>
            <button
              onClick={() => {
                setAuthUrl('');
                setCode('');
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .oauth-flow {
          padding: 1rem;
          border: 1px solid #333;
          border-radius: 8px;
          background: #1a1a1a;
        }

        .oauth-mode-selector {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .oauth-mode-selector label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .oauth-steps {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .step {
          padding: 1rem;
          border: 1px solid #444;
          border-radius: 4px;
          background: #222;
        }

        .step h4 {
          margin: 0 0 0.5rem 0;
          color: #fff;
        }

        .step p {
          margin: 0 0 0.5rem 0;
          color: #aaa;
          font-size: 0.9rem;
        }

        .step a {
          color: #4a9eff;
          text-decoration: none;
          word-break: break-all;
        }

        .step a:hover {
          text-decoration: underline;
        }

        .step input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #444;
          border-radius: 4px;
          background: #1a1a1a;
          color: #fff;
          font-family: monospace;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
        }

        button {
          padding: 0.5rem 1rem;
          border: 1px solid #444;
          border-radius: 4px;
          background: #333;
          color: #fff;
          cursor: pointer;
          transition: background 0.2s;
        }

        button:hover:not(:disabled) {
          background: #444;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
