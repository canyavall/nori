import { Match, Show, Switch } from 'solid-js';
import type { VaultSettingsDialogProps } from './VaultSettingsDialog.type';
import { useVaultSettingsDialog } from './VaultSettingsDialog.hook';
import { VaultSettingsView } from './VaultSettingsView';
import { EnterVaultNameStep } from './EnterVaultNameStep';
import { ConfirmDeleteStep } from './ConfirmDeleteStep';

export const VaultSettingsDialog = (props: VaultSettingsDialogProps) => {
  const {
    step,
    progressMessage,
    error,
    handleDeleteClick,
    handleNameConfirmed,
    handleConfirm,
    handleCancel,
    handleClose,
  } = useVaultSettingsDialog(props);

  const stepTitle = () => {
    switch (step()) {
      case 'enter-name': return 'Confirm vault name';
      case 'confirm': return 'Confirm deletion';
      case 'progress': return 'Deleting vault...';
      default: return 'Vault Settings';
    }
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div class="relative w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl">
        <div class="p-4 border-b border-[var(--color-border)]">
          <h3 class="text-lg font-semibold">{stepTitle()}</h3>
          <p class="text-sm text-[var(--color-text-muted)] mt-0.5">{props.vault.name}</p>
        </div>

        <div class="p-4">
          <Show when={error()}>
            <div class="mb-4 p-3 rounded-md bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
              <p class="text-sm text-[var(--color-error)]">{error()}</p>
            </div>
          </Show>

          <Switch>
            <Match when={step() === 'settings'}>
              <VaultSettingsView
                vault={props.vault}
                onDeleteClick={handleDeleteClick}
                onClose={handleClose}
              />
            </Match>

            <Match when={step() === 'enter-name'}>
              <EnterVaultNameStep
                vaultName={props.vault.name}
                onConfirm={handleNameConfirmed}
                onCancel={handleCancel}
              />
            </Match>

            <Match when={step() === 'confirm'}>
              <ConfirmDeleteStep
                vaultName={props.vault.name}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
              />
            </Match>

            <Match when={step() === 'progress'}>
              <div class="py-8 text-center space-y-4">
                <div class="inline-block w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                <p class="text-sm text-[var(--color-text-muted)]">{progressMessage()}</p>
              </div>
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
};
