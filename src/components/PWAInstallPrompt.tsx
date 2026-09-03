import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Share } from 'lucide-react';
import { TebyanTooltip } from './TebyanTooltip';

let deferredPromptGlobal: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPromptGlobal = e;
});

const isStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
};

const isIOsDevice = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// ============================================
// The Header Icon (Always visible if not installed)
// ============================================
export const PWAHeaderButton = ({ variant = 'icon', language = 'ar' }: { variant?: 'icon' | 'menu'; language?: 'ar' | 'en' }) => {
  const [showIcon, setShowIcon] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    if (!isStandaloneMode()) {
       setShowIcon(true);
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOsDevice()) {
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPromptGlobal) {
      deferredPromptGlobal.prompt();
      const { outcome } = await deferredPromptGlobal.userChoice;
      if (outcome === 'accepted') {
        setShowIcon(false); // Hide on successful install
      }
      deferredPromptGlobal = null;
    } else {
        alert("يرجى تثبيت التطبيق من قائمة المتصفح (⋮).");
    }
  };

  if (!showIcon) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={variant === 'menu'
          ? 'w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-right text-zinc-600 hover:bg-zinc-100 active:bg-zinc-100 transition-colors'
          : 'flex items-center justify-center w-10 h-10 md:w-11 md:h-11 mx-1 md:mx-2 rounded-xl bg-white/85 text-[#7D689E] shadow-[0_10px_30px_rgba(103,88,132,0.10)] hover:scale-105 active:scale-95 transition-all border border-[#C9BEDF]/40 backdrop-blur-xl'}
        title={language === 'ar' ? 'تثبيت التطبيق' : 'Install app'}
        aria-label={language === 'ar' ? 'تثبيت التطبيق' : 'Install app'}
      >
        <Download className="w-5 h-5 text-[#8E7AAE] shrink-0" />
        {variant === 'menu' && <span>{language === 'ar' ? 'ثبّت تبيان على جهازك' : 'Install Tebyan on your device'}</span>}
      </button>

      {/* iOS Instructions Modal */}
      <AnimatePresence>
        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
            className="flex flex-col items-center justify-end md:justify-center p-4 bg-[#F7F3EE]/70"
            onClick={() => setShowIOSInstructions(false)}
            dir="rtl"
          >
            <motion.div 
               initial={{ y: 100, scale: 0.95 }}
               animate={{ y: 0, scale: 1 }}
               exit={{ y: 100, scale: 0.95 }}
               className="bg-white/95 backdrop-blur-xl border border-zinc-200/60 p-6 rounded-3xl shadow-2xl relative overflow-hidden w-full max-w-sm mb-4 md:mb-0"
               onClick={(e) => e.stopPropagation()}
            >
               <button onClick={() => setShowIOSInstructions(false)} className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-black bg-zinc-50 rounded-full transition-colors">
                 <X className="w-4 h-4" />
               </button>
               <h3 className="font-black text-zinc-900 text-xl mb-6 pr-2 pt-2 tracking-tight">تثبيت التطبيق على آيفون</h3>
               <ol className="space-y-5 px-2">
                 <li className="flex items-start gap-4 text-sm font-medium text-zinc-700">
                   <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 font-bold text-zinc-500 shadow-inner">1</div>
                   <span className="leading-relaxed mt-1">اضغط على زر المشاركة <Share className="w-4 h-4 inline mx-1 text-blue-500 drop-shadow-sm" /> في أسفل الشاشة الخاصة بمتصفح سفاري</span>
                 </li>
                 <li className="flex items-start gap-4 text-sm font-medium text-zinc-700">
                   <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 font-bold text-zinc-500 shadow-inner">2</div>
                   <span className="leading-relaxed mt-1">اختر "إضافة إلى الشاشة الرئيسية" <br/><span className="text-xs text-zinc-400 font-mono mt-1 block">(Add to Home Screen)</span></span>
                 </li>
                 <li className="flex items-start gap-4 text-sm font-medium text-zinc-700">
                   <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 font-bold text-zinc-500 shadow-inner">3</div>
                   <span className="leading-relaxed mt-1">اضغط "إضافة" (Add) في الزاوية العلوية لتأكيد التثبيت</span>
                 </li>
               </ol>
               <button 
                  onClick={() => setShowIOSInstructions(false)}
                  className="w-full mt-8 p-4 rounded-2xl bg-[#8E7AAE] text-white font-bold text-sm hover:bg-[#806D9F] transition-colors shadow-lg shadow-[#8E7AAE]/20"
                >
                  حسناً، فهمت
                </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Banner retired — install lives behind the header icon only.
export const PWAInstallPrompt = () => null;
