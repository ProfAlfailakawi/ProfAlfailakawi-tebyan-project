import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Share, Compass } from 'lucide-react';
import { cn } from '../lib/utils';

export const PWAHeaderButton = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    
    // Check session storage
    const hasSeenInSession = sessionStorage.getItem('pwa_install_prompt_seen') === 'true';

    if (isStandalone || hasSeenInSession) return;

    // Check iOS
    const _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(_isIOS);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If it's iOS and not standalone, it's installable via Share -> Add to Home Screen
    if (_isIOS) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // Mark as seen in session
    sessionStorage.setItem('pwa_install_prompt_seen', 'true');
    setIsInstallable(false);

    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        // App installed, isStandalone will handle hiding it on next load
      }
      setDeferredPrompt(null);
    } else {
        // Fallback or Android showing instructions if needed
        alert("يرجى تثبيت التطبيق من قائمة المتصفح (⋮).");
    }
  };

  const closeInstructions = () => {
    setShowIOSInstructions(false);
    sessionStorage.setItem('pwa_install_prompt_seen', 'true');
    setIsInstallable(false);
  };

  if (!isInstallable) return null;

  return (
    <>
      <button 
        onClick={handleInstallClick}
        className="flex items-center justify-center p-2.5 mx-1 md:mx-2 rounded-xl bg-white text-zinc-800 shadow-lg shadow-black/5 hover:scale-105 active:scale-95 transition-all border border-zinc-200/60"
        title="تثبيت التطبيق"
      >
        <Download className="w-5 h-5 text-zinc-700" />
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
               <button onClick={closeInstructions} className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-black bg-zinc-50 rounded-full transition-colors">
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
                  onClick={closeInstructions}
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

// Deprecated old prompt export if previously used, replace it with null to avoid breaking imports
export const PWAInstallPrompt = () => null;
