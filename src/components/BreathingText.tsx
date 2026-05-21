import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { universalOracle } from '../services/gemini';
import { Brain, Sparkles, Loader2 } from 'lucide-react';

export const BreathingText = ({ 
  text, 
  className, 
  language = 'ar' 
}: { 
  text: string; 
  className?: string;
  language?: 'ar' | 'en';
}) => {
  const [isDwelling, setIsDwelling] = useState(false);
  const [hasDwelt, setHasDwelt] = useState(false);
  const [roots, setRoots] = useState<string | null>(null);
  const [isLoadingRoots, setIsLoadingRoots] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [hasSharedConsciousness, setHasSharedConsciousness] = useState(false);

  useEffect(() => {
    // Random chance (20%) to show golden glow of shared consciousness
    setHasSharedConsciousness(Math.random() < 0.2);
  }, []);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsDwelling(true);
      if (!hasDwelt) {
          fetchRoots();
          setHasDwelt(true);
      }
    }, 4000); // 4 seconds of dwelling
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsDwelling(false);
  };

  const fetchRoots = async () => {
    setIsLoadingRoots(true);
    try {
        const rootNote = await universalOracle(
            `استخرج أو ابتكر "جذراً فلسفياً" أو حكمة أو إضاءة عميقة من بين سطور هذا النص في جملة واحدة فقط: "${text}". اللغة: ${language === 'ar' ? 'عربي' : 'انجليزي'}`,
            'Deep Root Analyst',
            language
        );
        setRoots(rootNote);
    } catch {
        // fail silently
    } finally {
        setIsLoadingRoots(false);
    }
  };

  return (
    <motion.div 
      className={cn(
        "relative rounded-[24px] p-6 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isDwelling ? "my-8 bg-zinc-50 border border-zinc-100/50 shadow-inner" : "my-0 bg-transparent border-transparent",
        hasSharedConsciousness && !isDwelling ? "shadow-[0_0_15px_rgba(234,179,8,0.1)] border border-amber-500/10 bg-amber-500/5" : ""
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{
          letterSpacing: isDwelling ? "0.02em" : "0em",
          lineHeight: isDwelling ? "2.2" : "1.85"
      }}
    >
      {/* Shared Consciousness subtly glowing */}
      {hasSharedConsciousness && !isDwelling && (
          <div className="absolute top-2 right-4 flex items-center md:-right-6 md:top-1/2 md:-translate-y-1/2 opacity-70">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></div>
              <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              <span className="hidden md:inline-block mr-2 text-[10px] text-amber-500/60 font-bold whitespace-nowrap">عقل آخر يتأمل..</span>
          </div>
      )}

      <div className={cn("relative z-10 transition-colors duration-1000", isDwelling ? "text-zinc-900" : "text-inherit", className)}>
         {text}
      </div>

      <AnimatePresence>
          {isDwelling && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="overflow-hidden mt-6 pt-6 border-t border-zinc-200/50"
              >
                  {isLoadingRoots ? (
                      <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin" /> تنمو الجذور العميقة...
                      </div>
                  ) : roots ? (
                      <div className="flex gap-4 items-start">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                              <span className="text-indigo-400 font-serif rtl:font-sans">⚜️</span>
                          </div>
                          <p className="text-zinc-600 italic font-medium leading-relaxed font-serif rtl:font-sans">
                              {roots.replace(/[*#]/g, '')}
                          </p>
                      </div>
                  ) : null}
              </motion.div>
          )}
      </AnimatePresence>
    </motion.div>
  );
};
