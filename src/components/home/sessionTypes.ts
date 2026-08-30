/**
 * Tebyan session model — the home is a continuous, guided workspace, not a set
 * of tabs. Everything a user does stays inside one session as a series of
 * structured turns; capabilities run inline within a turn.
 */

import type { ResponseMode } from '../../orchestrator/types';
import type { SemanticIntent, CapabilityRoute } from '../../orchestrator/capabilities/router';

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
  mode: ResponseMode;
  /** The Next-Best-Action + alternatives chosen for this turn. */
  route: CapabilityRoute;
  source: 'ai' | 'local';
  createdAt: number;
}

export interface TebyanSession {
  id: string;
  turns: TebyanTurn[];
  startedAt: number;
}
