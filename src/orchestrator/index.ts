/**
 * Tebyan Orchestrator — public façade.
 *
 *   The user expresses intent.  →  runOrchestration()
 *   Tebyan performs orchestration:
 *     1. classify the need (instant, local)
 *     2. compose the human answer (AI, local fallback)
 *     3. route to the single best next step (blends AI hint + rules)
 *
 * The UI calls `runOrchestration` and renders the result. It never needs to
 * know which engine was chosen or by what name.
 */

import { classifyIntent } from './intentClassifier';
import { composeAnswer, composeLocalAnswer } from './answerComposer';
import { route, preloadTargetFor } from './engineRouter';
import type {
  ClassifiedIntent,
  Language,
  OrchestrationResult,
  ResponseMode,
} from './types';

/**
 * Full orchestration for a submitted query.
 * `mode` controls answer depth (quick | simple | deep) so the same query can be
 * re-run more simply or more deeply without changing the routing.
 */
export async function runOrchestration(
  query: string,
  language: Language = 'ar',
  mode: ResponseMode = 'quick',
  precomputedIntent?: ClassifiedIntent,
): Promise<OrchestrationResult> {
  const intent = precomputedIntent || classifyIntent(query, language);
  const answer = await composeAnswer(query, language, intent, mode);
  const { nextBestAction, alternatives } = route(
    query,
    intent,
    language,
    answer.engineHint,
  );
  return { query, intent, answer, nextBestAction, alternatives };
}

/**
 * Instant, synchronous, offline-safe orchestration for the very first paint or
 * for a hard network failure: local answer + rule-based routing, no await.
 */
export function runOrchestrationLocal(
  query: string,
  language: Language = 'ar',
  mode: ResponseMode = 'quick',
): OrchestrationResult {
  const intent = classifyIntent(query, language);
  const answer = composeLocalAnswer(query, language, intent, mode);
  const { nextBestAction, alternatives } = route(query, intent, language, answer.engineHint);
  return { query, intent, answer, nextBestAction, alternatives };
}

export { classifyIntent, preloadTargetFor };
export * from './types';
export { LIBRARY_BUCKETS, groupByBucket, saveSession, getLastSession, listSessions, bucketFor, removeSession } from './contextMemory';
