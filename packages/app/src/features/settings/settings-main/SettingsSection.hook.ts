import { createSignal, onMount, onCleanup } from 'solid-js';
import { setAuthStatus } from '../../../stores/navigation.store';
import { connectSSE } from '../../../lib/sse';
import { APP_AUTHENTICATION_CHECK_API } from '@nori/shared';
import type { AuthenticationCheckResponse } from '@nori/shared';
import type { AuthDetail } from './SettingsSection.type';

export const useSettingsSection = () => {
  const [checking, setChecking] = createSignal(true);
  const [detail, setDetail] = createSignal<AuthDetail | null>(null);
  let controller: AbortController | undefined;

  const isAuthCheckResponse = (d: unknown): d is AuthenticationCheckResponse =>
    typeof d === 'object' && d !== null && 'has_anthropic_access' in d;

  function runCheck() {
    controller?.abort();
    setChecking(true);
    setDetail(null);
    setAuthStatus('unknown');

    controller = connectSSE(
      APP_AUTHENTICATION_CHECK_API.path,
      {},
      {
        onEvent: () => {},
        onResult: (data) => {
          if (!isAuthCheckResponse(data)) return;
          setDetail({
            has_anthropic_access: data.has_anthropic_access,
            anthropic_access_type: data.anthropic_access_type,
            subscription_type: data.subscription_type,
            anthropic_email: data.anthropic_email,
            cli_installed: data.cli_installed,
            cli_version: data.cli_version,
            issues: data.issues ?? [],
            instructions: data.instructions ?? [],
          });
          setAuthStatus(data.has_anthropic_access ? 'authenticated' : 'unauthenticated');
          setChecking(false);
        },
        onError: () => {
          setAuthStatus('unauthenticated');
          setChecking(false);
        },
      }
    );
  }

  onMount(runCheck);
  onCleanup(() => controller?.abort());

  const subscriptionLabel = () => {
    const d = detail();
    if (!d) return '';
    if (d.anthropic_access_type === 'api_key') return 'API key';
    const type = d.subscription_type;
    if (!type) return 'Authenticated';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return { checking, detail, subscriptionLabel, runCheck };
}
