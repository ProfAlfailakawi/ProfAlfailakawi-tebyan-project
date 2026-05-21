import React, { useState, useRef } from 'react';
import { ArrowRight, Search, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ExpandableText } from '../../ui/ExpandableText';
import { QawlFaslQuestion, CATEGORIES } from './types';
import { cn } from '../../../lib/utils';
import { useSmartSearch } from '../../../hooks/useSmartSearch';

interface Props {
  questions: QawlFaslQuestion[];
  onBack: () => void;
  onQuestion: (question: any) => void;
}

export default function EmergencyView({ questions, onBack, onQuestion }: Props) {
  const [search, setSearch] = useState('');
  const [ageFilter, setAgeFilter] = useState<string | null>(null);
  
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { smartSuggestion, setSmartSuggestion, isSuggestionLoading } = useSmartSearch(search);

  const filteredQuestions = questions.filter(q => {
    const qText = q.question || q.title || '';
    if (search && !qText.includes(search)) return false;
    if (ageFilter && !q.ageGroups.includes(ageFilter)) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-2xl min-h-[80vh] font-sans pb-24">
      {/* Header */}
      <div className="bg-white border-b border-[#EBEAE4] relative z-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col md:flex-row items-center md:justify-between gap-4">
          <button 
            onClick={onBack}
            className="self-start md:self-auto flex items-center gap-2 text-[#6B6A65] hover:text-[#2A2925] bg-[#F6F5F0] hover:bg-[#EBEAE4] px-4 py-2 rounded-full font-bold transition-colors"
          >
            <ArrowRight className="w-5 h-5" /> رجوع
          </button>
          <div className="text-center w-full md:flex-1">
             <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-[#2A2925] tracking-tight">لا تقلق… اختر أقرب حالة</h2>
          </div>
          <div className="hidden md:block w-24 opacity-0 pointer-events-none" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 w-full space-y-8 flex-1">
        {/* Filters */}
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="relative shadow-[0_10px_30px_rgb(0,0,0,0.04)] rounded-[24px]">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-[#A3A19C] w-5 h-5 md:w-6 md:h-6 z-10" />
            <input 
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if ((e.key === 'Tab' || e.key === 'Enter') && smartSuggestion) {
                  e.preventDefault();
                  setSearch(smartSuggestion);
                  setSmartSuggestion('');
                } else if (e.key === 'Enter') {
                  // normal
                } else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && smartSuggestion) {
                  if (e.currentTarget.selectionStart === search.length) {
                    e.preventDefault();
                    setSearch(smartSuggestion);
                    setSmartSuggestion('');
                  }
                }
              }}
              placeholder="ابحث عن سؤال... (مثال: تنمر، خوف)"
              className="w-full bg-transparent border border-[#EBEAE4] rounded-[24px] py-4 px-5 pr-14 md:py-5 md:px-6 md:pr-14 text-base md:text-lg text-[#2A2925] font-bold focus:border-[#5A5A40] outline-none placeholder:text-[#A3A19C] transition-colors relative z-10"
            />
            {/* Background for text */}
            <div className="absolute inset-0 bg-white rounded-[24px] z-0 pointer-events-none border border-[#EBEAE4]"></div>
            
            {smartSuggestion && smartSuggestion.startsWith(search) && (
              <div 
                className="pointer-events-none absolute inset-0 flex items-center pr-14 md:pr-14 text-base md:text-lg font-bold z-0"
                dir="rtl"
              >
                <span className="invisible whitespace-pre">{search}</span>
                <span className="whitespace-pre text-zinc-300">{smartSuggestion.slice(search.length)}</span>
              </div>
            )}
            
            {/* Auto-suggest rewrite pill */}
            {smartSuggestion && !smartSuggestion.startsWith(search) && isFocused && (
              <div className="absolute top-full mt-2 w-full px-2 z-20 flex justify-start">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearch(smartSuggestion);
                      setSmartSuggestion('');
                    }}
                    className="flex items-center gap-2 bg-[#5A5A40] text-white text-xs md:text-sm px-4 py-2 rounded-full shadow-lg transition-all border border-black/10"
                  >
                     <span className="opacity-80 flex-shrink-0">هل تقصد:</span> 
                     <span className="font-bold flex-1 text-right">{smartSuggestion}</span>
                     <kbd className="hidden md:inline-flex items-center justify-center gap-1 opacity-60 bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono">Tab</kbd>
                  </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-4 no-scrollbar">
            <span className="text-xs md:text-sm font-bold text-[#A3A19C] shrink-0 ml-2 uppercase tracking-widest">العمر:</span>
            {['0-3', '4-6', '7-9', '10-12', '13-15', '16-18'].map(age => (
              <button 
                key={age}
                onClick={() => setAgeFilter(a => a === age ? null : age)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs md:text-sm font-bold shrink-0 transition-colors border",
                  ageFilter === age 
                    ? "bg-[#2A2925] text-white border-[#2A2925] shadow-[0_8px_30px_rgb(0,0,0,0.04)]" 
                    : "bg-white text-[#6B6A65] border-[#EBEAE4] hover:bg-[#F6F5F0]"
                )}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div>
          {filteredQuestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 lg:gap-10">
              {filteredQuestions.map(q => {
                const cat = CATEGORIES.find(c => c.id === q.categorySlug);
                return (
                  <div key={q.id} className="bg-white flex flex-col justify-between border border-[#EBEAE4] rounded-[28px] p-6 lg:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all group cursor-pointer h-full" onClick={() => onQuestion(q)}>
                    <div className="space-y-4 md:space-y-6 w-full mb-6">
                       <ExpandableText text={q.question || q.title || ''} className="text-lg md:text-xl font-black text-[#2A2925] leading-snug lg:leading-tight group-hover:text-[#5A5A40] transition-colors" lineClamp={3} />
                       <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold flex-wrap uppercase tracking-widest">
                         <span className="bg-[#F0F4FA] text-[#4A6B8C] px-3 py-1.5 rounded-full">{cat?.title}</span>
                         {q.riskLevel === 'high' && (
                           <span className="flex items-center gap-1.5 text-[#A6603F] bg-[#FAF0E6] px-3 py-1.5 rounded-full"><ShieldAlert className="w-3.5 h-3.5" /> حساسية</span>
                         )}
                         <span className="bg-[#EAECE6] text-[#5A5A40] px-3 py-1.5 rounded-full">العمر: {q.ageGroups.join('، ')}</span>
                       </div>
                    </div>
                    
                    <div className="flex items-center w-full mt-auto mt-4 md:mt-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onQuestion(q); }}
                        className="w-full bg-[#F6F5F0] text-[#5A5A40] group-hover:bg-[#5A5A40] group-hover:text-white px-5 py-3 md:px-6 md:py-4 rounded-[20px] font-bold flex items-center justify-between transition-all shadow-sm text-sm cursor-pointer"
                      >
                         <span>عرض الإجابة</span>
                         <ArrowRight className="w-5 h-5 -scale-x-100" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-[#6B6A65] font-bold bg-white rounded-[24px] md:rounded-[32px] border border-dashed border-[#EBEAE4]">
              <Search className="w-12 h-12 text-[#D5D4CD] mx-auto mb-4" />
              <p className="text-xl">لا توجد نتائج مطابقة لبحثك.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
