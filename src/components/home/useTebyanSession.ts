/**
 * useTebyanSession — the session's memory, kept out of the TebyanHome monolith.
 *
 * Owns the turns, the accumulated key facts, and the capability results, and
 * derives a compact SessionContext for the next turn / capability. Session
 * state lives here (not scattered in component state) so any later turn can
 * build on what came before.
 */

import { useCallback, useMemo, useState } from 'react';
import type { CapabilityResult } from '../../orchestrator/capabilities/types';
import type { SessionContext, CapabilitySummary } from '../../orchestrator/session/types';
import type { CapabilityRun, TebyanTurn } from './sessionTypes';

const uniq = (arr: string[]) => Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));

export function useTebyanSession() {
  const [turns, setTurns] = useState<TebyanTurn[]>([]);
  const [keyFacts, setKeyFacts] = useState<string[]>([]);

  const addTurn = useCallback((turn: TebyanTurn, newFacts: string[] = []) => {
    setTurns((prev) => [...prev, turn]);
    if (newFacts.length) setKeyFacts((prev) => uniq([...prev, ...newFacts]).slice(-24));
  }, []);

  const updateTurn = useCallback((id: string, patch: Partial<TebyanTurn>, newFacts: string[] = []) => {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (newFacts.length) setKeyFacts((prev) => uniq([...prev, ...newFacts]).slice(-24));
  }, []);

  /** Record (or update) a capability run + its result on a turn. */
  const setCapabilityResult = useCallback((turnId: string, runId: string, result: CapabilityResult) => {
    setTurns((prev) =>
      prev.map((t) => {
        if (t.id !== turnId) return t;
        const exists = t.capabilities.some((c) => c.id === runId);
        const capabilities = exists
          ? t.capabilities.map((c) => (c.id === runId ? { ...c, result, completedAt: Date.now() } : c))
          : [...t.capabilities, { id: runId, capability: result.type, result, completedAt: Date.now() } as CapabilityRun];
        return { ...t, capabilities };
      }),
    );
  }, []);

  const reset = useCallback(() => {
    setTurns([]);
    setKeyFacts([]);
  }, []);

  /**
   * Compact context for the next turn/capability — last few turns, key facts,
   * and completed capability summaries. Continuity without token bloat.
   */
  const buildContext = useCallback((): SessionContext => {
    const completed: CapabilitySummary[] = [];
    turns.forEach((t) =>
      t.capabilities.forEach((c) => {
        if (c.result && !c.result.degraded)
          completed.push({
            capability: c.capability,
            title: c.result.title,
            summary: c.result.summary || c.result.lean,
            at: c.completedAt || t.createdAt,
          });
      }),
    );
    return {
      originalGoal: turns[0]?.userInput,
      recentTurns: turns.slice(-5).map((t) => ({
        userInput: t.userInput,
        understanding: t.understanding,
        summary: t.summary,
        action: t.action,
      })),
      keyFacts,
      completedCapabilities: completed.slice(-8),
    };
  }, [turns, keyFacts]);

  const completedCapabilityIds = useMemo(
    () => turns.flatMap((t) => t.capabilities.filter((c) => c.result && !c.result.degraded).map((c) => c.capability)),
    [turns],
  );

  return { turns, keyFacts, addTurn, updateTurn, setCapabilityResult, reset, buildContext, completedCapabilityIds };
}
