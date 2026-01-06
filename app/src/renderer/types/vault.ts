export interface Vault {
  name: string;
  path: string;
  created_at: number;
}

export interface CreateVaultInput {
  name: string;
  path: string;
}

export interface VaultConfig {
  vaults: Vault[];
}
