import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import { useCognitiveMode } from '../contexts/CognitiveModeContext';

export const WhisperHint = ({ language, forceShow = false }: { language: string, forceShow?: boolean }) => {
  const [show, setShow] = useState(false);
  const [hint, setHint] = useState('');
  const { mode } = useCognitiveMode();

  useEffect(() => {
    if (forceShow) {
       const hints = language === 'ar' ? [
          'المعلومات هنا دسمة وتستحق التأمل.',
          'تلميح: اضغط على ⌘+K للبحث السريع والوصول المباشر.',
          'إذا فقدت مسارك، يمكنك العودة للصفحة الرئيسية في أي وقت.',
          'استوقفتك هذه الشاشة، يبدو أن بها تفاصيل تهمك.'
       ] : [
          'The information here is dense and worth reflecting on.',
          'Hint: Press Cmd+K for smart search and quick access.',
          'If you lose your track, you can return to the home page anytime.',
          'This screen paused you, seems it has details you care about.'
       ];
       setHint(hints[Math.floor(Math.random() * hints.length)]);
       setShow(true);
       return;
    }

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
        const rawHints = language === 'ar' ? [
          'أحياناً التوقف قليلاً يساعد في استيعاب المكتوب بشكل أعمق.',
          'لإجابة تحسم الحيرة، تجربة "قول فصل" قد تكون مفيدة.',
          'وضع التركيز يوفر بيئة قراءة خالية من المشتتات.',
          'الخريطة الذهنية قادرة على تبسيط الأفكار المعقدة.',
          'مكتبتك الخاصة تحفظ كل شيء وتنتظر عودتك لتنظيم أفكارك.',
          'هناك تفاصيل بين السطور تستحق القراءة المتأنية..',
          'هناك مقالات وحوارات سابقة قد تتقاطع مع اهتمامك الحالي..'
        ] : [
          'Sometimes a short pause helps in absorbing the text deeper.',
          'For a decisive answer, trying Qawl Fasl can be useful.',
          'Focus Mode provides a distraction-free reading environment.',
          'The Mind Map is capable of simplifying complex ideas.',
          'Your private library saves everything and awaits your return.',
          'There are details between the lines worth reading carefully..',
          'There are articles and past dialogues that intersect with your interest..'
        ];
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const hints = isMobile ? rawHints.filter(h => !h.includes('⌘') && !h.includes('Cmd')) : rawHints;
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
          className="fixed bottom-24 right-6 z-50 max-w-[280px]"
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
