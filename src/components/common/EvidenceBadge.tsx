import React from 'react';
import { ShieldCheck, Globe, Sparkles, FlaskConical, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { EvidenceEnvelope, EvidenceSource } from '../../lib/aiProxy';

/**
 * EvidenceBadge — the visible heart of "Evidence Mode".
 *
 * Tells the user WHERE an answer came from (Tebyān's own knowledge base, the
 * live web, a simulation/council, or the model's general knowledge), how
 * confident the grounding is, and — expandable — the exact citations.
 *
 * Fully self-contained and defensive: renders sensibly for any/empty evidence.
 */

const SOURCE_META: Record<EvidenceSource, {
  ar: string; en: string; icon: React.ElementType; className: string; dot: string;
}> = {
  internal: {
    ar: 'من قاعدة تبيان', en: "From Tebyān's base",
    icon: ShieldCheck,
    className: 'bg-[#EEF4F1] text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  web: {
    ar: 'من الويب الحالي', en: 'From the live web',
    icon: Globe,
    className: 'bg-[#EAF1FA] text-sky-800 border-sky-200',
    dot: 'bg-sky-500',
  },
  simulation: {
    ar: 'من محاكاة/مجلس', en: 'From a simulation',
    icon: FlaskConical,
    className: 'bg-[#F1EEF4] text-[#6E5A8E] border-[#8E7AAE]/30',
    dot: 'bg-[#8E7AAE]',
  },
  model: {
    ar: 'اجتهاد عام', en: 'General knowledge',
    icon: Sparkles,
    className: 'bg-[#F6F0E3] text-amber-800 border-amber-200',
    dot: 'bg-amber-400',
  },
};

function confidenceLabel(c: number | null, lang: 'ar' | 'en'): string | null {
  if (c == null) return null;
  const pct = Math.round(c * 100);
  if (lang === 'ar') {
    const word = c >= 0.75 ? 'ثقة عالية' : c >= 0.5 ? 'ثقة متوسطة' : 'ثقة محدودة';
    return `${word} · ${pct}%`;
  }
  const word = c >= 0.75 ? 'High' : c >= 0.5 ? 'Medium' : 'Low';
  return `${word} · ${pct}%`;
}

export const EvidenceBadge: React.FC<{
  evidence: EvidenceEnvelope | null | undefined;
  language?: 'ar' | 'en';
  className?: string;
}> = ({ evidence, language = 'ar', className }) => {
  const [open, setOpen] = React.useState(false);
  if (!evidence) return null;

  const source = (evidence.source || 'model') as EvidenceSource;
  const meta = SOURCE_META[source] || SOURCE_META.model;
  const Icon = meta.icon;
  const citations = Array.isArray(evidence.citations) ? evidence.citations : [];
  const conf = confidenceLabel(evidence.confidence ?? null, language);
  const hasDetails = citations.length > 0;

  return (
    <div className={cn('w-full', className)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border',
            meta.className
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          {language === 'ar' ? meta.ar : meta.en}
        </span>

        {conf && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#8FA9C7]/30 text-[#465568]">
            <span className={cn('w-2 h-2 rounded-full', meta.dot)} />
            {conf}
          </span>
        )}

        {hasDetails && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#8FA9C7]/30 text-[#465568] hover:bg-[#F7F5F2] transition-all cursor-pointer"
          >
            {language === 'ar'
              ? `${citations.length} مصدر`
              : `${citations.length} source${citations.length > 1 ? 's' : ''}`}
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
          </button>
        )}
      </div>

      {open && hasDetails && (
        <ul className="mt-3 space-y-2">
          {citations.map((c) => (
            <li
              key={c.index}
              className="rounded-xl border border-[#8FA9C7]/25 bg-white p-3 text-sm shadow-[0_1px_4px_rgba(0,0,0,0.03)]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-[#182231] leading-snug">{c.title}</span>
                {c.uri && /^https?:\/\//i.test(c.uri) && (
                  <a
                    href={c.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[#8E7AAE] hover:text-[#6E5A8E]"
                    title={language === 'ar' ? 'فتح المصدر' : 'Open source'}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              {c.snippet && (
                <p className="mt-1 text-[#5c6b7d] leading-relaxed line-clamp-4">{c.snippet}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EvidenceBadge;
