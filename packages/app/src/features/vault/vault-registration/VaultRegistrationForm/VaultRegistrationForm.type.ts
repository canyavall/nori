import type { VaultRegistrationInput, VaultLocalRegistrationInput } from '@nori/shared';

export type VaultType = 'git' | 'local';
export type FormPayload = VaultRegistrationInput | VaultLocalRegistrationInput;

export interface VaultRegistrationFormProps {
  vaultType: VaultType;
  onSubmit: (data: FormPayload) => void;
  onBack: () => void;
  onCancel: () => void;
  error?: string;
}
