import React from 'react';
import { Zap, ChevronLeft } from 'lucide-react';
import type { InstantResult } from '../services/instantSearch';

interface InstantResultsProps {
  results: InstantResult[];
  query: string;
  language: string;
  corpusSize?: number;
  onPick: (question: string) => void;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Bold the parts of `text` that match any word (>=2 chars) from the query. */
function highlight(text: string, query: string): React.ReactNode[] {
  const words = query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .map(escapeRegExp);
  if (!words.length) return [text];

  const re = new RegExp(`(${words.join('|')})`, 'gi');
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push(
      <mark key={`h-${key++}`} className="bg-transparent text-[#6E5F8E] font-black">
        {m[0]}
      </mark>,
    );
    last = m.index + m[0].length;
    if (re.lastIndex === m.index) re.lastIndex++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export const InstantResults: React.FC<InstantResultsProps> = ({
  results,
  query,
  language,
  corpusSize,
  onPick,
}) => {
  if (!results.length) return null;
  const isAr = language === 'ar';

  return (
    <div
      className="mt-3 w-full max-w-3xl mx-auto rounded-2xl border border-[#8FA9C7]/18 bg-white/78 backdrop-blur-xl overflow-hidden shadow-[0_18px_50px_rgba(142,122,174,0.14)] tebyan-focus-keep"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2 border-b border-[#8FA9C7]/12">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#8E7AAE] to-[#8FA9C7] text-white shadow-sm">
            <Zap className="h-3.5 w-3.5" fill="currentColor" />
          </span>
          <span className="text-[11px] font-black text-[#465568]">
            {isAr ? 'نتائج فورية من قاعدة المعرفة' : 'Instant results from the knowledge base'}
          </span>
        </div>
        <span className="text-[10px] font-black text-[#8E7AAE]">
          {isAr
            ? `${results.length} من ${corpusSize ?? ''} · فوري`
            : `${results.length}${corpusSize ? ` / ${corpusSize}` : ''} · instant`}
        </span>
      </div>

      {/* Results */}
      <div className="divide-y divide-[#8FA9C7]/10">
        {results.map((r, idx) => {
          const category = r.item.category || r.item.mainCategory || '';
          const summary = (r.item.quickSummary || '').trim();
          const quick = r.item.quickAnswer || {};
          const showPreview = idx === 0 && typeof quick.sayThis === 'string' && quick.sayThis.trim().length > 0;
          return (
            <React.Fragment key={r.item.id}>
              <button
                type="button"
                onClick={() => onPick(r.question)}
                className="group flex w-full items-start gap-3 px-4 py-3 text-right transition-colors hover:bg-[#F4F0FA]/60 focus:bg-[#F4F0FA]/70 focus:outline-none"
              >
                <ChevronLeft
                  className={`mt-1 h-4 w-4 shrink-0 text-[#8E7AAE]/40 transition-transform group-hover:-translate-x-0.5 group-hover:text-[#8E7AAE] ${
                    isAr ? '' : 'rotate-180'
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] md:text-sm font-bold leading-relaxed text-[#182231]">
                    {highlight(r.question, query)}
                  </span>
                  {summary && (
                    <span className="mt-0.5 block truncate text-[11px] font-medium text-[#7C8796]">
                      {summary}
                    </span>
                  )}
                </span>
                {category && (
                  <span className="mt-0.5 shrink-0 rounded-full bg-[#8FA9C7]/12 px-2 py-0.5 text-[9px] font-black text-[#64788D]">
                    {category}
                  </span>
                )}
              </button>

              {/* Instant vetted answer — appears for the top match with zero AI latency */}
              {showPreview && (
                <div className="px-4 pb-3 -mt-1">
                  <div className="rounded-xl border border-[#8E7AAE]/15 bg-[#F4F0FA]/55 p-3">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-[#8E7AAE]" fill="currentColor" />
                      <span className="text-[10px] font-black text-[#6E5F8E]">
                        {isAr ? 'إجابة فورية معتمدة · بلا انتظار' : 'Vetted instant answer · no wait'}
                      </span>
                    </div>
                    <p className="text-[12.5px] font-bold leading-relaxed text-[#2C3A4B]">
                      <span className="text-[#3F9E6A]">{isAr ? '✓ قل: ' : '✓ Say: '}</span>
                      {quick.sayThis}
                    </p>
                    {typeof quick.doThisNow === 'string' && quick.doThisNow.trim() && (
                      <p className="mt-1 text-[11.5px] font-medium leading-relaxed text-[#64788D]">
                        <span className="font-black text-[#8E7AAE]">{isAr ? 'افعل الآن: ' : 'Do now: '}</span>
                        {quick.doThisNow}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default InstantResults;
