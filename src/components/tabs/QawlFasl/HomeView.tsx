import React, { useState, useEffect, useRef } from 'react';
import { Search, AlertCircle, Library, ShieldAlert, ArrowRight, PlayCircle, Heart } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { CATEGORIES, MAIN_CATEGORIES, QawlFaslQuestion } from './types';
import { qawlFaslService } from '../../../services/qawlFaslService';
import { GeminiKeyMissingError } from '../../../services/qawlFaslAiService';
import { useSmartSearch } from '../../../hooks/useSmartSearch';

interface Props {
  onEmergency: () => void;
  onQuestion: (question: any) => void;
  onCategory: (id: string) => void;
  lastViewedId?: string | null;
  questions: QawlFaslQuestion[];
  initialValue?: string;
  onValueUsed?: () => void;
}

export default function HomeView({ onEmergency, onQuestion, onCategory, lastViewedId, questions, initialValue, onValueUsed }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { smartSuggestion, setSmartSuggestion, isSuggestionLoading } = useSmartSearch(searchQuery);

  const [trendingSearches, setTrendingSearches] = useState<any[]>([]);

  const lastViewedQuestion = lastViewedId ? questions.find(q => q.id === lastViewedId) : null;
  
  const today = new Date().toISOString().split('T')[0];
  const dailyQuestions = questions
    .filter(q => q.dailyPickDate === today || q.isDailyPick === true)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 10);

  // Ensure categories are correctly loaded
  const categoriesWithQuestions = React.useMemo(() => {
    const map = new Map();
    // Initialize with standard categories
    CATEGORIES.forEach(c => map.set(c.id, c));
    
    questions.forEach(q => {
      // Map mainCategory/category to standard category if possible
      const catTitle = q.mainCategory || q.category;
      const standardMatch = CATEGORIES.find(c => c.title === catTitle);
      
      const id = standardMatch?.id || q.categoryId || q.categorySlug || (q.category ? q.category.replace(/\s+/g, '-').toLowerCase() : null);
      
      if (id && !map.has(id)) {
        map.set(id, { id, title: q.category || id });
      } else if (id && map.has(id) && !map.get(id).title) {
        map.set(id, { id, title: q.category || id });
      }
    });

    // Remove duplicates based on title to be extra safe
    const uniqueByTitle = new Map();
    Array.from(map.values()).forEach((cat: any) => {
      if (!uniqueByTitle.has(cat.title)) {
        uniqueByTitle.set(cat.title, cat);
      }
    });

    return Array.from(uniqueByTitle.values());
  }, [questions]);

  // If no automatic daily items yet, fallback to deterministic random choice for variety
  const fallbackDaily = React.useMemo(() => {
    if (dailyQuestions.length > 0) return dailyQuestions;
    
    // Deterministic shuffle based on date
    const seed = (new Date().getFullYear() * 1000 + (new Date().getMonth() + 1) * 100 + new Date().getDate());
    const pseudoRandom = (s: number) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };
    
    return [...questions]
      .sort((a, b) => pseudoRandom(seed + a.id.length) - pseudoRandom(seed + b.id.length))
      .slice(0, 10);
  }, [questions, dailyQuestions, today]);

  const displayedDaily = dailyQuestions.length > 0 ? dailyQuestions : fallbackDaily;

  useEffect(() => {
    if (initialValue && initialValue.trim().length > 2) {
      setSearchQuery(initialValue);
      handleSearchRecursive(initialValue);
      if (onValueUsed) onValueUsed();
    }
  }, [initialValue]);

  useEffect(() => {
    async function fetchTrends() {
      const trends = await qawlFaslService.getSearchTrends();
      // De-duplicate by query (case-insensitive)
      const uniqueTrends = Array.from(new Map(trends.map(t => [t.query.toLowerCase(), t])).values());
      setTrendingSearches(uniqueTrends);
    }
    fetchTrends();
  }, []);

  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearchRecursive = async (query: string) => {
    if (query.trim().length > 2) {
      setIsSearching(true);
      setIsGenerating(false);
      setError(null);
      try {
        const results = await qawlFaslService.searchQuestions(query);
        await qawlFaslService.logSearch(query, results.length > 0);
        
        if (results.length > 0) {
          onQuestion(results[0]);
        } else {
          setIsSearching(false);
          setIsGenerating(true);
          try {
            const generatedQuestion = await qawlFaslService.handleMissingSearchPublishing(query);
            if (generatedQuestion.status === 'published') {
              onQuestion(generatedQuestion);
            } else {
              setError('تم استلام مسألتك وسيتم مراجعتها من قبل مختصين قريباً نظراً لحساسية الموضوع. يمكنك تصفح قسم الطوارئ في هذه الأثناء.');
              onEmergency();
            }
          } catch(err: any) {
             if (err instanceof GeminiKeyMissingError || err?.name === "GeminiKeyMissingError") {
                 console.warn("AI generation skipped: GEMINI_API_KEY_NOT_CONFIGURED");
                 setError("تفرق الخبراء لمناقشة طارئة.. يرجى الضغط مرة أخرى ليجتمعوا ويصدروا إجابتهم.");
             } else {
                 console.log("Status: AI analysis logic deferred", err?.message || "");
                 const errMsg = typeof err === 'string' ? err : JSON.stringify(err);
                 if(err?.message?.includes("exceeded your current quota") || err?.code === 429 || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
                     setError("أعتذر، المحرك مزدحم حالياً بالأفكار.. جرّب مرة أخرى بعد قليل.");
                 } else {
                     setError("يبدو أن معالجة هذه الفكرة تتطلب وقتاً أطول.. جرب صياغة أبسط أو العودة لاحقاً.");
                 }
              }
             onEmergency();
          }
        }
      } catch (err) {
        console.error(err);
        onEmergency();
      } finally {
        setIsSearching(false);
        setIsGenerating(false);
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchRecursive(searchQuery);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans pb-24">
      {/* Refined Navigation/Header Area space */}
      <div className="pt-6 pb-4 px-4 md:px-8 max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-zinc-500 font-bold text-xs tracking-widest uppercase mb-1">القول الفصل</span>
          <h1 className="text-xl md:text-2xl font-black text-black tracking-tight">البوصلة التحليلية</h1>
        </div>
      </div>

      {/* Editorial Header */}
      <header className="pt-2 md:pt-4 pb-6 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-zinc-200/60 pb-6 md:pb-8 text-right">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-zinc-950 leading-[1.05] tracking-tighter">
              نصحبك في <br className="hidden md:block"/>
              <span className="text-zinc-500">رحلة البناء</span>
            </h1>
          </div>
          <p className="text-sm md:text-lg text-zinc-600 font-bold leading-[1.6] max-w-sm">
            خلاصات استراتيجية وتحليلية رصينة، تساعدك في فهم الموقف واتخاذ القرار السليم.
          </p>
        </div>
      </header>

      <div className="px-4 md:px-8 max-w-7xl mx-auto space-y-6 md:space-y-10">
        
        {/* Search Experience */}
        <section id="search-section" className="relative scroll-mt-24">
          <div className="max-w-5xl mx-auto">
            <form onSubmit={handleSearch} className="group relative">
               <div className="relative flex items-center shadow-xl rounded-[32px] bg-white border-2 border-zinc-100 focus-within:border-black transition-all p-2 md:p-3">
                 <input 
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Tab' || e.key === 'Enter') && smartSuggestion) {
                      e.preventDefault();
                      setSearchQuery(smartSuggestion);
                      setSmartSuggestion('');
                    } else if (e.key === 'Enter') {
                      // allow submit
                    } else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && smartSuggestion) {
                      if (e.currentTarget.selectionStart === searchQuery.length) {
                        e.preventDefault();
                        setSearchQuery(smartSuggestion);
                        setSmartSuggestion('');
                      }
                    }
                  }}
                  placeholder="عن ماذا تود استشارتنا اليوم؟"
                  className="w-full bg-transparent py-4 px-6 md:py-6 md:px-8 text-xl md:text-2xl font-bold text-black placeholder:text-zinc-400 outline-none pr-14 md:pr-24 relative z-10"
                 />
                 
                 {smartSuggestion && smartSuggestion.startsWith(searchQuery) && (
                   <div 
                     className="pointer-events-none absolute inset-0 flex items-center pr-14 md:pr-24 text-xl md:text-2xl font-bold z-0"
                     dir="rtl"
                   >
                     <span className="invisible whitespace-pre">{searchQuery}</span>
                     <span className="whitespace-pre text-zinc-300">{smartSuggestion.slice(searchQuery.length)}</span>
                   </div>
                 )}

                 <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 w-7 h-7 md:w-8 md:h-8 group-focus-within:text-black transition-colors pointer-events-none z-10" />
                 
                 {searchQuery && (
                   <button
                     type="button"
                     onClick={() => {
                       setSearchQuery('');
                       setIsSearching(false);
                       setIsGenerating(false);
                       setError(null);
                     }}
                     className="absolute right-14 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-rose-500 w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-50 transition-colors z-10"
                   >
                     <title>إلغاء البحث</title>
                     <span className="sr-only">إلغاء البحث</span>
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                   </button>
                 )}
                 
                 <button 
                  type="submit" 
                  disabled={isSearching || isGenerating} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black hover:bg-zinc-800 text-white px-6 md:px-10 py-3 md:py-4 rounded-[20px] md:rounded-[24px] font-black text-sm md:text-lg transition-all disabled:opacity-50 z-10"
                 >
                   {isSearching ? 'جاري البحث...' : 'اكتشف'}
                 </button>
               </div>
               
               {/* Auto-suggest rewrite pill */}
               {smartSuggestion && !smartSuggestion.startsWith(searchQuery) && isFocused && (
                 <div className="absolute top-full mt-2 w-full px-2 z-20 flex justify-start">
                     <button
                       type="button"
                       onMouseDown={(e) => {
                         e.preventDefault();
                         setSearchQuery(smartSuggestion);
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
            </form>

            <div className="mt-4">
              
            </div>

            {isGenerating && (
              <div className="mt-8 flex justify-center">
                <div className="bg-[#F5F5F0] border border-zinc-200/80 px-8 py-4 rounded-full flex items-center gap-4 animate-pulse shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-[#5A5A40] animate-bounce"></div>
                  <p className="text-[#5A5A40] font-bold md:text-lg">نقوم بتحليل السياق ونرتب لك الإجابة الدقيقة...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-8 flex justify-center">
                <div className="bg-rose-50 border border-rose-200 px-8 py-4 rounded-full flex items-center gap-4 shadow-sm text-rose-800 font-bold text-center">
                  {error}
                </div>
              </div>
            )}

            {trendingSearches.length > 0 && !isGenerating && (
              <div className="mt-6 md:mt-8 flex flex-wrap gap-2 md:gap-3 justify-center items-center">
                <span className="text-zinc-400 text-xs md:text-sm font-bold pl-2 py-2">رائج الآن:</span>
                {trendingSearches.map((term, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      setSearchQuery(term.query);
                      handleSearchRecursive(term.query);
                    }}
                    className="text-zinc-500 hover:text-black font-bold text-xs md:text-sm underline underline-offset-4 decoration-zinc-200 hover:decoration-[#5A5A40] transition-all px-2 py-1 cursor-pointer"
                  >
                    {term.query}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Bento Grid Features */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:min-h-[520px]">
          {/* Main Hero Card - Bento 1 */}
          <div className="lg:col-span-8 relative overflow-hidden bg-black rounded-[32px] md:rounded-[40px] p-8 md:p-12 lg:p-16 text-white flex flex-col justify-end shadow-2xl group text-right">
            <div className="absolute top-0 right-0 p-6 md:p-12 transition-transform duration-700 group-hover:scale-110 opacity-20 group-hover:opacity-30">
              <ShieldAlert className="w-16 h-16 md:w-32 md:h-32 text-zinc-500" />
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

            <div className="relative z-10 space-y-6 md:space-y-8">
              <div className="inline-flex bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#F5F5F0]">
                خدمة التدخل السريع
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-serif leading-[1.15] tracking-tight">
                تواجه موقفاً <br className="hidden md:block"/> 
                <span className="italic text-zinc-400">حرجاً وصعباً؟</span>
              </h2>
              <p className="text-zinc-400 text-sm md:text-base lg:text-lg max-w-xl leading-[1.6]">
                في لحظات الانفعال، نحتاج للهدوء والحكمة. قسم الطوارئ يوفر لك حلولاً سريعة ومجربة للمواقف والطوارئ الضاغطة.
              </p>
              <button 
                onClick={onEmergency}
                className="bg-white text-black px-6 py-3.5 md:px-10 md:py-5 rounded-2xl md:rounded-full font-bold text-sm md:text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center md:justify-start gap-3 w-full md:w-max shadow-[0_8px_30px_rgba(255,255,255,0.1)] relative z-50 cursor-pointer pointer-events-auto"
              >
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6" />
                دليل الطوارئ
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8 h-full">
            {/* Daily Picks - Bento 2 */}
            <div className="bg-[#F5F5F0] rounded-[24px] md:rounded-[40px] p-6 md:p-8 flex flex-col flex-1 border border-transparent hover:border-zinc-200 transition-all shadow-sm text-right overflow-hidden">
               <div className="flex items-center justify-between mb-4">
                  <div className="bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] w-10 h-10 rounded-[14px] flex items-center justify-center text-[#5A5A40]">
                    <Library className="w-5 h-5" />
                  </div>
                  <p className="text-[#5A5A40] font-bold text-[10px] tracking-widest uppercase">مسائل اليوم (١٠ حالات)</p>
               </div>
               
               <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1 flex-1 custom-scrollbar">
                  {displayedDaily.length > 0 ? displayedDaily.map((q, i) => (
                    <button 
                      key={q.id || i} 
                      onClick={() => onQuestion(q)}
                      className="w-full text-right p-3 rounded-xl hover:bg-white transition-all border border-transparent hover:border-zinc-100 group flex gap-3 items-start"
                    >
                      <span className="text-zinc-300 font-black text-xs pt-1">{String(i + 1).padStart(2, '0')}</span>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-black line-clamp-1 group-hover:text-[#5A5A40]">{q.question || q.title}</h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{q.mainCategory || 'عام'}</p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-zinc-300 -scale-x-100 group-hover:text-[#5A5A40] self-center" />
                    </button>
                  )) : (
                    <p className="text-zinc-400 text-xs text-center py-10 italic">جاري تحضير المسائل اليومية...</p>
                  )}
               </div>
               
               <div className="pt-4 border-t border-zinc-200/50 mt-auto">
                 <p className="text-[10px] text-zinc-400 font-medium">مختارات اليوم لرحلة اتخاذ القرار</p>
               </div>
            </div>

            {/* Last Viewed - Bento 3 */}
            <button
               onClick={() => lastViewedQuestion && onQuestion(lastViewedQuestion)}
               disabled={!lastViewedQuestion}
               className={cn(
                "rounded-[24px] md:rounded-[40px] p-6 md:p-8 flex flex-col justify-between transition-all group text-right flex-shrink-0",
                lastViewedQuestion ? "bg-white border border-zinc-200/80 cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]" : "bg-zinc-50 border border-zinc-100 opacity-60"
               )}
            >
              <div className="space-y-4">
                <div className="bg-rose-50 w-8 h-8 md:w-11 md:h-11 rounded-[14px] md:rounded-2xl flex items-center justify-center text-rose-500">
                  <PlayCircle className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <p className="text-zinc-400 font-bold text-[10px] md:text-xs tracking-widest uppercase">آخر ما تصفحت</p>
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-black line-clamp-2 md:line-clamp-3 leading-snug">
                  {lastViewedQuestion?.question || lastViewedQuestion?.title || 'ابدأ استكشاف المكتبة'}
                </h3>
              </div>
              {lastViewedQuestion && (
                <div className="flex items-center gap-2 font-bold text-black mt-6 text-sm md:text-base group-hover:gap-4 transition-all w-full">
                  استكمال القراءة <ArrowRight className="w-4 h-4 md:w-5 md:h-5 -scale-x-100 text-zinc-400 group-hover:text-black transition-colors" />
                </div>
              )}
            </button>
          </div>
        </section>

        {/* Library Navigation */}
        <section className="space-y-8 md:space-y-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between text-right gap-4">
            <h3 className="text-2xl md:text-3xl font-serif text-black font-medium">أقسام المكتبة</h3>
            <div className="h-px flex-1 bg-zinc-200/60 mx-0 md:mx-8 w-full md:w-auto"></div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 lg:gap-6 relative z-10">
            {categoriesWithQuestions.map((category: any) => {
              const count = questions.filter(q => 
                q.categoryId === category.id || 
                q.categorySlug === category.id ||
                q.category === category.title ||
                (q.category && q.category.replace(/\s+/g, '-').toLowerCase() === category.id)
              ).length;
              
              if (count === 0 && !CATEGORIES.find(c => c.id === category.id)) return null;

              return (
                <button 
                  key={category.id}
                  onClick={() => onCategory(category.id)}
                  className="group bg-white border border-zinc-200/60 rounded-[20px] md:rounded-[28px] p-3.5 md:p-6 text-right hover:border-[#5A5A40] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all flex flex-col min-h-[132px] md:min-h-[190px] justify-between relative overflow-hidden cursor-pointer active:scale-95 z-50 pointer-events-auto"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 rounded-full blur-2xl group-hover:bg-[#F5F5F0] transition-colors translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                  <div className="relative z-10 w-full text-right">
                    <h4 className="font-serif text-base md:text-2xl text-black group-hover:text-[#5A5A40] transition-colors mb-2 md:mb-4">{category.title}</h4>
                    <p className="text-zinc-500 text-[11px] md:text-sm leading-relaxed opacity-100 md:opacity-0 md:group-hover:opacity-100 line-clamp-2 transition-opacity duration-300">
                      تصفح دراسات الحالات، القرارات الصعبة، والحلول الإستراتيجية.
                    </p>
                  </div>
                  <div className="relative z-10 flex items-center justify-between w-full mt-auto">
                    <span className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      {count > 0 ? `${count} حالة مؤكدة` : "قيد الإعداد"}
                    </span>
                    <div className="w-8 h-8 md:w-11 md:h-11 rounded-full border border-zinc-100 bg-white flex items-center justify-center group-hover:bg-[#5A5A40] group-hover:text-white group-hover:border-[#5A5A40] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5 -scale-x-100" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Global Footer / Disclaimer */}
        <footer className="pt-16 md:pt-24 border-t border-zinc-200/60 text-center space-y-6">
          <p className="text-zinc-400 text-xs md:text-sm font-medium max-w-xl mx-auto leading-relaxed px-4">
            تبيان: نظام متكامل للذكاء وتحليل المواقف. نؤمن أن الحل السليم يبدأ بفهم السياق بوضوح والتعامل معه بحكمة.
            <br/>
            <span className="text-[10px] md:text-xs mt-4 block opacity-70 italic">إخلاء مسؤولية: الإرشادات عامة ولا تغني عن نصيحة المختصين في الحالات الطبية أو النفسية الخاصة.</span>
          </p>
        </footer>

      </div>
    </div>
  );
}

