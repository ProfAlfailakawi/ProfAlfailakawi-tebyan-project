import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpenText,
  CheckCircle2,
  ClipboardCheck,
  Hourglass,
  Lightbulb,
  Map as MapIcon,
  MessageSquare,
  Scale,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { logFunnel } from '../../services/analyticsService';
import { CapabilityBlock } from './capabilities/CapabilityBlock';
import { routeCapabilities } from '../../orchestrator/capabilities/router';
import type { CapabilityAction, CapabilityContext, CapabilityId, CapabilityResult } from '../../orchestrator/capabilities/types';
import type { TebyanTurn } from './sessionTypes';

const ICONS: Record<string, React.ElementType> = {
  MessageSquare, Scale, Map: MapIcon, Users, Hourglass, BookOpenText, Lightbulb, Sparkles, ClipboardCheck,
};

type Props = {
  turn: TebyanTurn;
  language: 'ar' | 'en';
  /** Real prior capability summaries from the session (never fabricated). */
  priorCapabilities?: { capability: CapabilityId; title: string; summary?: string }[];
  /** Compact recent turns for continuity (distinct from capability results). */
  sessionRecentTurns?: { userInput: string; summary: string }[];
  sessionKeyFacts?: string[];
  /** Capabilities used elsewhere in the session (for contextual follow-ups). */
  usedInSession?: CapabilityId[];
  onOpenTab: (tabId: string, context: string) => void;
  onClarify: (turnId: string, answer: string) => void;
  /** Lift a capability result into the session so later turns can use it. */
  onCapabilityResult?: (turnId: string, runId: string, result: CapabilityResult) => void;
};

type Run = { key: string; capability: CapabilityId };

