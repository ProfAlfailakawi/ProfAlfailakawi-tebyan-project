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
        {results.map((r) => {
          const category = r.item.category || r.item.mainCategory || '';
          const summary = (r.item.quickSummary || '').trim();
          return (
            <button
              key={r.item.id}
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
          );
        })}
      </div>
    </div>
  );
};

export default InstantResults;
