import type { SyncStatusProps } from './SyncStatus.type';

export const useSyncStatus = (props: Pick<SyncStatusProps, 'vault'>) => {
  const lastSynced = () => {
    if (!props.vault.last_synced_at) {
      return 'Never';
    }
    return new Date(props.vault.last_synced_at).toLocaleString();
  };

  return { lastSynced };
};
