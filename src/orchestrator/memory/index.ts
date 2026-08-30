/**
 * MemoryStore abstraction.
 *
 * Context memory must not be tied to localStorage forever. This introduces a
 * small interface with two implementations:
 *   - LocalMemoryStore   — the current, privacy-friendly localStorage backing.
 *   - CloudMemoryStore    — a scaffold for opt-in Firestore sync for signed-in
 *     users. It currently delegates to local (so nothing regresses) and is the
 *     single place to add gradual, privacy-respecting sync later.
 *
 * Privacy: we persist only a short summary + intent + lightweight routing
 * hints — never raw sensitive transcripts. Callers can skip saving entirely
 * (a "don't save this" choice) and can delete any entry.
 */

import {
  saveSession as localSave,
  getLastSession as localGetLast,
  listSessions as localList,
  groupByBucket as localGroup,
  removeSession as localRemove,
} from '../contextMemory';
import type { MemorySession, IntentType } from '../types';

export interface MemoryStore {
  saveSession(input: Omit<MemorySession, 'id' | 'at'> & { id?: string; at?: number }): MemorySession;
  getLastSession(uid?: string | null): MemorySession | null;
  listSessions(uid?: string | null): MemorySession[];
  groupByBucket(uid?: string | null): Record<IntentType, MemorySession[]>;
  removeSession(id: string): void;
}

/** Local, privacy-friendly store (localStorage). */
export const LocalMemoryStore: MemoryStore = {
  saveSession: localSave,
  getLastSession: localGetLast,
  listSessions: localList,
  groupByBucket: localGroup,
  removeSession: localRemove,
};

/**
 * Cloud store scaffold. For signed-in users this is where opt-in Firestore
 * sync will live. Until that lands it delegates to local so behavior and
 * privacy are unchanged. Kept as a class to hold the uid + future client.
 */
export class CloudMemoryStore implements MemoryStore {
  constructor(private readonly uid: string) {}
  // NOTE: gradual sync (write-through to Firestore under users/{uid}/memory)
  // will be added here; reads stay local-first for speed and offline use.
  saveSession = LocalMemoryStore.saveSession;
  getLastSession = LocalMemoryStore.getLastSession;
  listSessions = LocalMemoryStore.listSessions;
  groupByBucket = LocalMemoryStore.groupByBucket;
  removeSession = LocalMemoryStore.removeSession;
}

/** Pick the store for the current user. Local today; Cloud is opt-in later. */
export function getMemoryStore(_uid?: string | null): MemoryStore {
  return LocalMemoryStore;
}
