import React from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { CapabilityResult, CapabilityNextAction, Language } from '../../../orchestrator/capabilities/types';

const toneClass: Record<string, string> = {
  neutral: 'border-[#8FA9C7]/14 bg-[#FAF9FC]',
  positive: 'border-[#A8C3BD]/22 bg-[#F3F8F6]',
  risk: 'border-[#E4B7B0]/30 bg-[#FBF3F1]',
  muted: 'border-[#8FA9C7]/12 bg-[#F7F7FA]',
};

type Props = {
  result: CapabilityResult;
  language: Language;
  onNextAction?: (a: CapabilityNextAction) => void;
};

export const CapabilityResultCard: React.FC<Props> = ({ result, language, onNextAction }) => {
  const ar = language === 'ar';
  return (
    <div className="rounded-[20px] border border-[#8FA9C7]/14 bg-white/95 p-4 text-right md:p-5" dir={ar ? 'rtl' : 'ltr'}>
      <h4 className="text-[14px] font-black text-[#182231]">{result.title}</h4>
      {result.summary && (
        <p className="mt-1.5 whitespace-pre-line text-[14px] font-bold leading-[1.9] text-[#34435A]">
          {result.summary}
        </p>
      )}

      {result.sections && result.sections.length > 0 && (
        <div className="mt-3 space-y-2">
          {result.sections.map((s, i) => (
            <div key={i} className={cn('rounded-[14px] border p-3', toneClass[s.tone || 'neutral'])}>
              <p className="text-[11px] font-black text-[#6E5F8E]">{s.label}</p>
              {s.body && (
                <p className="mt-1 text-[13px] font-bold leading-[1.85] text-[#34435A]">{s.body}</p>
              )}
              {s.items && s.items.length > 0 && (
                <ul className="mt-1 space-y-1">
                  {s.items.map((it, j) => (
                    <li key={j} className="flex gap-2 text-[13px] font-bold leading-[1.8] text-[#34435A]">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#8E7AAE]" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {result.claims && result.claims.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-black text-[#6E5F8E]">{ar ? 'المصادر' : 'Sources'}</p>
          {result.claims.map((c, i) => {
            const typeLabel =
              c.sourceType === 'internal'
                ? ar ? 'من مكتبة تبيان' : 'Tebyan library'
                : c.sourceType === 'file'
                  ? ar ? 'مرجع داخلي' : 'Internal reference'
                  : ar ? 'من الويب' : 'Web';
            return (
              <div key={i} className="rounded-[14px] border border-[#A8C3BD]/22 bg-[#F3F8F6] p-3">
                <p className="text-[13px] font-black leading-[1.8] text-[#273548]">{c.claim}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {c.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF4F0] px-2 py-0.5 text-[10px] font-black text-[#3E7A66]">
                      <CheckCircle2 className="h-3 w-3" />
                      {ar ? 'مصدر موثق' : 'verified source'}
                    </span>
                  )}
                  <span className="rounded-full bg-[#F1EEF7] px-2 py-0.5 text-[10px] font-black text-[#6E5F8E]">{typeLabel}</span>
                  {c.sourceTitle && !c.sourceUrl && (
                    <span className="text-[11px] font-bold text-[#64788D]">{c.sourceTitle}</span>
                  )}
                  {c.sourceUrl && (
                    <a
                      href={c.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-black text-[#4D766B] underline underline-offset-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {c.sourceTitle || (ar ? 'افتح المصدر' : 'open source')}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {result.lean && (
        <div className="mt-3 flex items-start gap-2 rounded-[14px] border border-[#8E7AAE]/16 bg-[#F7F3FA] p-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#6E5F8E]" />
          <p className="text-[13px] font-bold leading-[1.85] text-[#4A3F63]">
            <span className="font-black">{ar ? 'يميل التحليل حاليًا إلى: ' : 'The analysis currently leans toward: '}</span>
            {result.lean}
          </p>
        </div>
      )}

      {result.nextActions && result.nextActions.length > 0 && onNextAction && (
        <div className="mt-3 flex flex-wrap gap-2">
          {result.nextActions.map((a, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onNextAction(a)}
              className={cn(
                'inline-flex min-h-10 items-center gap-1.5 rounded-[13px] px-3.5 text-[12px] font-black transition-colors active:scale-[0.98]',
                a.kind === 'open_tab'
                  ? 'border border-[#8FA9C7]/20 bg-white text-[#64788D] hover:bg-[#F5F3F8]'
                  : i === 0
                    ? 'bg-[#182231] text-white'
                    : 'border border-[#8FA9C7]/18 bg-white text-[#465568] hover:bg-[#F7F5FA]',
              )}
            >
              {a.kind === 'open_tab' && <ExternalLink className="h-3.5 w-3.5" />}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
