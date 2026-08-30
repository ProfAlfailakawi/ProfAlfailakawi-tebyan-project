import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpenText,
  CheckCircle2,
  ClipboardCheck,
  Hourglass,
  Lightbulb,
  ListChecks,
  Map as MapIcon,
  MessageSquare,
  Network,
  Scale,
  ScrollText,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { homeCopy } from './homeCopy';
import type { EngineAction, Language, OrchestrationResult, ResponseMode } from '../../orchestrator/types';

const ICONS: Record<string, React.ElementType> = {
  MessageSquare,
  Scale,
  Users,
  Map: MapIcon,
  Hourglass,
  Network,
  BookOpenText,
  Lightbulb,
  Sparkles,
  ScrollText,
  ClipboardCheck,
};

type Props = {
  result: OrchestrationResult;
  language: Language;
  mode: ResponseMode;
  busy?: boolean;
  onTakeAction: (action: EngineAction) => void;
  onSimplify: () => void;
  onDeepen: () => void;
  onClarify: (answer: string) => void;
  onNewQuestion: () => void;
  onShowOptions: () => void;
};

export const TebyanAnswer: React.FC<Props> = ({
  result,
  language,
  mode,
  busy,
  onTakeAction,
  onSimplify,
  onDeepen,
  onClarify,
  onNewQuestion,
  onShowOptions,
}) => {
  const t = homeCopy(language);
  const isArabic = language === 'ar';
  const { answer, nextBestAction, alternatives } = result;
  const [showOptions, setShowOptions] = useState(false);
  const [clarifyText, setClarifyText] = useState('');

  const NbaIcon = (nextBestAction.icon && ICONS[nextBestAction.icon]) || Sparkles;

  const toggleOptions = () => {
    const next = !showOptions;
    setShowOptions(next);
    if (next) onShowOptions();
  };

  return (
    <section
      className="tebyan-answer relative overflow-hidden rounded-[26px] border border-[#8E7AAE]/15 bg-white/96 p-4 text-right shadow-[0_16px_48px_rgba(24,34,49,0.075)] md:rounded-[30px] md:p-7"
      dir={isArabic ? 'rtl' : 'ltr'}
      aria-live="polite"
      aria-busy={busy ? 'true' : 'false'}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        style={{ background: 'radial-gradient(circle at 88% 0%, #8E7AAE1f, transparent 32%)' }}
      />
      <div className={cn('relative z-10 transition-opacity', busy && 'opacity-50')}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#8FA9C7]/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#F4F0F8] text-[#6E5F8E]">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="text-[13px] font-black text-[#8E7AAE]">{t.answerEyebrow}</p>
          </div>
          <button
            type="button"
            onClick={onNewQuestion}
            className="rounded-full border border-[#8FA9C7]/18 bg-white px-3 py-1.5 text-[11px] font-black text-[#64788D] transition-colors hover:bg-[#F7F5FA]"
          >
            {t.askDifferently}
          </button>
        </div>

        {/* فهمت منك — Tebyan reflecting the intent back (prominent) */}
        <div className="mt-4 rounded-[20px] border border-[#8E7AAE]/14 bg-[#F7F3FA] p-4 md:p-5">
          <p className="text-[11px] font-black text-[#6E5F8E]">{t.understoodLabel}</p>
          <p className="mt-1.5 text-[15px] font-bold leading-[1.9] text-[#273548] md:text-[17px]">
            {answer.understanding}
          </p>
        </div>

        {/* الخلاصة */}
        <div className="mt-3 rounded-[20px] border border-[#8FA9C7]/12 bg-[#FAF9FC] p-4 md:p-5">
          <p className="text-[11px] font-black text-[#64788D]">{t.summaryLabel}</p>
          <p className="mt-2 text-[15px] font-bold leading-[1.95] text-[#273548] md:text-[16px]">
            {answer.summary}
          </p>
        </div>

        {/* ابدأ بهذا الآن */}
        <div className="mt-3 rounded-[20px] border border-[#A8C3BD]/17 bg-[#F3F8F6] p-4 md:p-5">
          <div className="flex items-center gap-2 text-[#4D766B]">
            <CheckCircle2 className="h-4 w-4" />
            <h3 className="text-[12px] font-black">{t.actionLabel}</h3>
          </div>
          <p className="mt-2 text-[14px] font-bold leading-[1.9] text-[#34524B] md:text-base">
            {answer.action}
          </p>
        </div>

        {/* Optional single clarifying question */}
        {answer.clarifyingQuestion && (
          <div className="mt-3 rounded-[18px] border border-[#8FA9C7]/12 bg-white px-4 py-3">
            <p className="text-[12px] font-black text-[#64788D]">{t.clarifyLead}</p>
            <p className="mt-1 text-[13px] font-bold leading-6 text-[#465568]">
              {answer.clarifyingQuestion}
            </p>
            <div className="mt-2.5 flex gap-2">
              <input
                type="text"
                value={clarifyText}
                onChange={(e) => setClarifyText(e.target.value)}
                placeholder={t.clarifyPlaceholder}
                className="min-h-10 flex-1 rounded-[12px] border border-[#8FA9C7]/20 bg-[#FAF9FC] px-3 text-[13px] font-bold text-[#273548] outline-none focus:border-[#8E7AAE]/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && clarifyText.trim()) onClarify(clarifyText.trim());
                }}
              />
              <button
                type="button"
                disabled={!clarifyText.trim()}
                onClick={() => clarifyText.trim() && onClarify(clarifyText.trim())}
                className="min-h-10 shrink-0 rounded-[12px] bg-[#182231] px-3 text-[12px] font-black text-white disabled:opacity-40"
              >
                {t.clarifySend}
              </button>
            </div>
          </div>
        )}

        {/* Next Best Action — the ONE step Tebyan leads with */}
        <div className="mt-4 rounded-[22px] border border-[#182231]/10 bg-gradient-to-b from-[#F6F4FB] to-white p-4 md:p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-[#182231] text-white">
              <NbaIcon className="h-4 w-4" />
            </span>
            <p className="text-[14px] font-bold leading-[1.85] text-[#273548] md:text-[15px]">
              {nextBestAction.pitch}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onTakeAction(nextBestAction)}
            className="mt-3.5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-[#182231] px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(24,34,49,0.18)] transition-transform active:scale-[0.98]"
          >
            {nextBestAction.label}
            <ArrowLeft className={cn('h-4 w-4', isArabic ? '' : 'rotate-180')} />
          </button>
        </div>

        {/* Small "other options" toggle */}
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={toggleOptions}
            aria-expanded={showOptions}
            className="text-[13px] font-black text-[#64788D] underline-offset-4 transition-colors hover:text-[#182231] hover:underline"
          >
            {showOptions ? t.hideOptions : t.otherOptions}
          </button>
        </div>

        {showOptions && (
          <div className="mt-3 border-t border-[#8FA9C7]/10 pt-3">
            <p className="mb-2.5 text-[12px] font-black text-[#64788D]">{t.optionsHint}</p>

            {/* In-place depth controls */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onSimplify}
                className={cn(
                  'min-h-11 rounded-[14px] border px-3 text-[13px] font-black transition-colors active:scale-[0.98]',
                  mode === 'simple'
                    ? 'border-[#8E7AAE] bg-[#8E7AAE] text-white'
                    : 'border-[#8E7AAE]/18 bg-white text-[#6E5F8E] hover:bg-[#F4F0F8]',
                )}
              >
                {t.simplify}
              </button>
              <button
                type="button"
                onClick={onDeepen}
                className={cn(
                  'min-h-11 rounded-[14px] border px-3 text-[13px] font-black transition-colors active:scale-[0.98]',
                  mode === 'deep'
                    ? 'border-[#182231] bg-[#182231] text-white'
                    : 'border-[#182231]/14 bg-white text-[#182231] hover:bg-[#F2F4F6]',
                )}
              >
                {t.deepen}
              </button>
            </div>

            {/* Alternative engine actions — human-worded, never engine names */}
            {alternatives.length > 0 && (
              <div className="mt-2 grid grid-cols-1 gap-2">
                {alternatives.map((alt) => {
                  const AltIcon = (alt.icon && ICONS[alt.icon]) || ListChecks;
                  return (
                    <button
                      key={alt.engineId}
                      type="button"
                      onClick={() => onTakeAction(alt)}
                      className="flex min-h-12 items-center gap-3 rounded-[14px] border border-[#8FA9C7]/16 bg-white px-4 text-right text-[13px] font-black text-[#465568] transition-colors hover:bg-[#F7F5FA] active:scale-[0.99]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-[#F4F0F8] text-[#6E5F8E]">
                        <AltIcon className="h-4 w-4" />
                      </span>
                      <span className="flex-1">{alt.label}</span>
                      <ArrowLeft className={cn('h-4 w-4 shrink-0 text-[#8FA9C7]', isArabic ? '' : 'rotate-180')} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
