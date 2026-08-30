import React, { useCallback, useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../AuthProvider';
import { logFunnel } from '../../services/analyticsService';
import { HOME_EXAMPLES, homeCopy } from './homeCopy';
import { TebyanAnswer } from './TebyanAnswer';
import {
  classifyIntent,
  getLastSession,
  preloadTargetFor,
  runOrchestration,
  saveSession,
  type EngineAction,
  type MemorySession,
  type OrchestrationResult,
  type ResponseMode,
} from '../../orchestrator';

type Phase = 'idle' | 'thinking' | 'answered' | 'error';

type HandleTabChange = (
  tab: any,
  context?: string,
  exit?: boolean,
  updateHistory?: boolean,
) => void;

type Props = {
  language: 'ar' | 'en';
  handleTabChange: HandleTabChange;
  initialQuery?: string;
  onShowLogin?: () => void;
  [key: string]: any;
};

/** Warm the chunk for the engine the user is most likely to open next. */
function preloadTab(tabId: string | null) {
  if (!tabId) return;
  try {
    switch (tabId) {
      case 'simulation':
        void import('../tabs/SimulationTab');
        break;
      case 'decisionroom':
        void import('../tabs/DecisionExecutiveTab');
        break;
      case 'roadmap':
        void import('../tabs/RoadmapTab');
        break;
      case 'council':
        void import('../tabs/CouncilTab');
        break;
      case 'timemachine':
        void import('../tabs/TimeMachineTab');
        break;
      case 'knowledgecenter':
        void import('../tabs/KnowledgeCenterTab');
        break;
      case 'qawlfasl':
        void import('../tabs/QawlFasl/QawlFaslTab');
        break;
      case 'concepts':
        void import('../tabs/ConceptsTab');
        break;
      case 'creativelab':
        void import('../tabs/CreativeLabWrapper');
        break;
      case 'truthmanuscript':
        void import('../tabs/TruthManuscriptTab');
        break;
      case 'quizzes':
        void import('../tabs/QuizTab');
        break;
      default:
        break;
    }
  } catch {
    /* preload is best-effort */
  }
}

const RESUME_MAX_AGE = 1000 * 60 * 60 * 24 * 14; // 14 days

export const TebyanHome: React.FC<Props> = ({
  language,
  handleTabChange,
  initialQuery,
  onShowLogin: _onShowLogin,
}) => {
  const t = homeCopy(language);
  const isArabic = language === 'ar';
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [phase, setPhase] = useState<Phase>('idle');
  const [input, setInput] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [result, setResult] = useState<OrchestrationResult | null>(null);
  const [mode, setMode] = useState<ResponseMode>('quick');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState(0);
  const [resumeSession, setResumeSession] = useState<MemorySession | null>(null);

  const inputStartedRef = useRef(false);
  const homeViewedRef = useRef(false);

  // home_view (once) + load a resume card for returning users.
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

  const runQuery = useCallback(
    async (rawQuery: string, nextMode: ResponseMode) => {
      const query = rawQuery.trim();
      if (!query) {
        setInlineError(t.emptyError);
        return;
      }
      setInlineError(null);
      setCommittedQuery(query);
      setMode(nextMode);

      const intent = classifyIntent(query, language);
      logFunnel('first_question_submitted', language, {
        intent: intent.primary,
        domain: intent.domain,
        social: intent.isSocialSituation,
      });
      preloadTab(preloadTargetFor(intent));

      setPhase('thinking');
      setLoadingStage(0);

      try {
        const res = await runOrchestration(query, language, nextMode, intent);
        setResult(res);
        setPhase('answered');
        logFunnel('first_answer_shown', language, {
          source: res.answer.source,
          engine: res.nextBestAction.engineId,
          mode: nextMode,
        });
        if (res.nextBestAction.engineId === 'simulation') logFunnel('simulation_suggested', language);
        if (res.nextBestAction.engineId === 'roadmap') logFunnel('plan_suggested', language);
        // Remember this working session (question bucket by intent).
        saveSession({
          query,
          intent: intent.primary,
          domain: intent.domain,
          note: res.answer.summary.slice(0, 140),
          uid,
        });
      } catch {
        setPhase('error');
      }
    },
    [language, t.emptyError, uid],
  );

  // Staged loading copy: "understanding…" then "arranging…".
  useEffect(() => {
    if (phase !== 'thinking') return;
    const timer = setTimeout(() => setLoadingStage(1), 750);
    return () => clearTimeout(timer);
  }, [phase]);

  // Auto-run an initial query handed in from elsewhere (e.g. an example deep link).
  useEffect(() => {
    if (initialQuery && initialQuery.trim() && phase === 'idle') {
      setInput(initialQuery);
      void runQuery(initialQuery, 'quick');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (!inputStartedRef.current && value.trim().length > 0) {
      inputStartedRef.current = true;
      logFunnel('first_input_started', language);
    }
  };

  const submit = () => void runQuery(input, 'quick');

  const takeAction = (action: EngineAction, isPrimary: boolean) => {
    if (isPrimary) logFunnel('continue_clicked', language);
    logFunnel('next_best_action_taken', language, { engine: action.engineId, primary: isPrimary });
    if (action.engineId === 'simulation') logFunnel('simulation_started', language);
    if (action.engineId === 'roadmap') logFunnel('plan_started', language);
    saveSession({
      query: committedQuery || input,
      intent: result?.intent.primary || classifyIntent(committedQuery || input, language).primary,
      domain: result?.intent.domain || 'general',
      note: result?.answer.summary.slice(0, 140),
      lastEngineId: action.engineId,
      lastTabId: action.tabId,
      uid,
    });
    handleTabChange(action.tabId, action.handoffContext);
  };

  const reRun = (nextMode: ResponseMode) => {
    if (committedQuery) void runQuery(committedQuery, nextMode);
  };

  const clarify = (answer: string) => {
    logFunnel('clarification_answered', language);
    void runQuery(`${committedQuery} — ${answer}`, mode);
  };

  const newQuestion = () => {
    setPhase('idle');
    setResult(null);
    setInput('');
    setCommittedQuery('');
    setMode('quick');
    setInlineError(null);
  };

  const resume = () => {
    if (!resumeSession) return;
    logFunnel('returning_user_resume', language, { intent: resumeSession.intent });
    if (resumeSession.lastTabId) {
      handleTabChange(resumeSession.lastTabId, resumeSession.query);
    } else {
      setInput(resumeSession.query);
      void runQuery(resumeSession.query, 'quick');
    }
  };

  /* ------------------------------- Render ------------------------------- */

  return (
    <div className="mx-auto w-full max-w-2xl px-1 pt-8 md:pt-16" dir={isArabic ? 'rtl' : 'ltr'}>
      {phase === 'idle' && (
        <div className="flex flex-col items-center text-center">
          {/* Logo mark */}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[20px] bg-mood-primary text-white shadow-xl shadow-mood-glow">
            <Sparkles className="h-6 w-6" />
          </div>

          {/* Returning-user resume — a single quiet card, not a dashboard */}
          {resumeSession && (
            <div className="mb-8 w-full rounded-[22px] border border-[#8FA9C7]/16 bg-white/92 p-4 text-right shadow-[0_10px_30px_rgba(24,34,49,0.05)] md:p-5">
              <p className="text-[13px] font-black text-[#182231]">{t.welcomeBack}</p>
              <p className="mt-2 text-[11px] font-black text-[#8E7AAE]">{t.lastThing}</p>
              <p className="mt-1 line-clamp-2 text-[14px] font-bold leading-6 text-[#465568]">
                {resumeSession.query}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={resume}
                  className="inline-flex min-h-10 items-center gap-2 rounded-[13px] bg-[#182231] px-4 text-[13px] font-black text-white active:scale-[0.98]"
                >
                  {t.resume}
                  <ArrowLeft className={cn('h-4 w-4', isArabic ? '' : 'rotate-180')} />
                </button>
                <span className="text-[11px] font-bold text-[#94A3B5]">{t.somethingChanged}</span>
              </div>
            </div>
          )}

          <h1 className="text-[28px] font-black leading-tight tracking-tight text-[#182231] md:text-[40px]">
            {t.title}
          </h1>
          <p className="mt-3 max-w-md text-[14px] font-bold leading-[1.9] text-[#64788D] md:text-[15px]">
            {t.subtitle}
          </p>

          {/* The one big input */}
          <div className="mt-7 w-full">
            <div className="rounded-[24px] border border-[#8E7AAE]/18 bg-white/96 p-2.5 shadow-[0_18px_50px_rgba(24,34,49,0.08)] focus-within:border-[#8E7AAE]/45">
              <TextareaAutosize
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                minRows={2}
                maxRows={7}
                placeholder={t.placeholder}
                className="w-full resize-none bg-transparent px-3 py-2 text-[16px] font-bold leading-[1.9] text-[#182231] outline-none placeholder:font-semibold placeholder:text-[#A4AEBC]"
              />
              <button
                type="button"
                onClick={submit}
                className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-[#182231] px-5 text-[15px] font-black text-white shadow-[0_10px_24px_rgba(24,34,49,0.18)] transition-transform active:scale-[0.98]"
              >
                {t.submit}
                <ArrowLeft className={cn('h-4 w-4', isArabic ? '' : 'rotate-180')} />
              </button>
            </div>
            {inlineError && (
              <p className="mt-2 text-[12px] font-black text-rose-600">{inlineError}</p>
            )}
          </div>

          {/* Three tappable examples — nothing competes with the input */}
          <div className="mt-6 flex w-full flex-col items-center gap-2">
            <p className="text-[11px] font-black text-[#94A3B5]">{t.examplesLabel}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {HOME_EXAMPLES.map((ex) => {
                const label = isArabic ? ex.ar : ex.en;
                return (
                  <button
                    key={ex.en}
                    type="button"
                    onClick={() => {
                      setInput(label);
                      void runQuery(label, 'quick');
                    }}
                    className="rounded-full border border-[#8FA9C7]/20 bg-white px-3.5 py-2 text-[13px] font-bold text-[#465568] transition-colors hover:border-[#8E7AAE]/40 hover:bg-[#F7F5FA] active:scale-[0.97]"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-10 max-w-xs text-[12px] font-semibold leading-6 text-[#B2BCC9]">
            {t.quietHint}
          </p>
        </div>
      )}

      {phase === 'thinking' && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#F4F0F8] text-[#6E5F8E]">
            <Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none" />
          </div>
          <p className="mt-5 text-[15px] font-black text-[#182231]">
            {loadingStage === 0 ? t.loadingUnderstanding : t.loadingArranging}
          </p>
          <p className="mt-1 line-clamp-1 max-w-xs text-[12px] font-bold text-[#94A3B5]">
            {committedQuery}
          </p>
        </div>
      )}

      {phase === 'answered' && result && (
        <div className="w-full">
          <TebyanAnswer
            result={result}
            language={language}
            mode={mode}
            onTakeAction={(action) => takeAction(action, action.engineId === result.nextBestAction.engineId)}
            onSimplify={() => reRun('simple')}
            onDeepen={() => reRun('deep')}
            onClarify={clarify}
            onNewQuestion={newQuestion}
            onShowOptions={() => logFunnel('secondary_option_opened', language)}
          />
        </div>
      )}

      {phase === 'error' && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <p className="text-[16px] font-black text-[#182231]">{t.errorTitle}</p>
          <p className="mt-2 text-[13px] font-bold text-[#64788D]">{t.errorBody}</p>
          <button
            type="button"
            onClick={() => reRun(mode)}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-[#182231] px-5 text-sm font-black text-white active:scale-[0.98]"
          >
            {t.retry}
          </button>
        </div>
      )}
    </div>
  );
};

export default TebyanHome;
