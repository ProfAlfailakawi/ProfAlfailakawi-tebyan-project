import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import { useCognitiveMode } from '../contexts/CognitiveModeContext';

export const WhisperHint = ({ language }: { language: string }) => {
  const [show, setShow] = useState(false);
  const [hint, setHint] = useState('');
  const { mode } = useCognitiveMode();

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    
    // Only show hints in default mode to avoid distraction
    if (mode !== 'default') {
       setShow(false);
       return;
    }

    const resetIdleTimer = () => {
      setShow(false);
      clearTimeout(idleTimer);
      // If user is inactive for 10 seconds, show a whisper hint
      idleTimer = setTimeout(() => {
        const hints = language === 'ar' ? [
          'يبدو أنك تتأمل.. هل جربت الضغط على ⌘+K للبحث السريع؟',
          'هل تبحث عن إجابة حاسمة؟ اسأل "قول فصل".',
          'يمكن تجربة وضع التركيز لقراءة أعمق.',
          'الخريطة الذهنية قد تساعدك في ربط هذه الأفكار.'
        ] : [
          'Pondering? Try Cmd+K for smart search.',
          'Looking for a decisive answer? Try Qawl Fasl.',
          'Try Focus Mode for deep reading.',
          'The Mind Map might help you connect these ideas.'
        ];
        setHint(hints[Math.floor(Math.random() * hints.length)]);
        setShow(true);
      }, 15000); // 15 seconds of inactivity
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
    };
  }, [language, mode]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
          className="fixed bottom-24 right-8 z-40 max-w-[280px]"
        >
          <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/50 p-4 rounded-2xl shadow-2xl flex gap-3 items-start global-floating-buttons relative overflow-hidden text-sm">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 blur-xl rounded-full"></div>
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-zinc-600 leading-snug">{hint}</p>
            <button 
              onClick={() => setShow(false)}
              className="absolute top-2 left-2 p-1 text-zinc-400 hover:text-black rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
