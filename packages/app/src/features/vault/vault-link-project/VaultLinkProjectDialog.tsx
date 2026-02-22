import { createSignal, Match, Switch } from 'solid-js';
import type { Vault, VaultLinkProjectResponse } from '@nori/shared';
import { vaults } from '../../../stores/vault.store';
import { apiPost } from '../../../lib/api';
import { VaultPicker } from './VaultPicker';
import { ProjectPicker } from './ProjectPicker';
import { LinkConfirmation } from './LinkConfirmation';

type WizardStep = 'vault-picker' | 'project-picker' | 'progress' | 'confirmation';

interface Props {
  onClose: () => void;
}

export function VaultLinkProjectDialog(props: Props) {
  const [step, setStep] = createSignal<WizardStep>('vault-picker');
  const [selectedVault, setSelectedVault] = createSignal<Vault | null>(null);
  const [result, setResult] = createSignal<VaultLinkProjectResponse | null>(null);
  const [error, setError] = createSignal('');

  function handleVaultSelect(vaultId: string) {
    const vault = vaults().find((v) => v.id === vaultId);
    if (vault) {
      setSelectedVault(vault);
      setStep('project-picker');
    }
  }

  async function handleProjectSelect(projectPath: string) {
    const vault = selectedVault();
    if (!vault) return;

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
  }

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" onClick={props.onClose} />

      <div class="relative w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl">
        <div class="p-4 border-b border-[var(--color-border)]">
          <h3 class="text-lg font-semibold">Link Vault to Project</h3>
        </div>

        <div class="p-4">
          <Switch>
            <Match when={step() === 'vault-picker'}>
              <VaultPicker
                vaults={vaults()}
                onSelect={handleVaultSelect}
                onCancel={props.onClose}
              />
            </Match>

            <Match when={step() === 'project-picker'}>
              <ProjectPicker
                vaultName={selectedVault()?.name ?? ''}
                onSelect={handleProjectSelect}
                onBack={() => setStep('vault-picker')}
              />
              {error() && (
                <div class="mt-3 p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
                  <p class="text-sm text-[var(--color-error)]">{error()}</p>
                </div>
              )}
            </Match>

            <Match when={step() === 'progress'}>
              <div class="py-8 text-center space-y-4">
                <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                <p class="text-sm text-[var(--color-text-muted)]">Linking vault to project...</p>
              </div>
            </Match>

            <Match when={step() === 'confirmation'}>
              <LinkConfirmation
                vaultName={result()?.vault_name ?? ''}
                projectPath={result()?.link.project_path ?? ''}
                onDismiss={props.onClose}
              />
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
}
