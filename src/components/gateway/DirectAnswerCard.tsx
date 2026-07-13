import React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { ResponseMode } from "./directGuidance";

type Props = {
  language: "ar" | "en";
  query: string;
  summary: string;
  action: string;
  context: string;
  responseMode: ResponseMode;
  accent: string;
  showOptions: boolean;
  onContinue: () => void;
  onShowOptions: () => void;
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
  showOptions,
  onContinue,
  onShowOptions,
  onExplain,
  onPlan,
  onDeepen,
}) => {
  const isArabic = language === "ar";

  return (
    <section
      className="tebyan-direct-answer relative overflow-hidden rounded-[26px] border border-[#8E7AAE]/15 bg-white/96 p-4 text-right shadow-[0_16px_48px_rgba(24,34,49,0.075)] md:rounded-[30px] md:p-7"
      dir={isArabic ? "rtl" : "ltr"}
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        style={{
          background: `radial-gradient(circle at 88% 0%, ${accent}1f, transparent 31%)`,
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 border-b border-[#8FA9C7]/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#F4F0F8] text-[#6E5F8E]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-black text-[#8E7AAE]">
                {isArabic ? "جواب تبيان" : "Tebyan answer"}
              </p>
              <h2 className="mt-0.5 text-[17px] font-black leading-6 text-[#182231] md:text-xl">
                {isArabic ? "الخلاصة أولاً" : "The answer first"}
              </h2>
            </div>
          </div>
          <span className="hidden rounded-full border border-[#8E7AAE]/12 bg-[#F8F5FB] px-3 py-1.5 text-[11px] font-black text-[#6E5F8E] sm:block">
            {context}
          </span>
        </div>

        <details className="group mt-3 rounded-[16px] border border-[#8FA9C7]/10 bg-[#FAF9F6]/82 px-3.5 py-2.5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[12px] font-black text-[#7C8796]">
            <span>
              {isArabic ? "السؤال الذي فهمته" : "The question I understood"}
            </span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-2 border-t border-[#8FA9C7]/10 pt-2 text-[13px] font-bold leading-6 text-[#465568] md:text-sm">
            {query}
          </p>
        </details>

        <div className="mt-4 space-y-3">
          <div className="rounded-[20px] border border-[#8E7AAE]/11 bg-[#F7F3FA] p-4 md:p-5">
            <p className="text-[11px] font-black text-[#6E5F8E]">
              {isArabic ? "الجواب" : "Answer"}
            </p>
            <p className="mt-2 text-[15px] font-bold leading-[1.95] text-[#273548] md:text-[17px]">
              {summary}
            </p>
          </div>
          <div className="rounded-[20px] border border-[#A8C3BD]/17 bg-[#F3F8F6] p-4 md:p-5">
            <div className="flex items-center gap-2 text-[#4D766B]">
              <CheckCircle2 className="h-4 w-4" />
              <h3 className="text-[12px] font-black">
                {isArabic ? "ماذا تفعل الآن؟" : "What should you do now?"}
              </h3>
            </div>
            <p className="mt-2 text-[14px] font-bold leading-[1.9] text-[#34524B] md:text-base">
              {action}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onContinue}
            className="min-h-12 rounded-[16px] bg-[#182231] px-4 text-sm font-black text-white shadow-[0_8px_20px_rgba(24,34,49,0.15)] transition-transform active:scale-[0.98]"
          >
            {isArabic ? "أكمل معي" : "Continue with me"}
          </button>
          <button
            type="button"
            onClick={onShowOptions}
            aria-expanded={showOptions}
            className="min-h-12 rounded-[16px] border border-[#8FA9C7]/18 bg-white px-4 text-sm font-black text-[#64788D] transition-colors hover:bg-[#F7F5FA] active:scale-[0.98]"
          >
            {showOptions
              ? isArabic
                ? "أخفِ الخيارات"
                : "Hide options"
              : isArabic
                ? "خيارات أخرى"
                : "Other options"}
          </button>
        </div>

        {showOptions && (
          <div className="mt-3 border-t border-[#8FA9C7]/10 pt-3">
            <p className="mb-2 text-[12px] font-black text-[#64788D]">
              {isArabic
                ? "اختر فقط إذا تحتاج مساراً مختلفاً"
                : "Choose only if you need a different path"}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={onExplain}
                className={cn(
                  "min-h-11 rounded-[15px] border px-3 text-[13px] font-black transition-colors active:scale-[0.98]",
                  responseMode === "simple"
                    ? "border-[#8E7AAE] bg-[#8E7AAE] text-white"
                    : "border-[#8E7AAE]/18 bg-white text-[#6E5F8E] hover:bg-[#F4F0F8]",
                )}
              >
                {isArabic ? "بسّط أكثر" : "Simplify more"}
              </button>
              <button
                type="button"
                onClick={onPlan}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[15px] border border-[#A8C3BD]/24 bg-white px-3 text-[13px] font-black text-[#4D766B] hover:bg-[#F3F8F6] active:scale-[0.98]"
              >
                <ListChecks className="h-4 w-4" />
                {isArabic ? "أعطني خطة" : "Give me a plan"}
              </button>
              <button
                type="button"
                onClick={onDeepen}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[15px] border px-3 text-[13px] font-black active:scale-[0.98]",
                  responseMode === "deep"
                    ? "border-[#182231] bg-[#182231] text-white"
                    : "border-[#182231]/14 bg-white text-[#182231] hover:bg-[#F2F4F6]",
                )}
              >
                {isArabic ? "حلّل بعمق" : "Analyse deeply"}
                <ArrowLeft
                  className={cn("h-4 w-4", isArabic ? "" : "rotate-180")}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
