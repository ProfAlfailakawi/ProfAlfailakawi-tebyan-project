import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, BookOpen, Compass, Network, Sparkles, X } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { cn } from '../lib/utils';
import { useGamification } from '../hooks/useGamification';

export const OnboardingTour = ({ language }: { language: 'ar' | 'en' }) => {
  const { user } = useAuth();
  const { state: gamificationState } = useGamification();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  const tourKey = user ? `tebyan_onboarding_seen_v3_${user.uid}` : 'tebyan_onboarding_seen_v3_guest';

  const openTour = (force = false) => {
    setStep(0);
    setIsOpen(true);
    if (!force) {
      localStorage.setItem(tourKey, 'true');
      localStorage.setItem('tebyan_onboarding_seen_v3', 'true');
    }
  };

  useEffect(() => {
    const hasSeen = localStorage.getItem(tourKey) || localStorage.getItem('tebyan_onboarding_seen_v3');
    // Suppress automatic onboarding for users with level 3+ who are already advanced users
    if (!hasSeen && gamificationState.level < 3) {
      const timer = setTimeout(() => openTour(false), 1600);
      return () => clearTimeout(timer);
    }
  }, [tourKey, gamificationState.level]);

  useEffect(() => {
    const handler = () => openTour(true);
    window.addEventListener('tebyan_open_onboarding', handler);
    return () => window.removeEventListener('tebyan_open_onboarding', handler);
  }, []);

  const closeTour = () => {
    localStorage.setItem(tourKey, 'true');
    localStorage.setItem('tebyan_onboarding_seen_v3', 'true');
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeTour();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, tourKey]);

  const steps = language === 'ar' ? [
    {
      icon: BookOpen,
      eyebrow: 'البداية',
      title: 'اسأل تبيان كما تسأل إنساناً حكيماً',
      body: 'اكتب موقفك أو فكرتك بكلماتك الطبيعية، وتبيان يحوّلها إلى مسار فهم واضح بدل أن يتركك أمام أدوات كثيرة.',
      action: 'اكتب سؤالك الأول'
    },
    {
      icon: Compass,
      eyebrow: 'النية',
      title: 'اختر مقصدك لا اسم الأداة',
      body: 'افهم، احسم، أو دع تبيان يقترح المسار الأنسب. محرك النوايا يقرّب لك الطريق الصحيح دون زحمة.',
      action: 'تابع الرحلة'
    },
    {
      icon: Network,
      eyebrow: 'الذاكرة',
      title: 'كل فكرة تتحول إلى معرفة محفوظة',
      body: 'احفظ الأفكار، اربطها، وعد إليها من نسيج الأفكار وحسابك. تبيان ليس إجابة عابرة؛ إنه ذاكرة تفكير.',
      action: 'ابدأ الآن'
    }
  ] : [
    {
      icon: BookOpen,
      eyebrow: 'Start',
      title: 'Ask Tebyan like you would ask a wise person',
      body: 'Write your situation naturally. Tebyan turns it into a clear thinking path instead of overwhelming you with tools.',
      action: 'Write your first question'
    },
    {
      icon: Compass,
      eyebrow: 'Intent',
      title: 'Choose your intent, not the tool name',
      body: 'Understand, decide, or let Tebyan suggest the best path. The intent engine brings the right route closer.',
      action: 'Continue'
    },
    {
      icon: Network,
      eyebrow: 'Memory',
      title: 'Every idea becomes saved knowledge',
      body: 'Save, connect, and revisit your ideas through Thought Weave and your account. Tebyan is a thinking memory.',
      action: 'Start now'
    }
  ];

  const current = steps[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center bg-[#F7F3EE]/70 backdrop-blur-2xl p-4"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <motion.div
            initial={{ y: 28, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 28, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative w-full max-w-xl overflow-hidden rounded-[36px] border border-white/70 bg-white/85 shadow-[0_30px_90px_rgba(103,88,132,0.18)]"
          >
            <div className="pointer-events-none absolute -top-28 -left-20 h-64 w-64 rounded-full bg-[#C9BEDF]/35 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-[#B9D0E7]/35 blur-3xl" />

            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeTour();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeTour();
              }}
              className="absolute left-5 top-5 z-[60] rounded-full bg-white/80 p-2 text-slate-400 shadow-sm transition hover:bg-white hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8E7AAE]/30"
              aria-label={language === 'ar' ? 'إغلاق الدليل' : 'Close guide'}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-10 p-7 md:p-9 text-right">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      className={cn('h-2.5 rounded-full transition-all duration-500', i === step ? 'w-8 bg-[#8E7AAE]' : 'w-2.5 bg-slate-200')}
                    />
                  ))}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#8E7AAE]/15 bg-[#8E7AAE]/8 px-3 py-1.5 text-xs font-black text-[#7D689E]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {language === 'ar' ? 'دليل البداية' : 'Start guide'}
                </div>
              </div>

              <div className="mb-7 flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] border border-[#8E7AAE]/15 bg-[#F3EEF8] text-[#8E7AAE] shadow-inner">
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="mb-1 text-xs font-black tracking-[0.22em] text-[#8E7AAE]/70">{current.eyebrow}</p>
                  <h2 className="text-2xl md:text-3xl font-black leading-tight text-slate-900">{current.title}</h2>
                </div>
              </div>

              <p className="text-base md:text-lg font-bold leading-8 text-slate-600">{current.body}</p>

              <div className="mt-9 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <button onClick={closeTour} className="rounded-2xl px-5 py-3 text-sm font-black text-slate-400 transition hover:bg-slate-50 hover:text-slate-700">
                  {language === 'ar' ? 'تخطي' : 'Skip'}
                </button>
                <button
                  onClick={() => step < steps.length - 1 ? setStep(step + 1) : closeTour()}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#8E7AAE] px-6 py-3.5 text-sm font-black text-white shadow-[0_14px_30px_rgba(142,122,174,0.25)] transition hover:bg-[#806D9F] active:scale-[0.98]"
                >
                  {step < steps.length - 1 ? current.action : current.action}
                  <ArrowLeft className={cn('h-4 w-4', language !== 'ar' && 'rotate-180')} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
