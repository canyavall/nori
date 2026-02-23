import type { Accessor } from 'solid-js';
import type { Vault } from '@nori/shared';
import type { SyncStep } from '../../VaultListSection.hook';

export interface VaultRowProps {
  vault: Vault;
  activeVault: Accessor<Vault | null>;
  syncVaultId: Accessor<string | null>;
  syncStep: Accessor<SyncStep>;
  setSyncStep: (step: SyncStep) => void;
  syncError: Accessor<string>;
  progressMessage: Accessor<string>;
  pullFilesChanged: Accessor<number>;
  pullHasConflicts: Accessor<boolean>;
  pullWarnings: Accessor<string[]>;
  pullConflictFiles: Accessor<string[]>;
  pushFilesPushed: Accessor<number>;
  pushCommitHash: Accessor<string>;
  closeSync: () => void;
  handlePull: (vault: Vault) => void;
  handlePush: (vault: Vault) => void;
  handleSyncDone: () => void;
  handleLinkProject: (e: MouseEvent) => void;
  handleSyncToggle: (e: MouseEvent, vault: Vault) => void;
  selectVault: (vault: Vault) => void;
}
