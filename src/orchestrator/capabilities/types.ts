/**
 * Capability layer — the heart of the "no tools, one Tebyan" model.
 *
 * The user never chooses a tool. Tebyan chooses a CAPABILITY and runs it
 * INLINE inside the same session. A capability is what Tebyan *becomes* for a
 * moment (a rehearsal partner, an analyst, a planner, a researcher) — not a
 * place the user is sent to.
 *
 *   DO NOT ROUTE THE USER TO TOOLS. ROUTE THE CAPABILITIES TO THE USER.
 */

import type { IntentType, Language, ResponseMode } from '../types';

export type CapabilityId =
  | 'simulate' // become the other party; rehearse a conversation
  | 'compare' // weigh two options (decision)
  | 'plan' // turn a goal into first steps
  | 'perspectives' // show a few angles
  | 'future' // consequences over time
  | 'research' // grounded points with sources
  | 'simplify' // explain more simply
  | 'develop' // strengthen an idea
  | 'quiz'; // check understanding, one question at a time

/** A section inside a capability result (unified rendering). */
export interface CapabilitySection {
  label: string;
  body?: string;
  items?: string[];
  /** Visual tone hint for the renderer. */
  tone?: 'neutral' | 'positive' | 'risk' | 'muted';
}

/**
 * A grounded, cited point (research capability). A claim is only marked
 * `verified` when it comes from an actually-retrieved source (web/file/internal
 * corpus) — never from the model inventing a citation.
 */
export interface ResearchClaim {
  claim: string;
  sourceTitle?: string;
  sourceUrl?: string;
  sourceType: 'web' | 'file' | 'internal' | 'none';
  evidenceSnippet?: string;
  confidence: 'low' | 'medium' | 'high';
  verified: boolean;
}

/** What Tebyan can offer to do next, after a capability result. */
export interface CapabilityNextAction {
  label: string;
  /** 'capability' continues inline; 'refine' re-runs with a tweak; 'open_tab'
   * is the advanced fallback that leaves the session (used sparingly). */
  kind: 'capability' | 'refine' | 'retry' | 'open_tab';
  capability?: CapabilityId;
  /** For open_tab fallback only. */
  tabId?: string;
  /** Free-form hint passed back into the runner. */
  payload?: Record<string, unknown>;
}

/**
 * The unified contract every capability result satisfies, so the session can
 * render any capability with one card component.
 */
export interface CapabilityResult {
  type: CapabilityId;
  title: string;
  summary?: string;
  sections?: CapabilitySection[];
  /** Research-only cited points. */
  claims?: ResearchClaim[];
  /** A non-committal lean (decision/future), never a false certainty. */
  lean?: string;
  confidence?: number | null;
  source?: 'ai' | 'local' | 'internal' | 'web' | null;
  /** Research only: true when at least one claim is backed by a real source. */
  grounded?: boolean;
  nextActions?: CapabilityNextAction[];
  /** True when this is a safe, partial fallback (capability degraded). */
  degraded?: boolean;
}

/**
 * Everything a capability needs to stay in context — it never starts from
 * scratch. Carries the original question, the current understanding, prior
 * capability results, and any clarifications the user has added.
 */
export interface CapabilityContext {
  originalQuestion: string;
  understanding: string;
  summary: string;
  action: string;
  language: Language;
  domain: string;
  mode: ResponseMode;
  /** Extra things the user said after the first answer. */
  clarifications: string[];
  /** Compact recent session turns (continuity without token bloat). */
  recentTurns?: Array<{ userInput: string; summary: string }>;
  /** Durable facts the user stated this session (age, debts, deadline…). */
  keyFacts?: string[];
  /** Summaries of REAL capabilities already run this session (for continuity +
   * to avoid repeating suggestions). Never fabricated. */
  priorResults: Array<{ capability: CapabilityId; title: string; summary?: string }>;
  /** True for medical / legal / high-stakes-financial / mental-health topics. */
  highStakes: boolean;
}

/** A capability Tebyan offers to run — the user sees only label + pitch. */
export interface CapabilityAction {
  capability: CapabilityId;
  label: string;
  pitch: string;
  icon?: string;
  /** Advanced-only escape hatch; never the normal path. */
  fallbackTab?: string;
}

/** Static definition of a capability (registry entry). */
export interface CapabilityDef {
  id: CapabilityId;
  /** Can it run inside the session? (all true today; kept for honesty.) */
  canInline: boolean;
  /** Interactive capabilities own their turn (simulate, quiz). */
  interactive: boolean;
  /** Advanced fallback tab for power users who want the full experience. */
  fallbackTab: string;
  riskLevel: 'low' | 'normal' | 'high';
  /** Intents this capability serves. */
  intents: IntentType[];
  /** Base priority for Next-Best-Action ranking. */
  priority: number;
  icon: string;
  label: { ar: string; en: string };
  pitch: (ctx: PitchContext) => { ar: string; en: string };
}

export interface PitchContext {
  domain: string;
  social: boolean;
}

export type { IntentType, Language, ResponseMode };
