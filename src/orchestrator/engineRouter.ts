/**
 * EngineRouter — pick the engine(s) and the single Next Best Action.
 *
 * The user expresses intent; Tebyan performs orchestration. Given a classified
 * intent (and, when available, the AI's own engine hint), the router decides:
 *   - nextBestAction: the ONE step Tebyan leads with after the answer.
 *   - alternatives:   the human-worded options revealed behind "خيارات أخرى".
 *
 * Rule of thumb encoded here: a live social/negotiation/parenting situation is
 * better rehearsed than read — so Simulation wins as the Next Best Action even
 * if the primary keyword lean was "conflict" or "emotional". That is the
 * intended WOW moment.
 */

import {
  ENGINES,
  enginesForIntent,
  getEngine,
  toEngineAction,
  type EngineDef,
} from './engineRegistry';
import type { ClassifiedIntent, EngineAction, IntentType, Language } from './types';

/** Best engine for an intent, preferring one that accepts a seeded query. */
function bestEngineFor(intent: IntentType): EngineDef | undefined {
  const list = enginesForIntent(intent).filter((e) => e.acceptsSeed);
  return list[0];
}

/**
 * Choose the primary engine for the Next Best Action.
 * Precedence: strong social situation → Simulation; else AI hint; else the
 * primary intent's best engine; else a safe default (Knowledge Center).
 */
function choosePrimaryEngine(
  intent: ClassifiedIntent,
  aiHint?: IntentType | null,
): EngineDef {
  // WOW moment: rehearse real interactions instead of only advising.
  if (
    intent.isSocialSituation &&
    (intent.primary === 'conflict' ||
      intent.primary === 'simulate' ||
      intent.primary === 'emotional' ||
      intent.secondary.includes('simulate'))
  ) {
    return ENGINES.simulation;
  }

  // Trust the AI's engine hint when it maps to a real engine.
  if (aiHint) {
    const hinted = bestEngineFor(aiHint);
    if (hinted) return hinted;
  }

  const byPrimary = bestEngineFor(intent.primary);
  if (byPrimary) return byPrimary;

  // Fall back through secondary intents.
  for (const s of intent.secondary) {
    const e = bestEngineFor(s);
    if (e) return e;
  }

  return ENGINES.knowledgecenter;
}

/**
 * Build the ordered list of alternative engine actions (navigations) for the
 * "خيارات أخرى" drawer. These are DISTINCT from the in-place depth controls
 * ("بسّطها أكثر" / "حلّلها بعمق"), which the answer card handles without leaving
 * the page. Here we offer genuine other engines, always human-worded.
 */
function buildAlternatives(
  query: string,
  intent: ClassifiedIntent,
  primaryEngineId: string,
  language: Language,
): EngineAction[] {
  const ordered: string[] = [];
  const push = (id: string) => {
    if (id !== primaryEngineId && ENGINES[id] && !ordered.includes(id)) ordered.push(id);
  };

  // Offer engines drawn from secondary intents first (most relevant).
  intent.secondary.forEach((s) => {
    const e = bestEngineFor(s);
    if (e) push(e.id);
  });

  // Then a stable, useful spread of "different paths" the user may want.
  // These map to the human phrasings the product spec calls for.
  push('roadmap'); // "حوّلها إلى خطة"
  push('simulation'); // "جرّب الموقف معي"
  push('council'); // "اعرض وجهات نظر أخرى"
  push('timemachine'); // "ماذا قد يحدث لاحقًا؟"
  push('creativelab'); // "طوّر الفكرة"
  push('knowledgecenter'); // "افهمها بعمق"

  return ordered
    .slice(0, 5)
    .map((id) => toEngineAction(ENGINES[id], query, intent, language));
}

export interface RouteResult {
  nextBestAction: EngineAction;
  alternatives: EngineAction[];
}

export function route(
  query: string,
  intent: ClassifiedIntent,
  language: Language,
  aiHint?: IntentType | null,
): RouteResult {
  const primary = choosePrimaryEngine(intent, aiHint);
  const nextBestAction = toEngineAction(primary, query, intent, language);
  const alternatives = buildAlternatives(query, intent, primary.id, language);
  return { nextBestAction, alternatives };
}

/** Which engine chunk to preload (by tab id) while the AI answer is composing. */
export function preloadTargetFor(intent: ClassifiedIntent): string | null {
  const e = choosePrimaryEngine(intent, null);
  return e?.tabId ?? null;
}

export { getEngine };
