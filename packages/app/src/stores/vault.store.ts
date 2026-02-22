import { createSignal } from 'solid-js';
import type { Vault } from '@nori/shared';

export const [vaults, setVaults] = createSignal<Vault[]>([]);
export const [registrationOpen, setRegistrationOpen] = createSignal(false);

export function addVault(vault: Vault) {
  setVaults((prev) => [...prev, vault]);
}

export function updateVault(id: string, updates: Partial<Vault>) {
  setVaults((prev) =>
    prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
  );
}
