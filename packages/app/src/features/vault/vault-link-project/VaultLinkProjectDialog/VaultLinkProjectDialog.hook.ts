import { createSignal } from 'solid-js';
import type { Vault, VaultLinkProjectResponse } from '@nori/shared';
import { vaults } from '../../../../stores/vault.store';
import { apiPost } from '../../../../lib/api';
import type { WizardStep, VaultLinkProjectDialogProps } from './VaultLinkProjectDialog.type';

export const useVaultLinkProjectDialog = (props: VaultLinkProjectDialogProps) => {
  const [step, setStep] = createSignal<WizardStep>('vault-picker');
  const [selectedVault, setSelectedVault] = createSignal<Vault | null>(null);
  const [result, setResult] = createSignal<VaultLinkProjectResponse | null>(null);
  const [error, setError] = createSignal('');

  const handleVaultSelect = (vaultId: string) => {
    const vault = vaults().find((v) => v.id === vaultId);
    if (vault) {
      setSelectedVault(vault);
      setStep('project-picker');
    }
  };

  const handleProjectSelect = async (projectPath: string) => {
    const vault = selectedVault();
    if (!vault) {
      return;
    }

    setStep('progress');
    try {
      const res = await apiPost<{ data: VaultLinkProjectResponse }>(
        `/api/vault/${vault.id}/link`,
        { project_path: projectPath }
      );
      setResult(res.data);
      setStep('confirmation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Link failed');
      setStep('project-picker');
    }
  };

  const handleBackToVaultPicker = () => {
    setStep('vault-picker');
  };

  return { step, selectedVault, result, error, vaults, handleVaultSelect, handleProjectSelect, handleBackToVaultPicker };
};
