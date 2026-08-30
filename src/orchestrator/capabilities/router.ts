/**
 * Capability router — turns semantic intent + session state into the ONE Next
 * Best Action plus a few contextual alternatives.
 *
 * Principles:
 *  - Route capabilities to the user, never the user to tools.
 *  - Relevance beats exposure: a capability that does not fit the context is
 *    not shown, even though its engine exists.
 *  - Contextual, not a fixed spread: suggestions depend on intent, domain,
 *    what the user already tried this turn, and whether more info is needed.
 *  - Never repeat a just-completed capability as the primary unless it still
 *    adds value.
 */

import { CAPABILITIES, getCapability } from './registry';
import type { CapabilityAction, CapabilityId } from './types';
import type { IntentType } from '../types';

export interface SemanticIntent {
  primaryIntent: IntentType;
  secondaryIntents: IntentType[];
  domain: string;
  urgency: 'low' | 'normal' | 'high';
  social: boolean;
  highStakes: boolean;
  /** The AI's suggested capability (validated against the registry). */
  recommendedCapability: CapabilityId | null;
}

const ALL: CapabilityId[] = [
  'simulate', 'compare', 'plan', 'perspectives', 'future', 'research', 'simplify', 'develop', 'quiz',
];

/** Is a capability relevant to this semantic context at all? */
function isRelevant(cap: CapabilityId, s: SemanticIntent): boolean {
  const d = s.domain;
  switch (cap) {
    case 'simulate':
      // Only when there is a real interaction to rehearse.
      return s.social || s.primaryIntent === 'conflict' || s.primaryIntent === 'simulate';
    case 'compare':
      return s.primaryIntent === 'decide' || s.secondaryIntents.includes('decide') || s.primaryIntent === 'future';
    case 'plan':
      return ['plan', 'create', 'decide'].includes(s.primaryIntent) || s.secondaryIntents.includes('plan');
    case 'perspectives':
      return ['decide', 'understand', 'conflict'].includes(s.primaryIntent);
    case 'future':
      return ['decide', 'future', 'plan'].includes(s.primaryIntent) || s.secondaryIntents.includes('future');
    case 'research':
      return ['understand', 'research', 'learn'].includes(s.primaryIntent) || s.secondaryIntents.includes('research');
    case 'simplify':
      return ['understand', 'learn'].includes(s.primaryIntent);
    case 'develop':
      // Ideas only — never for medical/health/legal.
      return s.primaryIntent === 'create' && !['health'].includes(d);
    case 'quiz':
      return s.primaryIntent === 'learn' || s.secondaryIntents.includes('learn');
    default:
      return false;
  }
}

/** Score a capability for ranking within the relevant set. */
function score(
  cap: CapabilityId,
  s: SemanticIntent,
  usedThisTurn: CapabilityId[],
  usedInSession: CapabilityId[],
): number {
  const def = getCapability(cap);
  let sc = def.priority;
  if (def.intents.includes(s.primaryIntent)) sc += 4;
  if (def.intents.some((i) => s.secondaryIntents.includes(i))) sc += 2;
  if (cap === s.recommendedCapability) sc += 6;
  // Social situations strongly favour rehearsal.
  if (cap === 'simulate' && s.social) sc += 5;
  // De-prioritise something already used this turn (still allowed as alt).
  if (usedThisTurn.includes(cap)) sc -= 8;
  // Lightly de-prioritise something already used elsewhere in the session, so
  // we don't keep re-suggesting the same capability across turns.
  else if (usedInSession.includes(cap)) sc -= 3;
  // High-stakes: soften "develop"/"simulate" as primary, favour research/perspectives.
  if (s.highStakes && (cap === 'research' || cap === 'perspectives')) sc += 3;
  return sc;
}

function toAction(cap: CapabilityId, s: SemanticIntent, language: 'ar' | 'en'): CapabilityAction {
  const def = getCapability(cap);
  const pitch = def.pitch({ domain: s.domain, social: s.social });
  return {
    capability: cap,
    label: language === 'ar' ? def.label.ar : def.label.en,
    pitch: language === 'ar' ? pitch.ar : pitch.en,
    icon: def.icon,
    fallbackTab: def.fallbackTab,
  };
}

export interface CapabilityRoute {
  primary: CapabilityAction | null;
  alternatives: CapabilityAction[];
}

/**
 * Pick the Next Best Action + up to 4 alternatives, given semantic intent and
 * which capabilities were already used this turn.
 */
export function routeCapabilities(
  s: SemanticIntent,
  language: 'ar' | 'en',
  usedThisTurn: CapabilityId[] = [],
  usedInSession: CapabilityId[] = [],
): CapabilityRoute {
  const relevant = ALL.filter((c) => isRelevant(c, s)).sort(
    (a, b) => score(b, s, usedThisTurn, usedInSession) - score(a, s, usedThisTurn, usedInSession),
  );

  // Primary: the top relevant capability not already used (fallback: top overall).
  const freshFirst = relevant.filter((c) => !usedThisTurn.includes(c));
  const primaryId = (freshFirst[0] || relevant[0]) ?? null;

  const primary = primaryId ? toAction(primaryId, s, language) : null;
  const alternatives = relevant
    .filter((c) => c !== primaryId)
    .slice(0, 4)
    .map((c) => toAction(c, s, language));

  return { primary, alternatives };
}

/** Validate/repair an AI-suggested capability string. */
export function coerceCapability(value: unknown): CapabilityId | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  return (ALL as string[]).includes(v) ? (v as CapabilityId) : null;
}

/** Map an intent to a sensible default capability (used when AI omits one). */
export function capabilityForIntent(intent: IntentType, social: boolean): CapabilityId {
  if (social && (intent === 'conflict' || intent === 'emotional' || intent === 'simulate')) return 'simulate';
  switch (intent) {
    case 'decide':
      return 'compare';
    case 'plan':
      return 'plan';
    case 'create':
      return 'develop';
    case 'future':
      return 'future';
    case 'research':
      return 'research';
    case 'learn':
      return 'quiz';
    case 'simulate':
    case 'conflict':
      return 'simulate';
    case 'understand':
    case 'emotional':
    case 'write':
    case 'mixed':
    default:
      return 'simplify';
  }
}

export { CAPABILITIES };
