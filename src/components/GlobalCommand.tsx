import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, X, BrainCircuit, Loader2, ArrowLeft, Navigation, Eye, Zap, Wind } from 'lucide-react';
import { cn } from '../lib/utils';
import { universalOracle } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { useCognitiveMode } from '../contexts/CognitiveModeContext';
import { useAcoustics } from '../hooks/useAcoustics';
import { TebyanTooltip } from './TebyanTooltip';

export const GlobalCommand = ({ isOpen, onClose, language, tabs, handleTabChange }: { isOpen: boolean, onClose: () => void, language: string, tabs: any[], handleTabChange: (tab: string) => void }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mode, setMode } = useCognitiveMode();

  useEffect(() => {
    const handleClose = () => onClose();
    window.addEventListener('close_overlays', handleClose);
    return () => window.removeEventListener('close_overlays', handleClose);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAction = (action: () => void) => {
     action();
     onClose();
  };

  const filteredTabs = query ? tabs.filter(t => !t.hidden && t.label.toLowerCase().includes(query.toLowerCase())) : [];

  const { playSound } = useAcoustics();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    // Omnicommand Intent Detection
    const qLower = query.toLowerCase();
    
    // Simulation intent
    if (qLower.includes('حاكي') || qLower.includes('محاكاة') || qLower.includes('simulate')) {
        playSound('chime');
        sessionStorage.setItem('tebyan_current_query', query);
        handleTabChange('simulation');
        onClose();
        return;
    }

    // Time Machine intent
    if (qLower.includes('زمن') || qLower.includes('استشرف') || qLower.includes('time machine') || qLower.includes('مستقبل')) {
        playSound('chime');
        sessionStorage.setItem('tebyan_time_query', query);
        handleTabChange('time-machine');
        onClose();
        return;
    }

    // Mindmap intent
    if (qLower.includes('خريطة') || qLower.includes('mindmap') || qLower.includes('تفكيك')) {
        playSound('chime');
        sessionStorage.setItem('tebyan_mindmap_query', query);
        handleTabChange('mindmap');
        onClose();
        return;
    }

    // Oracle intent
    if (qLower.includes('أوراكل') || qLower.includes('oracle')) {
        playSound('chime');
        sessionStorage.setItem('tebyan_current_query', query);
        handleTabChange('gateway');
        onClose();
        return;
    }

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
                title={language === 'ar' ? 'إغلاق' : 'Close'}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black transition-colors shrink-0 relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </form>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-[300px] p-6 md:p-10 relative">
              {!result && !isSearching && !query && (
                <div className="space-y-8">
                  {/* Cognitive Modes */}
                  <div>
                     <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                       {language === 'ar' ? 'أنماط الإدراك' : 'Cognitive Modes'}
                     </h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button onClick={() => handleAction(() => setMode('default'))} className={cn("p-4 rounded-2xl border text-right focus:outline-none transition-all", mode === 'default' ? 'border-black bg-black text-white' : 'border-zinc-200 bg-white hover:bg-zinc-50')}>
                          <Sparkles className={cn("w-5 h-5 mb-2", mode === 'default' ? 'text-white' : 'text-zinc-500')} />
                          <div className="font-bold">{language === 'ar' ? 'الافتراضي' : 'Default'}</div>
                        </button>
                        <button onClick={() => handleAction(() => setMode('focus'))} className={cn("p-4 rounded-2xl border text-right focus:outline-none transition-all", mode === 'focus' ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-zinc-200 bg-white hover:bg-zinc-50')}>
                          <Eye className={cn("w-5 h-5 mb-2", mode === 'focus' ? 'text-white' : 'text-zinc-500')} />
                          <div className="font-bold">{language === 'ar' ? 'التركيز' : 'Focus'}</div>
                        </button>
                        <button onClick={() => handleAction(() => setMode('executive'))} className={cn("p-4 rounded-2xl border text-right focus:outline-none transition-all", mode === 'executive' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-zinc-200 bg-white hover:bg-zinc-50')}>
                          <Zap className={cn("w-5 h-5 mb-2", mode === 'executive' ? 'text-white' : 'text-zinc-500')} />
                          <div className="font-bold">{language === 'ar' ? 'التنفيذي' : 'Executive'}</div>
                        </button>
                        <button onClick={() => handleAction(() => setMode('genesis'))} className={cn("p-4 rounded-2xl border text-right focus:outline-none transition-all", mode === 'genesis' ? 'border-amber-500 bg-amber-500 text-white' : 'border-zinc-200 bg-white hover:bg-zinc-50')}>
                          <Wind className={cn("w-5 h-5 mb-2", mode === 'genesis' ? 'text-white' : 'text-zinc-500')} />
                          <div className="font-bold">{language === 'ar' ? 'الاستكشاف' : 'Genesis'}</div>
                        </button>
                     </div>
                  </div>

                  {/* Quick Navigation */}
                  <div>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                       {language === 'ar' ? 'التنقل السريع' : 'Quick Navigation'}
                     </h3>
                     <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                        {tabs.filter(t => !t.hidden).map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => handleAction(() => handleTabChange(tab.id))}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 transition-colors text-right"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                               <tab.icon className="w-4 h-4 text-zinc-500" />
                            </div>
                            <span className="font-semibold text-zinc-700">{tab.label}</span>
                          </button>
                        ))}
                     </div>
                  </div>
                </div>
              )}

              {!result && !isSearching && query && (
                <div className="space-y-6">
                  {filteredTabs.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                         {language === 'ar' ? 'التنقل' : 'Navigation'}
                       </h3>
                       <div className="space-y-1">
                          {filteredTabs.map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => handleAction(() => handleTabChange(tab.id))}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 transition-colors text-right"
                            >
                               <Navigation className="w-4 h-4 text-zinc-400" />
                               <span className="font-bold">{tab.label}</span>
                            </button>
                          ))}
                       </div>
                    </div>
                  )}

                  <button 
                    onClick={handleSearch}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-black text-white hover:bg-zinc-800 transition-colors text-right"
                  >
                     <Sparkles className="w-5 h-5 text-indigo-400" />
                     <div className="flex-1">
                        <div className="font-bold text-lg">{language === 'ar' ? 'البحث عن' : 'Search for'} "{query}"</div>
                        <div className="text-sm text-zinc-400 opacity-80">{language === 'ar' ? 'البحث باستخدام الذكاء الكلي للتفاصيل...' : 'Use Omni-AI for deep insights...'}</div>
                     </div>
                     <kbd className="px-2 py-1 rounded bg-zinc-800 font-sans text-xs">Enter</kbd>
                  </button>
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
