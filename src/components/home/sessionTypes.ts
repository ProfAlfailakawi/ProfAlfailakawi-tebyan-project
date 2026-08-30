/**
 * Tebyan session model — the home is a continuous, guided workspace, not a set
 * of tabs. Everything a user does stays inside one session as a series of
 * structured turns; capabilities run inline within a turn and their results are
 * lifted into the session so later turns can build on them.
 */

import type { ResponseMode } from '../../orchestrator/types';
import type { SemanticIntent, CapabilityRoute } from '../../orchestrator/capabilities/router';
import type { CapabilityId, CapabilityResult } from '../../orchestrator/capabilities/types';
import type { ContextRelation } from '../../orchestrator/session/types';

/** A capability launched inside a turn; its result is persisted to the session. */
export interface CapabilityRun {
  id: string;
  capability: CapabilityId;
  result?: CapabilityResult;
  completedAt?: number;
}

export interface TebyanTurn {
  id: string;
  userInput: string;
  understanding: string;
  summary: string;
  action: string;
  clarifyingQuestion: string | null;
  /** Clarifications the user added to THIS turn (feed back into capabilities). */
  clarifications: string[];
  semantic: SemanticIntent;
  /** How this turn related to the session when it was composed. */
  contextRelation: ContextRelation;
  mode: ResponseMode;
  /** The Next-Best-Action + alternatives chosen for this turn. */
  route: CapabilityRoute;
  /** Inline capabilities run within this turn, with their results. */
  capabilities: CapabilityRun[];
  source: 'ai' | 'local';
  createdAt: number;
}

export interface TebyanSession {
  id: string;
  turns: TebyanTurn[];
  keyFacts: string[];
  startedAt: number;
}
