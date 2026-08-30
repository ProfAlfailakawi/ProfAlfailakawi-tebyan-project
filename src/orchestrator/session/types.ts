/**
 * Session context — the compact, shared memory of the current Tebyan session.
 *
 * The goal is CONTINUITY WITHOUT TOKEN BLOAT: instead of resending the full
 * transcript, every new turn (and every capability) receives a small, curated
 * context — the last few turns, the key facts the user stated, and summaries of
 * the capabilities already run. This is what lets "بس عندي ديون" be understood
 * as a new constraint on the previous sell-or-continue decision rather than a
 * fresh, standalone topic.
 */

import type { CapabilityId } from '../capabilities/types';

/** How the newest message relates to the ongoing session. */
export type ContextRelation =
  | 'follow_up' // continues the current topic
  | 'new_topic' // clearly a different subject
  | 'correction' // fixes an earlier fact ("لا، مو ولدي، أخوي")
  | 'constraint' // adds a limiting fact ("وعندي شهرين فقط")
  | 'clarification'; // answers a question Tebyan asked

export interface SessionContextTurn {
  userInput: string;
  understanding: string;
  summary: string;
  action?: string;
}

export interface CapabilitySummary {
  capability: CapabilityId;
  title: string;
  summary?: string;
  at: number;
}

export interface SessionContext {
  /** The anchoring question/goal of the session, if one has emerged. */
  originalGoal?: string;
  /** The last 3–5 turns (compact), newest last. */
  recentTurns: SessionContextTurn[];
  /** Durable facts the user stated this session (age, debts, deadline…). */
  keyFacts: string[];
  /** Summaries of capabilities already completed this session. */
  completedCapabilities: CapabilitySummary[];
}

export const EMPTY_SESSION_CONTEXT: SessionContext = {
  originalGoal: undefined,
  recentTurns: [],
  keyFacts: [],
  completedCapabilities: [],
};
