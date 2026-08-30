import React, { useEffect, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { logFunnel } from '../../../services/analyticsService';
import type { CapabilityContext } from '../../../orchestrator/capabilities/types';

type Q = { question: string; type: string; options: string[]; answer: string };

type Props = {
  ctx: CapabilityContext;
  onRestart?: () => void;
  onBackToSummary?: () => void;
};

export const InlineQuiz: React.FC<Props> = ({ ctx, onRestart, onBackToSummary }) => {
  const ar = ctx.language === 'ar';
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    logFunnel('capability_started', ctx.language, { capability: 'quiz' });
    (async () => {
      try {
        const { generateQuiz } = await import('../../../services/gemini');
        const q = await generateQuiz(ctx.originalQuestion);
        const list = (Array.isArray(q) ? q : []).filter((x: any) => x?.question && Array.isArray(x?.options));
        if (!list.length) throw new Error('empty');
        setQuestions(list.slice(0, 5));
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return (
      <div className="flex items-center gap-2 rounded-[18px] border border-[#8FA9C7]/14 bg-white/95 p-4 text-[13px] font-black text-[#8E7AAE]">
        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
        {ar ? 'أجهّز سؤالك…' : 'Preparing your question…'}
      </div>
    );

  if (failed || !questions)
    return (
      <div className="rounded-[18px] border border-[#8FA9C7]/14 bg-white/95 p-4">
        <p className="text-[13px] font-bold text-[#64788D]">
          {ar ? 'تعذّر تجهيز الاختبار الآن. جرّب مرة أخرى.' : "Couldn't prepare the quiz now. Try again."}
        </p>
      </div>
    );

  const done = idx >= questions.length;
  if (done) {
    const pct = Math.round((correct / questions.length) * 100);
    const good = pct >= 60;
    return (
      <div className="rounded-[20px] border border-[#8FA9C7]/14 bg-white/95 p-5 text-right" dir={ar ? 'rtl' : 'ltr'}>
        <p className="text-[14px] font-black text-[#182231]">
          {ar ? `أجبت ${correct} من ${questions.length} بشكل صحيح.` : `You got ${correct} of ${questions.length} right.`}
        </p>
        <p className="mt-2 text-[13px] font-bold leading-[1.85] text-[#34435A]">
          {good
            ? ar
              ? 'فهمك جيد لهذا الموضوع. ركّز على النقاط التي أخطأت فيها لتثبيتها.'
              : 'Solid understanding. Revisit the ones you missed to lock it in.'
            : ar
              ? 'الأساس موجود، لكن الموضوع يحتاج مراجعة أعمق. نبسّطه لك؟'
              : 'The basics are there, but this needs a deeper pass. Want it simplified?'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setIdx(0);
              setPicked(null);
              setCorrect(0);
              onRestart?.();
            }}
            className="min-h-10 rounded-[13px] bg-[#182231] px-4 text-[12px] font-black text-white"
          >
            {ar ? 'أعد الاختبار' : 'Retake'}
          </button>
          <button
            type="button"
            onClick={() => onBackToSummary?.()}
            className="min-h-10 rounded-[13px] border border-[#8FA9C7]/18 bg-white px-4 text-[12px] font-black text-[#465568] hover:bg-[#F7F5FA]"
          >
            {ar ? 'ارجع للخلاصة' : 'Back to summary'}
          </button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const answered = picked !== null;

  return (
    <div className="rounded-[20px] border border-[#8FA9C7]/14 bg-white/95 p-5 text-right" dir={ar ? 'rtl' : 'ltr'}>
      <p className="text-[11px] font-black text-[#8E7AAE]">
        {ar ? `سؤال ${idx + 1} من ${questions.length}` : `Question ${idx + 1} of ${questions.length}`}
      </p>
      <p className="mt-1.5 text-[15px] font-black leading-[1.8] text-[#182231]">{q.question}</p>
      <div className="mt-3 space-y-2">
        {q.options.map((opt, i) => {
          const isAnswer = opt === q.answer;
          const isPicked = opt === picked;
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => {
                setPicked(opt);
                if (opt === q.answer) setCorrect((c) => c + 1);
              }}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-[14px] border px-4 py-3 text-right text-[13px] font-bold transition-colors',
                !answered && 'border-[#8FA9C7]/18 bg-white hover:bg-[#F7F5FA]',
                answered && isAnswer && 'border-[#A8C3BD]/40 bg-[#F3F8F6] text-[#34524B]',
                answered && isPicked && !isAnswer && 'border-[#E4B7B0]/50 bg-[#FBF3F1] text-[#9A4A3E]',
                answered && !isAnswer && !isPicked && 'border-[#8FA9C7]/12 bg-white text-[#94A3B5]',
              )}
            >
              <span>{opt}</span>
              {answered && isAnswer && <Check className="h-4 w-4 shrink-0 text-[#4D766B]" />}
              {answered && isPicked && !isAnswer && <X className="h-4 w-4 shrink-0 text-[#C0685C]" />}
            </button>
          );
        })}
      </div>
      {answered && (
        <button
          type="button"
          onClick={() => {
            setPicked(null);
            setIdx((i) => i + 1);
          }}
          className="mt-3 min-h-10 rounded-[13px] bg-[#182231] px-4 text-[12px] font-black text-white"
        >
          {idx + 1 >= questions.length ? (ar ? 'أظهر النتيجة' : 'Show result') : ar ? 'السؤال التالي' : 'Next question'}
        </button>
      )}
    </div>
  );
};

export default InlineQuiz;
