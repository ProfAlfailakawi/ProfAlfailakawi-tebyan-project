/**
 * ContextMemory — remember working sessions so Tebyan feels smart, not scary.
 *
 * Returning users see a single "آخر شيء كنا نعمل عليه" card instead of a
 * dashboard of numbers; the Library groups past work by the user's own intent
 * (أسئلتي / قراراتي / خططي / تجاربي / أفكاري) rather than by tool name.
 *
 * Storage is localStorage only, uid-scoped, and holds NOTHING sensitive — just
 * the user's own phrasing of what they were working on plus lightweight routing
 * hints. Every read/write is wrapped so a private window or blocked storage can
 * never break the page.
 */

import type { IntentType, MemorySession } from './types';

const SESSIONS_KEY = 'tebyan_orchestrator_sessions';
const LAST_KEY = 'tebyan_last_session'; // kept compatible with the legacy shape
const MAX_SESSIONS = 60;

function readAll(): MemorySession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MemorySession[]) : [];
  } catch {
    return [];
  }
}

function writeAll(sessions: MemorySession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch {
    /* storage unavailable — degrade silently */
  }
}

function makeId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Record (or update) the current working session. Returns the stored record. */
export function saveSession(
  input: Omit<MemorySession, 'id' | 'at'> & { id?: string; at?: number },
): MemorySession {
  const all = readAll();
  const now = Date.now();

  // Merge with an existing very-recent session on the same query to avoid dupes.
  const existingIdx = all.findIndex(
    (s) =>
      (input.id && s.id === input.id) ||
      (s.query.trim() === input.query.trim() && now - s.at < 1000 * 60 * 60 * 6),
  );

  const record: MemorySession = {
    id: input.id || (existingIdx >= 0 ? all[existingIdx].id : makeId()),
    query: input.query,
    intent: input.intent,
    domain: input.domain,
    note: input.note,
    lastEngineId: input.lastEngineId,
    lastTabId: input.lastTabId,
    at: input.at || now,
    uid: input.uid ?? null,
  };

  if (existingIdx >= 0) {
    all[existingIdx] = { ...all[existingIdx], ...record };
  } else {
    all.unshift(record);
  }
  writeAll(all);

  // Also mirror to the legacy last-session key (compat + resume card).
  try {
    localStorage.setItem(
      LAST_KEY,
      JSON.stringify({
        query: record.query,
        tool: record.lastTabId || '',
        toolLabel: record.note || '',
        intent: record.intent,
        id: record.id,
        at: record.at,
      }),
    );
  } catch {
    /* ignore */
  }

  return record;
}

/** The single most recent session for this user (or guest), if any. */
export function getLastSession(uid?: string | null): MemorySession | null {
  const all = readAll();
  const scoped = all.filter((s) => (uid ? s.uid === uid : !s.uid));
  const pick = (scoped.length ? scoped : all).sort((a, b) => b.at - a.at)[0];
  return pick || null;
}

/** All sessions for this user, newest first. */
export function listSessions(uid?: string | null): MemorySession[] {
  const all = readAll().sort((a, b) => b.at - a.at);
  if (uid === undefined) return all;
  return all.filter((s) => (uid ? s.uid === uid : !s.uid));
}

/** The intent buckets the Library groups by, in display order. */
export const LIBRARY_BUCKETS: Array<{ intent: IntentType; ar: string; en: string }> = [
  { intent: 'understand', ar: 'أسئلتي', en: 'My questions' },
  { intent: 'decide', ar: 'قراراتي', en: 'My decisions' },
  { intent: 'plan', ar: 'خططي', en: 'My plans' },
  { intent: 'simulate', ar: 'تجاربي', en: 'My rehearsals' },
  { intent: 'create', ar: 'أفكاري', en: 'My ideas' },
];

/** Map any intent to one of the five user-facing buckets. */
export function bucketFor(intent: IntentType): IntentType {
  switch (intent) {
    case 'decide':
    case 'future':
      return 'decide';
    case 'plan':
      return 'plan';
    case 'simulate':
    case 'conflict':
    case 'emotional':
      return 'simulate';
    case 'create':
    case 'write':
      return 'create';
    case 'understand':
    case 'research':
    case 'learn':
    case 'mixed':
    default:
      return 'understand';
  }
}

/** Group a user's sessions into the five Library buckets. */
export function groupByBucket(uid?: string | null): Record<IntentType, MemorySession[]> {
  const out = {} as Record<IntentType, MemorySession[]>;
  LIBRARY_BUCKETS.forEach((b) => (out[b.intent] = []));
  listSessions(uid).forEach((s) => {
    const bucket = bucketFor(s.intent);
    (out[bucket] = out[bucket] || []).push(s);
  });
  return out;
}

export function removeSession(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}
