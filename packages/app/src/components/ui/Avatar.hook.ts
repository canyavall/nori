import { onMount, onCleanup } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { authStatus } from '../../stores/navigation.store';
import { runAuthCheck } from '../../lib/auth-check';

export const useAvatar = () => {
  const navigate = useNavigate();
  let controller: AbortController | undefined;

  onMount(() => {
    controller = runAuthCheck();
  });

  onCleanup(() => {
    controller?.abort();
  });

  const dotClass = () => {
    const s = authStatus();
    if (s === 'authenticated') {
      return 'bg-green-500';
    }
    if (s === 'unauthenticated') {
      return 'bg-red-500';
    }
    return 'bg-gray-400 animate-pulse';
  };

  const handleNavigateToSettings = () => {
    navigate('/settings');
  };

  return { dotClass, handleNavigateToSettings };
};
