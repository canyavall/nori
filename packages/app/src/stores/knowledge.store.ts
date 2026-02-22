import { createSignal } from 'solid-js';
import type { KnowledgeEntry } from '@nori/shared';

export const [knowledgeEntries, setKnowledgeEntries] = createSignal<KnowledgeEntry[]>([]);
export const [searchResults, setSearchResults] = createSignal<KnowledgeEntry[]>([]);
export const [searchQuery, setSearchQuery] = createSignal('');
export const [createOpen, setCreateOpen] = createSignal(false);

export function addKnowledgeEntry(entry: KnowledgeEntry) {
  setKnowledgeEntries((prev) => [entry, ...prev]);
}

export function updateKnowledgeEntry(id: string, updates: Partial<KnowledgeEntry>) {
  setKnowledgeEntries((prev) =>
    prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
  );
}

export function removeKnowledgeEntry(id: string) {
  setKnowledgeEntries((prev) => prev.filter((e) => e.id !== id));
}
