import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { logFunnel } from '../../../services/analyticsService';
import { capabilityLoadingText, getCapability } from '../../../orchestrator/capabilities/registry';
import { runOneShotCapability } from '../../../orchestrator/capabilities/services';
import { CapabilityResultCard } from './CapabilityResultCard';
import type {
  CapabilityContext,
  CapabilityId,
  CapabilityResult,
} from '../../../orchestrator/capabilities/types';

// Interactive capabilities are lazy-loaded only when actually used.
const InlineSimulation = React.lazy(() => import('./InlineSimulation'));
const InlineQuiz = React.lazy(() => import('./InlineQuiz'));

type Props = {
  capability: CapabilityId;
  ctx: CapabilityContext;
  /** Advanced fallback: open the full standalone tool (rare, tracked). */
  onOpenTab: (tabId: string, context: string) => void;
  /** Report the produced result up to the session for continuity + memory. */
  onResult?: (r: CapabilityResult) => void;
};

const fallbackLoader = (label: string) => (
  <div className="flex items-center gap-2 rounded-[18px] border border-[#8FA9C7]/14 bg-white/95 p-4 text-[13px] font-black text-[#8E7AAE]">
    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
    {label}
  </div>
);

export const CapabilityBlock: React.FC<Props> = ({ capability, ctx, onOpenTab, onResult }) => {
  const def = getCapability(capability);
  const ar = ctx.language === 'ar';
  const loadLabel = capabilityLoadingText(capability, ctx.language);

  const [result, setResult] = useState<CapabilityResult | null>(null);
  const [loading, setLoading] = useState(!def.interactive);
  const startedRef = useRef(false);

  // One-shot capabilities run immediately.
  useEffect(() => {
    if (def.interactive || startedRef.current) return;
    startedRef.current = true;
    logFunnel('capability_started', ctx.language, { capability });
    (async () => {
      const r = await runOneShotCapability(
        capability as Exclude<CapabilityId, 'simulate' | 'quiz'>,
        ctx,
      );
      setResult(r);
      setLoading(false);
      logFunnel(r.degraded ? 'capability_failed' : 'capability_completed', ctx.language, { capability });
      if (capability === 'plan') logFunnel('inline_plan_generated', ctx.language);
      if (capability === 'compare' && !r.degraded) logFunnel('inline_decision_completed', ctx.language);
      if (capability === 'research') logFunnel('inline_research_opened', ctx.language);
      onResult?.(r);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Interactive capabilities render their own components.
  if (capability === 'simulate')
    return (
      <Suspense fallback={fallbackLoader(loadLabel)}>
        <InlineSimulation ctx={ctx} onResult={onResult} />
      </Suspense>
    );
  if (capability === 'quiz')
    return (
      <Suspense fallback={fallbackLoader(loadLabel)}>
        <InlineQuiz ctx={ctx} />
      </Suspense>
    );

  if (loading) return fallbackLoader(loadLabel);

  if (!result) return null;

  // Degraded one-shot result → offer the advanced fallback as a graceful exit.
  const showFallback = result.degraded && def.fallbackTab;
  return (
    <div className="space-y-2">
      <CapabilityResultCard
        result={result}
        language={ctx.language}
        onNextAction={(a) => {
          if (a.kind === 'open_tab' && a.tabId) {
            logFunnel('external_tab_handoff', ctx.language, { from: 'capability', capability });
            onOpenTab(a.tabId, ctx.originalQuestion);
          }
        }}
      />
      {showFallback && (
        <button
          type="button"
          onClick={() => {
            logFunnel('external_tab_handoff', ctx.language, { from: 'fallback', capability });
            onOpenTab(def.fallbackTab, ctx.originalQuestion);
          }}
          className="text-[12px] font-black text-[#94A3B5] underline-offset-4 hover:text-[#182231] hover:underline"
        >
          {ar ? 'افتح الأداة الكاملة بدل ذلك' : 'Open the full tool instead'}
        </button>
      )}
    </div>
  );
};

export default CapabilityBlock;
