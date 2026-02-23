import { Match, Show, Switch } from 'solid-js';
import { VaultTypePicker } from '../VaultTypePicker/VaultTypePicker';
import { VaultRegistrationForm } from '../VaultRegistrationForm/VaultRegistrationForm';
import { VaultRegistrationResult } from '../VaultRegistrationResult/VaultRegistrationResult';
import { useVaultRegistrationDialog } from './VaultRegistrationDialog.hook';

export const VaultRegistrationDialog = () => {
  const { step, vaultType, progressMessage, result, error, close, handleTypeSelect, handleBack, handleSubmit } = useVaultRegistrationDialog();

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" onClick={close} />

      <div class="relative w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl">
        <div class="p-4 border-b border-[var(--color-border)]">
          <h3 class="text-lg font-semibold">Register Vault</h3>
        </div>

        <div class="p-4">
          <Switch>
            <Match when={step() === 'pick-type'}>
              <VaultTypePicker onSelect={handleTypeSelect} onCancel={close} />
            </Match>

            <Match when={step() === 'form'}>
              <VaultRegistrationForm
                vaultType={vaultType()}
                onSubmit={handleSubmit}
                onBack={handleBack}
                onCancel={close}
                error={error()}
              />
            </Match>

            <Match when={step() === 'progress'}>
              <div class="py-8 text-center space-y-4">
                <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                <p class="text-sm text-[var(--color-text-muted)]">{progressMessage()}</p>
              </div>
            </Match>

            <Match when={step() === 'result'}>
              <Show when={result()}>
                {(r) => <VaultRegistrationResult result={r()} onClose={close} />}
              </Show>
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
};
