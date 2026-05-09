import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Command, RefreshCw, Bookmark, BookmarkCheck, Sparkles } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';

const personas = [
  { id: 'parent', ar: 'الوالد/الوالدة', en: 'Parent/Guardian' },
  { id: 'expert', ar: 'مستشار/ة', en: 'Counselor' },
  { id: 'child', ar: 'طفل/ة', en: 'Child' },
  { id: 'student', ar: 'طالب/ة', en: 'Student' },
  { id: 'senior', ar: 'كبير/ة سن', en: 'Senior' },
  { id: 'government', ar: 'قائد/ة', en: 'Leader' }
];

export const OracleTab = React.memo(({ language, initialValue, onValueUsed, handleTabChange }: { language: 'ar' | 'en', initialValue?: string, onValueUsed?: () => void, handleTabChange: any }) => {
  const { preferences, addToLibrary, removeFromLibrary } = useUser();
  const [input, setInput] = React.useState('');
  const [oraclePersona, setOraclePersona] = React.useState('student');
  const [oracleResult, setOracleResult] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [suggestion, setSuggestion] = React.useState('');
  const [isSuggesting, setIsSuggesting] = React.useState(false);

  React.useEffect(() => {
    const fetchSuggestion = async () => {
      // Don't suggest for short inputs to save tokens/noise
      if (input.trim().split(/\s+/).length < 2) {
        setSuggestion('');
        return;
      }
      
      setIsSuggesting(true);
      try {
        const { generateSearchSuggestions } = await import('../../services/gemini');
        const res = await generateSearchSuggestions(input, language);
        setSuggestion(res);
      } catch (err) {
        console.error("Autocomplete error:", err);
      } finally {
        setIsSuggesting(false);
      }
    };

    const timer = setTimeout(() => {
      if (input.trim() && !isLoading) {
        fetchSuggestion();
      } else {
        setSuggestion('');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [input, language, isLoading]);

  React.useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
      // Auto-run if prompted from another tab
      setTimeout(() => {
        if (runOracleRef.current) runOracleRef.current();
      }, 300);
      if (onValueUsed) onValueUsed();
    }
  }, [initialValue]);

  const runOracleRef = React.useRef<() => void>();

  const handleRunOracle = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const { universalOracle } = await import('../../services/gemini');
      const promptInstructed = `${input}\n\nيرجى تقديم الإجابة في نقاط قصيرة ومباشرة وفقرات صغيرة جداً لتسهيل القراءة على الهاتف.`;
      const res = await universalOracle(promptInstructed, oraclePersona, language);
      setOracleResult(res || '');
    } catch (err: any) {
      setError(language === 'ar' 
        ? "المستشار يتأمل بعمق في سؤالك.. عاود الضغط ليصيغ لك حكمة." 
        : "The counselor is deeply reflecting.. please click again for wisdom.");
    } finally {
      setIsLoading(false);
    }
  };
  
  runOracleRef.current = handleRunOracle;

  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (oracleResult && input.trim() && runOracleRef.current) {
      runOracleRef.current();
    }
  }, [oraclePersona]);

  const handlePersonaChange = (id: string) => {
    setOraclePersona(id);
    setOracleResult('');
    setIsLoading(false);
    setError(null);
  };

  return (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 px-2">
    <TabHeader 
      icon={Command}
      title={{ ar: 'المستشار الكلي', en: 'Omni Counselor' }}
      description={{ 
          ar: 'استشارة شاملة وتحليل استباقي لمنظورك الشخصي.', 
          en: 'Total guidance and predictive analysis for your personal perspective.' 
      }}
      language={language}
      onBack={() => handleTabChange('discover', '')}
      onClose={() => handleTabChange('discover', '', true)}
    />
    <div className="bg-white rounded-[32px] p-8 border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-8">
      <div className="flex flex-wrap gap-3 items-center justify-center">
        {personas.map(p => (
          <button
            key={p.id} onClick={() => handlePersonaChange(p.id)}
            title={language === 'ar' ? `تغيير المنظور إلى ${p.ar}` : `Change perspective to ${p.en}`}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer border",
              oraclePersona === p.id 
                ? "bg-black text-white border-black shadow-[0_8px_30px_rgb(0,0,0,0.04)]" 
                : "bg-white text-zinc-600 border-zinc-200/80 hover:border-zinc-300 hover:text-black"
            )}
          >
            {language === 'ar' ? p.ar : p.en}
          </button>
        ))}
      </div>
      <div className="relative">
        <input 
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          className={cn(
            "w-full p-5 md:p-6 text-lg md:text-xl font-medium bg-zinc-50 placeholder:text-zinc-400 rounded-[16px] border-2 border-zinc-200/80 focus:border-black focus:ring-4 focus:ring-zinc-100 outline-none transition-all",
            language === 'ar' ? "pl-24 md:pl-32" : "pr-24 md:pr-32"
          )}
          placeholder={language === 'ar' ? "اسأل تبيان بأي لهجة..." : "Ask Tebyan..."}
        />
        
        {/* Smart Autocomplete Suggestion */}
        <AnimatePresence>
          {suggestion && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              className={cn(
                "absolute left-0 right-0 top-full mt-2 z-20 flex",
                language === 'ar' ? "justify-end" : "justify-start",
                "sm:justify-start md:px-0"
              )}
            >
              <button
                onClick={() => {
                  setInput(prev => prev.trim() + ' ' + suggestion);
                  setSuggestion('');
                }}
                className="bg-zinc-900 text-white px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium hover:bg-black transition-all flex items-center gap-2 md:gap-3 group shadow-xl max-w-[95%] md:max-w-[90%] active:scale-95 touch-manipulation border border-white/10"
              >
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
                </div>
                <div className="flex flex-col items-start overflow-hidden text-right">
                   <span className="text-[9px] md:text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-0.5 opacity-80">
                    {language === 'ar' ? 'اقتراح ذكي' : 'Smart Suggestion'}
                   </span>
                   <span className="line-clamp-1 text-right w-full truncate text-zinc-100">{suggestion}</span>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={handleRunOracle} 
          disabled={isLoading}
          title={language === 'ar' ? 'تشغيل البحث الذكي' : 'Run smart search'}
          className={cn(
            "absolute top-2 bottom-2 md:top-3 md:bottom-3 px-4 md:px-6 rounded-lg md:rounded-xl font-bold transition-all flex items-center justify-center gap-2",
            language === 'ar' ? "left-2 md:left-3" : "right-2 md:right-3",
            isLoading ? "bg-zinc-200 text-zinc-500 cursor-not-allowed" : "bg-black text-white hover:bg-zinc-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer"
          )}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              <span className="hidden md:inline">{language === 'ar' ? 'جاري...' : 'Thinking...'}</span>
            </>
          ) : (
            <span>{language === 'ar' ? 'تشغيل' : 'Run'}</span>
          )}
        </button>
      </div>
      {error && <div className="text-rose-500 font-semibold">{error}</div>}
      <div className="relative min-h-[100px]">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full bg-transparent rounded-[16px] flex flex-col items-center justify-center space-y-6 py-20 border border-zinc-200/80"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-zinc-200/80 rounded-full"></div>
              <RefreshCw className="w-16 h-16 text-black animate-spin absolute top-0 left-0" />
            </div>
            <div className="text-xl font-semibold text-zinc-600">
              {language === 'ar' ? 'جاري استحضار الإجابة...' : 'Summoning the answer...'}
            </div>
          </motion.div>
        ) : oracleResult && (
          <div className="space-y-4">
            <div className="markdown-body p-8 border border-zinc-200/80 rounded-[16px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
              <ReactMarkdown>{oracleResult}</ReactMarkdown>
            </div>
            {/* Fluid Bridges */}
            <div className="flex flex-wrap gap-2 mt-4">
                 <button onClick={() => { sessionStorage.setItem('tebyan_time_query', input); handleTabChange('time-machine'); }} className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2">
                     <Command className="w-4 h-4" />
                     {language === 'ar' ? 'خذ هذه الفكرة لآلة الزمن' : 'Take to Time Machine'}
                 </button>
                 <button onClick={() => { sessionStorage.setItem('tebyan_current_query', input); handleTabChange('simulation'); }} className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2">
                     <Command className="w-4 h-4" />
                     {language === 'ar' ? 'اختبرها في المحاكي' : 'Test in Simulator'}
                 </button>
                 <button onClick={() => { sessionStorage.setItem('tebyan_mindmap_query', input); handleTabChange('mindmap'); }} className="px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2">
                     <Command className="w-4 h-4" />
                     {language === 'ar' ? 'فككها في الخريطة الذهنية' : 'Breakdown in Mindmap'}
                 </button>
            </div>
            <div className="flex justify-end mt-4">
              <button 
                onClick={() => {
                  const item = { 
                    id: `oracle-${Date.now()}`, 
                    type: 'oracle', 
                    question: input,
                    content: oracleResult,
                    persona: oraclePersona
                  };
                  const isSaved = preferences.savedLibrary.some(s => s.content === oracleResult);
                  if (isSaved) {
                    const savedItem = preferences.savedLibrary.find(s => s.content === oracleResult);
                    if (savedItem) removeFromLibrary(savedItem);
                  } else {
                    addToLibrary(item, 'oracle');
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all",
                  preferences.savedLibrary.some(s => s.content === oracleResult)
                    ? "bg-black text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                )}
              >
                {preferences.savedLibrary.some(s => s.content === oracleResult) ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    <span>{language === 'ar' ? 'محفوظ' : 'Saved'}</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>{language === 'ar' ? 'إضافة للمكتبة' : 'Save to Library'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </motion.div>
)});

