import { join } from 'node:path';
import { homedir } from 'node:os';
import { NORI_DATA_DIR_NAME, NORI_DB_FILENAME, NORI_VAULTS_DIR } from '@nori/shared';

export function getNoriDataDir(): string {
  return join(homedir(), NORI_DATA_DIR_NAME);
}

export function getNoriDbPath(): string {
  return join(getNoriDataDir(), NORI_DB_FILENAME);
}

export function getVaultsDir(): string {
  return join(getNoriDataDir(), NORI_VAULTS_DIR);
}

export function getVaultDir(vaultName: string): string {
  return join(getVaultsDir(), vaultName);
}
