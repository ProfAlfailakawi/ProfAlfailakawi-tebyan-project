import React from 'react';
import { ArrowLeft, BrainCircuit, CheckCircle2, ListChecks, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import type { ResponseMode } from './directGuidance';

type Props = {
  language: 'ar' | 'en';
  query: string;
  summary: string;
  action: string;
  context: string;
  responseMode: ResponseMode;
  accent: string;
  onExplain: () => void;
  onPlan: () => void;
  onDeepen: () => void;
};

export const DirectAnswerCard: React.FC<Props> = ({
  language,
  query,
  summary,
  action,
  context,
  responseMode,
  accent,
  onExplain,
  onPlan,
  onDeepen,
}) => {
  const isArabic = language === 'ar';

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="tebyan-direct-answer relative overflow-hidden rounded-[30px] border border-[#8E7AAE]/16 bg-white/94 p-5 text-right shadow-[0_20px_65px_rgba(24,34,49,0.09)] md:p-7"
      dir={isArabic ? 'rtl' : 'ltr'}
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: `radial-gradient(circle at 88% 0%, ${accent}22, transparent 34%)` }}
      />
      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#8FA9C7]/12 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4F0F8] text-[#6E5F8E]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black tracking-wider text-[#8E7AAE]">
                {isArabic ? 'نتيجتك الآن' : 'Your result now'}
              </p>
              <h2 className="mt-0.5 text-xl font-black text-[#182231] md:text-2xl">
                {isArabic ? 'الخلاصة قبل الأدوات' : 'The answer before the tools'}
              </h2>
            </div>
          </div>
          <span className="rounded-full border border-[#8E7AAE]/14 bg-[#F8F5FB] px-3 py-1.5 text-xs font-black text-[#6E5F8E]">
            {context}
          </span>
        </div>

        <div className="mt-5 rounded-2xl border border-[#8FA9C7]/12 bg-[#FAF9F6] px-4 py-3">
          <p className="text-xs font-black text-[#7C8796]">{isArabic ? 'فهمت منك' : 'I understood'}</p>
          <p className="mt-1 text-sm font-black leading-7 text-[#182231] md:text-base">{query}</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-[22px] border border-[#8E7AAE]/12 bg-[#F7F3FA] p-4 md:p-5">
            <div className="flex items-center gap-2 text-[#6E5F8E]">
              <BrainCircuit className="h-4 w-4" />
              <h3 className="text-sm font-black">{isArabic ? 'الخلاصة' : 'Summary'}</h3>
            </div>
            <p className="mt-3 text-sm font-bold leading-7 text-[#465568] md:text-base">{summary}</p>
          </div>
          <div className="rounded-[22px] border border-[#A8C3BD]/18 bg-[#F3F8F6] p-4 md:p-5">
            <div className="flex items-center gap-2 text-[#4D766B]">
              <CheckCircle2 className="h-4 w-4" />
              <h3 className="text-sm font-black">{isArabic ? 'خطوتك الآن' : 'Your next step'}</h3>
            </div>
            <p className="mt-3 text-sm font-bold leading-7 text-[#34524B] md:text-base">{action}</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-3 text-sm font-black text-[#182231]">
            {isArabic ? 'تبي نكمل بأي طريقة؟' : 'How would you like to continue?'}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={onExplain}
              className={cn(
                'min-h-12 rounded-2xl border px-4 text-sm font-black transition-all active:scale-[0.98]',
                responseMode === 'simple'
                  ? 'border-[#8E7AAE] bg-[#8E7AAE] text-white'
                  : 'border-[#8E7AAE]/18 bg-white text-[#6E5F8E] hover:bg-[#F4F0F8]',
              )}
            >
              {isArabic ? 'اشرحها ببساطة' : 'Explain simply'}
            </button>
            <button
              type="button"
              onClick={onPlan}
              className="min-h-12 rounded-2xl border border-[#A8C3BD]/24 bg-white px-4 text-sm font-black text-[#4D766B] transition-all hover:bg-[#F3F8F6] active:scale-[0.98] inline-flex items-center justify-center gap-2"
            >
              <ListChecks className="h-4 w-4" />
              {isArabic ? 'أعطني خطة' : 'Give me a plan'}
            </button>
            <button
              type="button"
              onClick={onDeepen}
              className={cn(
                'min-h-12 rounded-2xl border px-4 text-sm font-black transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2',
                responseMode === 'deep'
                  ? 'border-[#182231] bg-[#182231] text-white'
                  : 'border-[#182231]/14 bg-white text-[#182231] hover:bg-[#F2F4F6]',
              )}
            >
              {isArabic ? 'حلّلها بعمق' : 'Analyse deeply'}
              <ArrowLeft className={cn('h-4 w-4', isArabic ? '' : 'rotate-180')} />
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
