import type { Component } from 'solid-js';
import { useParams } from '@solidjs/router';
import { VaultDetailSection } from '../features/vault/vault-knowledge-tree/VaultDetailSection/VaultDetailSection';

export const VaultDetailPage: Component = () => {
  const params = useParams<{ id: string }>();
  return <VaultDetailSection vaultId={params.id} />;
};
