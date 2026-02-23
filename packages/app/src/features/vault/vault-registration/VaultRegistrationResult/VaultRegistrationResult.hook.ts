import type { VaultRegistrationResultProps } from './VaultRegistrationResult.type';

export const useVaultRegistrationResult = (props: Pick<VaultRegistrationResultProps, 'result'>) => {
  const isLocal = () => props.result.vault.vault_type === 'local';

  return { isLocal };
};
