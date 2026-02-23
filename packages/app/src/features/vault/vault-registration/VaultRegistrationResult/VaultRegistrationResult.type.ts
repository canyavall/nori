import type { VaultRegistrationResponse } from '@nori/shared';

export interface VaultRegistrationResultProps {
  result: VaultRegistrationResponse;
  onClose: () => void;
}
