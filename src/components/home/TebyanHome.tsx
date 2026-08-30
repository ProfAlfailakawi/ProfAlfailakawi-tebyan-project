import React, { useCallback, useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../AuthProvider';
import { logFunnel } from '../../services/analyticsService';
import { HOME_EXAMPLES, homeCopy } from './homeCopy';
import { SessionTurn } from './SessionTurn';
import { composeTurn } from '../../orchestrator/turnComposer';
import { routeCapabilities } from '../../orchestrator/capabilities/router';
import { classifyIntent, getLastSession, saveSession, type Domain, type MemorySession, type ResponseMode } from '../../orchestrator';
import type { CapabilityId } from '../../orchestrator/capabilities/types';
import type { TebyanTurn } from './sessionTypes';

type HandleTabChange = (tab: any, context?: string, exit?: boolean, updateHistory?: boolean) => void;

type Props = {
  language: 'ar' | 'en';
  handleTabChange: HandleTabChange;
  initialQuery?: string;
  onShowLogin?: () => void;
  [key: string]: any;
};

/** Warm the interactive capability chunk the user is most likely to open next. */
function preloadCapability(cap: CapabilityId | null) {
  if (!cap) return;
  try {
    // Only the interactive capabilities are in separate chunks; the one-shot
    // capability block ships with the home chunk already.
    if (cap === 'simulate') void import('./capabilities/InlineSimulation');
    else if (cap === 'quiz') void import('./capabilities/InlineQuiz');
  } catch {
    /* best-effort */
  }
}

const RESUME_MAX_AGE = 1000 * 60 * 60 * 24 * 14;
const genId = () => `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export const TebyanHome: React.FC<Props> = ({ language, handleTabChange, initialQuery, onShowLogin: _onShowLogin }) => {
  const t = homeCopy(language);
  const ar = language === 'ar';
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [turns, setTurns] = useState<TebyanTurn[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [resumeSession, setResumeSession] = useState<MemorySession | null>(null);
  const [doNotSave, setDoNotSave] = useState(false);

  const inputStartedRef = useRef(false);
  const homeViewedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!homeViewedRef.current) {
      homeViewedRef.current = true;
      logFunnel('home_view', language);
    }
    try {
      const last = getLastSession(uid);
      if (last && Date.now() - last.at < RESUME_MAX_AGE) setResumeSession(last);
    } catch {
      /* ignore */
    }
  }, [language, uid]);

  useEffect(() => {
    if (thinking) {
      const timer = setTimeout(() => setLoadingStage(1), 750);
      return () => clearTimeout(timer);
    }
    setLoadingStage(0);
  }, [thinking]);

  const runQuery = useCallback(
    async (rawQuery: string, mode: ResponseMode) => {
      const query = rawQuery.trim();
      if (!query) {
        setInlineError(t.emptyError);
        return;
      }
      setInlineError(null);
      setInput('');

      const firstEver = turns.length === 0;
      const hint = classifyIntent(query, language);
      logFunnel('first_question_submitted', language, { intent: hint.primary, domain: hint.domain, social: hint.isSocialSituation, followUp: !firstEver });

      setThinking(true);
      try {
        const comp = await composeTurn(query, language, mode);
        const route = routeCapabilities(comp.semantic, language, []);
        const turn: TebyanTurn = {
          id: genId(),
          userInput: query,
          understanding: comp.understanding,
          summary: comp.summary,
          action: comp.action,
          clarifyingQuestion: comp.clarifyingQuestion,
          clarifications: [],
          semantic: comp.semantic,
          mode,
          route,
          source: comp.source,
          createdAt: Date.now(),
        };
        setTurns((prev) => [...prev, turn]);
        logFunnel('first_answer_shown', language, { source: comp.source, capability: route.primary?.capability, mode });
        if (route.primary?.capability === 'simulate') logFunnel('simulation_suggested', language);
        if (route.primary?.capability === 'plan') logFunnel('plan_suggested', language);
        preloadCapability(route.primary?.capability ?? null);
        // Privacy: persist only a short summary + intent, and only if the user
        // hasn't opted out of saving this session.
        if (!doNotSave) {
          saveSession({
            query,
            intent: comp.semantic.primaryIntent,
            domain: comp.semantic.domain as Domain,
            note: comp.summary.slice(0, 140),
            uid,
          });
        }
      } catch {
        setInlineError(t.errorBody);
      } finally {
        setThinking(false);
      }
    },
    [language, t.emptyError, t.errorBody, turns.length, uid, doNotSave],
  );

  useEffect(() => {
    if (initialQuery && initialQuery.trim() && turns.length === 0 && !thinking) {
      setInput(initialQuery);
      void runQuery(initialQuery, 'quick');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  useEffect(() => {
    if (turns.length > 0) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns.length]);

  const handleInputChange = (v: string) => {
    setInput(v);
    if (!inputStartedRef.current && v.trim()) {
      inputStartedRef.current = true;
      logFunnel('first_input_started', language);
    }
  };

  const clarifyTurn = useCallback(
    async (turnId: string, answer: string) => {
      logFunnel('clarification_answered', language);
      const target = turns.find((x) => x.id === turnId);
      if (!target) return;
      const clarifications = [...target.clarifications, answer];
      const augmented = `${target.userInput}\n${clarifications.join('\n')}`;
      // Re-run only this turn's answer; keep the same turn id so inline runs stay.
      const comp = await composeTurn(augmented, language, target.mode);
      const route = routeCapabilities(comp.semantic, language, []);
      setTurns((prev) =>
        prev.map((x) =>
          x.id === turnId
            ? { ...x, understanding: comp.understanding, summary: comp.summary, action: comp.action, clarifyingQuestion: comp.clarifyingQuestion, clarifications, semantic: comp.semantic, route }
            : x,
        ),
      );
    },
    [turns, language],
  );

  // The ONLY place navigation to a standalone tool happens now — the advanced
  // fallback. Tracked so we can watch this number fall over time.
  const openTab = useCallback(
    (tabId: string, context: string) => {
      logFunnel('external_tab_handoff', language, { tabId });
      handleTabChange(tabId, context);
    },
    [handleTabChange, language],
  );

  const resume = () => {
    if (!resumeSession) return;
    logFunnel('returning_user_resume', language, { intent: resumeSession.intent });
    setResumeSession(null);
    setInput(resumeSession.query);
    void runQuery(resumeSession.query, 'quick');
  };

  const newSession = () => {
    setTurns([]);
    setInput('');
    setInlineError(null);
  };

  const hasSession = turns.length > 0;

  /* ------------------------------- Render ------------------------------- */

  if (!hasSession) {
    return (
      <div className="mx-auto w-full max-w-2xl px-1 pt-8 md:pt-16" dir={ar ? 'rtl' : 'ltr'}>
        {thinking ? (
          <ThinkingBlock t={t} stage={loadingStage} query={input} />
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[20px] bg-mood-primary text-white shadow-xl shadow-mood-glow">
              <Sparkles className="h-6 w-6" />
            </div>

            {resumeSession && (
              <div className="mb-8 w-full rounded-[22px] border border-[#8FA9C7]/16 bg-white/92 p-4 text-right shadow-[0_10px_30px_rgba(24,34,49,0.05)] md:p-5">
                <p className="text-[13px] font-black text-[#182231]">{t.welcomeBack}</p>
                <p className="mt-2 text-[11px] font-black text-[#8E7AAE]">{t.lastThing}</p>
                <p className="mt-1 line-clamp-2 text-[14px] font-bold leading-6 text-[#465568]">{resumeSession.query}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button type="button" onClick={resume} className="inline-flex min-h-10 items-center gap-2 rounded-[13px] bg-[#182231] px-4 text-[13px] font-black text-white active:scale-[0.98]">
                    {t.resume}
                    <ArrowLeft className={cn('h-4 w-4', ar ? '' : 'rotate-180')} />
                  </button>
                  <span className="text-[11px] font-bold text-[#94A3B5]">{t.somethingChanged}</span>
                </div>
              </div>
            )}

            <h1 className="text-[28px] font-black leading-tight tracking-tight text-[#182231] md:text-[40px]">{t.title}</h1>
            <p className="mt-3 max-w-md text-[14px] font-bold leading-[1.9] text-[#64788D] md:text-[15px]">{t.subtitle}</p>

            <div className="mt-7 w-full">
              <div className="rounded-[24px] border border-[#8E7AAE]/18 bg-white/96 p-2.5 shadow-[0_18px_50px_rgba(24,34,49,0.08)] focus-within:border-[#8E7AAE]/45">
                <TextareaAutosize
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void runQuery(input, 'quick'); } }}
                  minRows={2}
                  maxRows={7}
                  placeholder={t.placeholder}
                  className="w-full resize-none bg-transparent px-3 py-2 text-[16px] font-bold leading-[1.9] text-[#182231] outline-none placeholder:font-semibold placeholder:text-[#A4AEBC]"
                />
                <button type="button" onClick={() => void runQuery(input, 'quick')} className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-[#182231] px-5 text-[15px] font-black text-white shadow-[0_10px_24px_rgba(24,34,49,0.18)] transition-transform active:scale-[0.98]">
                  {t.submit}
                  <ArrowLeft className={cn('h-4 w-4', ar ? '' : 'rotate-180')} />
                </button>
              </div>
              {inlineError && <p className="mt-2 text-[12px] font-black text-rose-600">{inlineError}</p>}
            </div>

            <div className="mt-6 flex w-full flex-col items-center gap-2">
              <p className="text-[11px] font-black text-[#94A3B5]">{t.examplesLabel}</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {HOME_EXAMPLES.map((ex) => {
                  const label = ar ? ex.ar : ex.en;
                  return (
                    <button key={ex.en} type="button" onClick={() => { setInput(label); void runQuery(label, 'quick'); }} className="rounded-full border border-[#8FA9C7]/20 bg-white px-3.5 py-2 text-[13px] font-bold text-[#465568] transition-colors hover:border-[#8E7AAE]/40 hover:bg-[#F7F5FA] active:scale-[0.97]">
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-10 max-w-xs text-[12px] font-semibold leading-6 text-[#B2BCC9]">{t.quietHint}</p>
          </div>
        )}
      </div>
    );
  }

  // Active session: a timeline of turns + a quiet composer for the next question.
  return (
    <div className="mx-auto w-full max-w-2xl px-1 pt-6 md:pt-10" dir={ar ? 'rtl' : 'ltr'}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-mood-primary text-white"><Sparkles className="h-4 w-4" /></span>
          <span className="text-[13px] font-black text-[#182231]">{ar ? 'تبيان' : 'Tebyan'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDoNotSave((v) => !v)}
            aria-pressed={doNotSave}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[11px] font-black transition-colors',
              doNotSave
                ? 'border-[#8E7AAE]/40 bg-[#F4F0F8] text-[#6E5F8E]'
                : 'border-[#8FA9C7]/18 bg-white text-[#94A3B5] hover:bg-[#F7F5FA]',
            )}
            title={ar ? 'عدم حفظ هذه الجلسة في مكتبتك' : 'Do not save this session to your library'}
          >
            {doNotSave ? (ar ? 'لن تُحفظ' : 'Not saved') : ar ? 'لا تحفظ هذه' : "Don't save this"}
          </button>
          <button type="button" onClick={newSession} className="rounded-full border border-[#8FA9C7]/18 bg-white px-3 py-1.5 text-[11px] font-black text-[#64788D] hover:bg-[#F7F5FA]">
            {ar ? 'ابدأ من جديد' : 'Start fresh'}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {turns.map((turn, i) => (
          <SessionTurn
            key={turn.id}
            turn={turn}
            language={language}
            priorSummary={i > 0 ? [{ capability: 'compare' as CapabilityId, title: turns[i - 1].userInput, summary: turns[i - 1].summary }] : []}
            onOpenTab={openTab}
            onClarify={clarifyTurn}
          />
        ))}
      </div>

      {thinking && <div className="mt-5"><ThinkingBlock t={t} stage={loadingStage} query={input} compact /></div>}

      {/* Quiet composer for the next question — stays in the same session */}
      <div className="mt-6">
        <div className="rounded-[20px] border border-[#8E7AAE]/16 bg-white/96 p-2 shadow-[0_10px_30px_rgba(24,34,49,0.05)] focus-within:border-[#8E7AAE]/40">
          <TextareaAutosize
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void runQuery(input, 'quick'); } }}
            minRows={1}
            maxRows={5}
            placeholder={ar ? 'أضف سؤالًا آخر أو وضّح أكثر…' : 'Ask another question or clarify…'}
            className="w-full resize-none bg-transparent px-3 py-2 text-[15px] font-bold leading-[1.8] text-[#182231] outline-none placeholder:font-semibold placeholder:text-[#A4AEBC]"
          />
          <button type="button" onClick={() => void runQuery(input, 'quick')} disabled={thinking} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[15px] bg-[#182231] px-5 text-[14px] font-black text-white active:scale-[0.98] disabled:opacity-50">
            {t.submit}
            <ArrowLeft className={cn('h-4 w-4', ar ? '' : 'rotate-180')} />
          </button>
        </div>
        {inlineError && <p className="mt-2 text-[12px] font-black text-rose-600">{inlineError}</p>}
      </div>

      <div ref={bottomRef} />
    </div>
  );
};

const ThinkingBlock: React.FC<{ t: ReturnType<typeof homeCopy>; stage: number; query: string; compact?: boolean }> = ({ t, stage, query, compact }) => (
  <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-6' : 'min-h-[40vh]')}>
    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#F4F0F8] text-[#6E5F8E]">
      <Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none" />
    </div>
    <p className="mt-5 text-[15px] font-black text-[#182231]">{stage === 0 ? t.loadingUnderstanding : t.loadingArranging}</p>
    {query && <p className="mt-1 line-clamp-1 max-w-xs text-[12px] font-bold text-[#94A3B5]">{query}</p>}
  </div>
);

export default TebyanHome;
