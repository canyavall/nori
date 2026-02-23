import { createSignal, Show, Match, Switch } from 'solid-js';
import type { VaultRegistrationResponse } from '@nori/shared';
import type { VaultRegistrationInput, VaultLocalRegistrationInput } from '@nori/shared';
import { setRegistrationOpen, addVault } from '../../../../stores/vault.store';
import { connectSSE } from '../../../../lib/sse';
import { VaultTypePicker } from '../VaultTypePicker/VaultTypePicker';
import { VaultRegistrationForm } from '../VaultRegistrationForm/VaultRegistrationForm';
import { VaultRegistrationResult } from '../VaultRegistrationResult/VaultRegistrationResult';

type VaultType = 'git' | 'local';
type WizardStep = 'pick-type' | 'form' | 'progress' | 'result';
type FormPayload = VaultRegistrationInput | VaultLocalRegistrationInput;

const GIT_PROGRESS_MESSAGES: Record<string, string> = {
  'vault:registration:started': 'Starting registration...',
  'vault:registration:validating-url': 'Validating URL...',
  'vault:registration:testing-access': 'Testing repository access...',
  'vault:registration:cloning': 'Cloning repository...',
  'vault:registration:writing-config': 'Saving configuration...',
  'vault:registration:building-index': 'Building knowledge index...',
  'vault:registration:completed': 'Registration complete!',
};

const LOCAL_PROGRESS_MESSAGES: Record<string, string> = {
  'vault:local-registration:started': 'Starting registration...',
  'vault:local-registration:creating-directory': 'Creating vault directory...',
  'vault:local-registration:writing-config': 'Saving configuration...',
  'vault:local-registration:building-index': 'Building knowledge index...',
  'vault:local-registration:completed': 'Registration complete!',
};

export function VaultRegistrationDialog() {
  const [step, setStep] = createSignal<WizardStep>('pick-type');
  const [vaultType, setVaultType] = createSignal<VaultType>('git');
  const [progressMessage, setProgressMessage] = createSignal('');
  const [result, setResult] = createSignal<VaultRegistrationResponse | null>(null);
  const [error, setError] = createSignal('');

  function close() {
    setRegistrationOpen(false);
  }

  function handleTypeSelect(type: VaultType) {
    setVaultType(type);
    setStep('form');
    setError('');
  }

  function handleBack() {
    setStep('pick-type');
    setError('');
  }

  function handleSubmit(data: FormPayload) {
    setStep('progress');
    setProgressMessage('Starting registration...');
    setError('');

    const progressMessages = vaultType() === 'local' ? LOCAL_PROGRESS_MESSAGES : GIT_PROGRESS_MESSAGES;

    connectSSE('/api/vault', data, {
      onEvent: (event) => {
        setProgressMessage(progressMessages[event] ?? event);
      },
      onResult: (responseData) => {
        const flowResult = responseData as { success: boolean; data?: VaultRegistrationResponse; error?: { message: string } };
        if (flowResult.success && flowResult.data) {
          setResult(flowResult.data);
          addVault(flowResult.data.vault);
          setStep('result');
        } else {
          setError(flowResult.error?.message ?? 'Registration failed');
          setStep('form');
        }
      },
      onError: (errMsg) => {
        setError(errMsg);
        setStep('form');
      },
    });
  }

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div class="absolute inset-0 bg-black/50" onClick={close} />

      {/* Dialog */}
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
}
