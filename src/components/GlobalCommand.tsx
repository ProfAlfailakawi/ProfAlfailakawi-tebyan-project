import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, X, BrainCircuit, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { universalOracle } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

export const GlobalCommand = ({ isOpen, onClose, language }: { isOpen: boolean, onClose: () => void, language: string }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle Cmd+K / Ctrl+K mapping logic is handled in App.tsx
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setResult(null);

    try {
      // Re-using the universalOracle to act as the "Global Brain"
      const res = await universalOracle(
        `قم بإجراء بحث تسونامي (Tsunami Search) شامل وعميق جداً حول: "${query}". 
         استخدم أسلوب الذكاء الكلي، لخص الفكرة في 3 نقاط خارقة والمراجع.
         يرجى تقديم الإجابة في نقاط قصيرة ومباشرة وفقرات صغيرة جداً لتسهيل القراءة على الهاتف.`, 
        'Global Brain', 
        language
      );
      setResult(res);
    } catch (error) {
      console.error(error);
      setResult('حدث خطأ أثناء الاتصال بالذكاء الكلي. حاول مرة أخرى.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-900/60 transition-all font-sans"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-3xl bg-white/90 backdrop-blur-3xl rounded-[32px] shadow-[0_32px_80px_rgba(0,0,0,0.2)] border border-white/40 overflow-hidden relative flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Input */}
            <form onSubmit={handleSearch} className="relative flex items-center p-4 md:p-6 border-b border-zinc-200/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full"></div>
              
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white shrink-0 shadow-lg relative z-10">
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-white" />}
              </div>
              
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={language === 'ar' ? 'البحث الذكي (تسونامي المعرفة)...' : 'Smart Search (Knowledge Tsunami)...'}
                className="flex-1 bg-transparent border-none text-xl md:text-3xl font-black text-black placeholder:text-zinc-300 focus:outline-none focus:ring-0 px-4 md:px-6 relative z-10 w-full"
              />

              <button 
                type="button"
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black transition-colors shrink-0 relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </form>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-[300px] p-6 md:p-10 relative">
              {!result && !isSearching && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-60">
                  <BrainCircuit className="w-16 h-16 text-zinc-300 mb-6" />
                  <h3 className="text-xl font-bold text-zinc-500 mb-2">
                    {language === 'ar' ? 'اسأل الذكاء الكلي' : 'Ask the Omni-Intelligence'}
                  </h3>
                  <p className="text-zinc-400 max-w-sm">
                    {language === 'ar' 
                      ? 'يمكنك البحث عن أي مفهوم في النظام، وسيقوم بتوليد إجابة لحظية مجمعة من جميع النماذج.'
                      : 'Search for any concept in the system, and it will generate an instant synthesized answer.'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-8 w-full">
                     {['الذكاء الاصطناعي في التعليم', 'نظريات التعلم الحديثة', 'تصميم المناهج'].map(suggestion => (
                       <button 
                         key={suggestion}
                         onClick={() => setQuery(suggestion)}
                         className="px-4 py-2 rounded-full border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-black hover:text-white transition-colors"
                       >
                         {suggestion}
                       </button>
                     ))}
                  </div>
                </div>
              )}

              {isSearching && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-zinc-100 rounded-full"></div>
                      <div className="w-24 h-24 border-4 border-black rounded-full border-t-transparent animate-spin absolute inset-0"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                         <Sparkles className="w-8 h-8 text-black animate-pulse" />
                      </div>
                    </div>
                    <p className="mt-6 text-zinc-500 font-bold animate-pulse">
                      {language === 'ar' ? 'جاري تجميع المعرفة...' : 'Synthesizing knowledge...'}
                    </p>
                 </div>
              )}

              {result && !isSearching && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="markdown-body"
                >
                  <ReactMarkdown>{result}</ReactMarkdown>
                </motion.div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-zinc-200/50 bg-zinc-50/50 flex items-center justify-between text-xs font-medium text-zinc-400">
               <div className="flex items-center gap-2">
                 <kbd className="px-2 py-1 rounded bg-zinc-200/50 font-sans">Esc</kbd>
                 <span>{language === 'ar' ? 'للخروج' : 'to close'}</span>
               </div>
               <div className="flex items-center gap-2">
                 <span>{language === 'ar' ? 'الذكاء الكلي المدمج' : 'Integrated Omni-AI'}</span>
                 <Sparkles className="w-3 h-3" />
               </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