export const SessionTurn: React.FC<Props> = ({
  turn,
  language,
  priorCapabilities = [],
  sessionRecentTurns = [],
  sessionKeyFacts = [],
  usedInSession = [],
  onOpenTab,
  onClarify,
  onCapabilityResult,
}) => {
  const ar = language === 'ar';
  const [runs, setRuns] = useState<Run[]>([]);
  const [results, setResults] = useState<Record<string, CapabilityResult>>({});
  const [showOptions, setShowOptions] = useState(false);
  const [clarifyText, setClarifyText] = useState('');

  const usedCaps = runs.map((r) => r.capability);

  const buildContext = (): CapabilityContext => ({
    originalQuestion: turn.userInput,
    understanding: turn.understanding,
    summary: turn.summary,
    action: turn.action,
    language,
    domain: turn.semantic.domain,
    mode: turn.mode,
    clarifications: turn.clarifications,
    recentTurns: sessionRecentTurns,
    keyFacts: sessionKeyFacts,
    highStakes: turn.semantic.highStakes,
    // Real capability results only — prior ones from the session plus any run
    // within this turn. No fabricated "compare" placeholder for past turns.
    priorResults: [
      ...priorCapabilities,
      ...runs
        .map((r) => results[r.key])
        .filter(Boolean)
        .map((r) => ({ capability: r.type, title: r.title, summary: r.summary })),
    ],
  });

  const launch = (action: CapabilityAction, isPrimary: boolean) => {
    logFunnel('capability_suggested', language, { capability: action.capability, primary: isPrimary });
    if (isPrimary) logFunnel('continue_clicked', language);
    setRuns((prev) => [...prev, { key: `${action.capability}-${Date.now()}`, capability: action.capability }]);
    setShowOptions(false);
  };

  // Follow-up Next Best Action after capabilities have run — contextual, no repeats.
  const followUp = useMemo(() => {
    if (runs.length === 0) return null;
    return routeCapabilities(turn.semantic, language, usedCaps, usedInSession);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runs.length, turn.semantic, language]);

  const primary = turn.route.primary;
  const PrimaryIcon = (primary?.icon && ICONS[primary.icon]) || Sparkles;

  return (
    <section
      className="tebyan-turn relative overflow-hidden rounded-[26px] border border-[#8E7AAE]/15 bg-white/96 p-4 text-right shadow-[0_16px_48px_rgba(24,34,49,0.06)] md:rounded-[30px] md:p-7"
      dir={ar ? 'rtl' : 'ltr'}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        style={{ background: 'radial-gradient(circle at 88% 0%, #8E7AAE1f, transparent 32%)' }}
      />
      <div className="relative z-10">
        {/* the question echoed compactly */}
        <p className="mb-3 line-clamp-1 text-[12px] font-black text-[#94A3B5]">{turn.userInput}</p>

        {/* فهمت منك */}
        <div className="rounded-[20px] border border-[#8E7AAE]/14 bg-[#F7F3FA] p-4 md:p-5">
          <p className="text-[11px] font-black text-[#6E5F8E]">{ar ? 'فهمت منك' : "Here's what I understood"}</p>
          <p className="mt-1.5 text-[15px] font-bold leading-[1.9] text-[#273548] md:text-[17px]">{turn.understanding}</p>
        </div>

        {/* الخلاصة */}
        <div className="mt-3 rounded-[20px] border border-[#8FA9C7]/12 bg-[#FAF9FC] p-4 md:p-5">
          <p className="text-[11px] font-black text-[#64788D]">{ar ? 'الخلاصة' : 'The gist'}</p>
          <p className="mt-2 whitespace-pre-line text-[15px] font-bold leading-[1.95] text-[#273548] md:text-[16px]">{turn.summary}</p>
        </div>

        {/* ابدأ بهذا الآن */}
        <div className="mt-3 rounded-[20px] border border-[#A8C3BD]/17 bg-[#F3F8F6] p-4 md:p-5">
          <div className="flex items-center gap-2 text-[#4D766B]">
            <CheckCircle2 className="h-4 w-4" />
            <h3 className="text-[12px] font-black">{ar ? 'ابدأ بهذا الآن' : 'Start with this now'}</h3>
          </div>
          <p className="mt-2 text-[14px] font-bold leading-[1.9] text-[#34524B] md:text-base">{turn.action}</p>
        </div>

        {/* optional single clarifying question */}
        {turn.clarifyingQuestion && (
          <div className="mt-3 rounded-[18px] border border-[#8FA9C7]/12 bg-white px-4 py-3">
            <p className="text-[12px] font-black text-[#64788D]">{ar ? 'سؤال واحد يوضّح الصورة:' : 'One question to sharpen this:'}</p>
            <p className="mt-1 text-[13px] font-bold leading-6 text-[#465568]">{turn.clarifyingQuestion}</p>
            <div className="mt-2.5 flex gap-2">
              <input
                type="text"
                value={clarifyText}
                onChange={(e) => setClarifyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && clarifyText.trim()) { onClarify(turn.id, clarifyText.trim()); setClarifyText(''); } }}
                placeholder={ar ? 'إجابتك (اختياري)…' : 'Your answer (optional)…'}
                className="min-h-10 flex-1 rounded-[12px] border border-[#8FA9C7]/20 bg-[#FAF9FC] px-3 text-[13px] font-bold text-[#273548] outline-none focus:border-[#8E7AAE]/50"
              />
              <button
                type="button"
                disabled={!clarifyText.trim()}
                onClick={() => { onClarify(turn.id, clarifyText.trim()); setClarifyText(''); }}
                className="min-h-10 shrink-0 rounded-[12px] bg-[#182231] px-3 text-[12px] font-black text-white disabled:opacity-40"
              >
                {ar ? 'حدّث الجواب' : 'Refine'}
              </button>
            </div>
          </div>
        )}

        {/* PRIMARY capability CTA (only until the user has run something) */}
        {primary && runs.length === 0 && (
          <div className="mt-4 rounded-[22px] border border-[#182231]/10 bg-gradient-to-b from-[#F6F4FB] to-white p-4 md:p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-[#182231] text-white">
                <PrimaryIcon className="h-4 w-4" />
              </span>
              <p className="text-[14px] font-bold leading-[1.85] text-[#273548] md:text-[15px]">{primary.pitch}</p>
            </div>
            <button
              type="button"
              onClick={() => launch(primary, true)}
              className="mt-3.5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-[#182231] px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(24,34,49,0.18)] transition-transform active:scale-[0.98]"
            >
              {primary.label}
              <ArrowLeft className={cn('h-4 w-4', ar ? '' : 'rotate-180')} />
            </button>
          </div>
        )}

        {/* "other options" — contextual, ≤4, no repeats */}
        {turn.route.alternatives.length > 0 && runs.length === 0 && (
          <>
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => { const n = !showOptions; setShowOptions(n); if (n) logFunnel('secondary_option_opened', language); }}
                className="text-[13px] font-black text-[#64788D] underline-offset-4 hover:text-[#182231] hover:underline"
              >
                {showOptions ? (ar ? 'إخفاء الخيارات' : 'Hide options') : ar ? 'خيارات أخرى' : 'Other options'}
              </button>
            </div>
            {showOptions && (
              <div className="mt-3 grid grid-cols-1 gap-2 border-t border-[#8FA9C7]/10 pt-3">
                {turn.route.alternatives.map((alt) => {
                  const AltIcon = (alt.icon && ICONS[alt.icon]) || Sparkles;
                  return (
                    <button
                      key={alt.capability}
                      type="button"
                      onClick={() => launch(alt, false)}
                      className="flex min-h-12 items-center gap-3 rounded-[14px] border border-[#8FA9C7]/16 bg-white px-4 text-right text-[13px] font-black text-[#465568] transition-colors hover:bg-[#F7F5FA] active:scale-[0.99]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-[#F4F0F8] text-[#6E5F8E]"><AltIcon className="h-4 w-4" /></span>
                      <span className="flex-1">{alt.label}</span>
                      <ArrowLeft className={cn('h-4 w-4 shrink-0 text-[#8FA9C7]', ar ? '' : 'rotate-180')} />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Inline capability runs — Tebyan BECOMES the capability, in place */}
        {runs.map((r) => (
          <div key={r.key} className="mt-4">
            <CapabilityBlock
              capability={r.capability}
              ctx={buildContext()}
              onOpenTab={onOpenTab}
              onResult={(res) => {
                setResults((prev) => ({ ...prev, [r.key]: res }));
                onCapabilityResult?.(turn.id, r.key, res);
              }}
            />
          </div>
        ))}

        {/* Contextual follow-up after a capability ran */}
        {runs.length > 0 && followUp?.primary && (
          <div className="mt-4 rounded-[18px] border border-[#8FA9C7]/14 bg-[#FAF9FC] p-4">
            <p className="text-[13px] font-bold leading-[1.85] text-[#4A3F63]">{followUp.primary.pitch}</p>
            <button
              type="button"
              onClick={() => launch(followUp.primary!, false)}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-[#182231] px-4 text-[13px] font-black text-white active:scale-[0.98]"
            >
              {followUp.primary.label}
              <ArrowLeft className={cn('h-4 w-4', ar ? '' : 'rotate-180')} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
