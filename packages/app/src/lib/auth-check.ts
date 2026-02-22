import { APP_AUTHENTICATION_CHECK_API } from '@nori/shared';
import { connectSSE } from './sse';
import { setAuthStatus } from '../stores/navigation.store';
import type { AuthenticationCheckResponse } from '@nori/shared';

export function runAuthCheck(): AbortController {
  return connectSSE(
    APP_AUTHENTICATION_CHECK_API.path,
    {},
    {
      onEvent: () => {},
      onResult: (data) => {
        const res = data as AuthenticationCheckResponse;
        setAuthStatus(res.has_anthropic_access ? 'authenticated' : 'unauthenticated');
      },
      onError: () => {
        setAuthStatus('unauthenticated');
      },
    }
  );
}
