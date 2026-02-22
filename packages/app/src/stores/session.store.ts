import { createSignal } from 'solid-js';
import type { Session } from '@nori/shared';

export const [sessions, setSessions] = createSignal<Session[]>([]);
export const [activeSession, setActiveSession] = createSignal<Session | null>(null);

export function addSession(session: Session) {
  setSessions((prev) => [session, ...prev]);
}

export function updateSession(id: string, updates: Partial<Session>) {
  setSessions((prev) =>
    prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
  );
}
