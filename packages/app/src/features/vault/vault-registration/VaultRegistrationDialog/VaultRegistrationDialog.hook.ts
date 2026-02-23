import { createSignal } from 'solid-js';
import type { VaultRegistrationResponse, VaultRegistrationInput, VaultLocalRegistrationInput } from '@nori/shared';
import { setRegistrationOpen, addVault } from '../../../../stores/vault.store';
import { connectSSE } from '../../../../lib/sse';

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

export const useVaultRegistrationDialog = () => {
  const [step, setStep] = createSignal<WizardStep>('pick-type');
  const [vaultType, setVaultType] = createSignal<VaultType>('git');
  const [progressMessage, setProgressMessage] = createSignal('');
  const [result, setResult] = createSignal<VaultRegistrationResponse | null>(null);
  const [error, setError] = createSignal('');

  const close = () => {
    setRegistrationOpen(false);
  };

  const handleTypeSelect = (type: VaultType) => {
    setVaultType(type);
    setStep('form');
    setError('');
  };

  const handleBack = () => {
    setStep('pick-type');
    setError('');
  };

  const handleSubmit = (data: FormPayload) => {
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
  };

  return { step, vaultType, progressMessage, result, error, close, handleTypeSelect, handleBack, handleSubmit };
};
