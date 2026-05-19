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
export const PWAHeaderButton = () => {
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
        className="flex items-center justify-center gap-2 px-4 py-2 mx-1 md:mx-2 rounded-xl bg-white text-zinc-800 shadow-lg shadow-black/5 hover:scale-105 active:scale-95 transition-all border border-zinc-200/60"
        title="تثبيت التطبيق"
      >
        <Download className="w-4 h-4 text-zinc-700" />
        <span className="font-bold text-sm">تثبيت</span>
      </button>

      {/* iOS Instructions Modal */}
      <AnimatePresence>
        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
            className="flex flex-col items-center justify-end md:justify-center p-4 bg-zinc-900/60"
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
                  className="w-full mt-8 p-4 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors shadow-lg shadow-black/20"
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

// ============================================
// The Popup Banner (Shows ONCE per session)
// ============================================
export const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Delay slightly to not bombard immediately
    const timer = setTimeout(() => {
      if (isStandaloneMode()) return;
      if (sessionStorage.getItem('pwa_prompt_closed') === 'true') return;
      
      // If we are here, we can show the banner.
      setShowPrompt(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_closed', 'true');
  };

  const handleInstallClick = async () => {
    handleClose(); // mark as closed
    if (isIOsDevice()) {
       // On iOS, the prompt tells them to use Share. 
       // The header button will handle detailed instructions.
       alert('لتثبيت التطبيق على أيفون، اضغط زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"');
       return;
    }

    if (deferredPromptGlobal) {
      deferredPromptGlobal.prompt();
      const { outcome } = await deferredPromptGlobal.userChoice;
      deferredPromptGlobal = null;
    }
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
           initial={{ y: 150, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: 150, opacity: 0 }}
           className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-96 bg-white border border-zinc-200 p-5 rounded-3xl shadow-2xl z-50 flex items-start gap-4"
        >
          <div className="w-12 h-12 bg-black rounded-[14px] flex items-center justify-center shrink-0">
             <Download className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 pt-1 rtl" dir="rtl">
             <h4 className="font-bold text-zinc-900 mb-1">ثبّت التطبيق</h4>
             <p className="text-zinc-500 text-sm mb-3">لتجربة أسرع وأفضل، يمكنك تثبيت التطبيق على جهازك.</p>
             <div className="flex items-center gap-2">
                <button onClick={handleInstallClick} className="px-4 py-2 bg-black text-white rounded-xl text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all">تثبيت الآن</button>
                <button onClick={handleClose} className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors">لاحقاً</button>
             </div>
          </div>
          <button onClick={handleClose} className="p-1 -mr-2 text-zinc-400 hover:text-black transition-colors rounded-full left-0 mx-2 absolute top-4">
             <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
