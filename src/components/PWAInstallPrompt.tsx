import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Share, Compass } from 'lucide-react';
import { cn } from '../lib/utils';

export const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if user has dismissed previously
    const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (hasDismissed) return;

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Check if on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Check iOS
    const _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(_isIOS);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If it's iOS, we show it after a small delay (iOS doesn't support beforeinstallprompt)
    if (_isIOS && !hasDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
        // Fallback for android if deferredPrompt is missing but clicked somehow
        alert("يرجى تثبيت التطبيق من قائمة المتصفح (⋮).");
    }
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95, transition: { duration: 0.2 } }}
        className="fixed bottom-4 left-4 right-4 z-50 md:hidden"
        dir="rtl"
      >
        <div className="bg-white/95 backdrop-blur-xl border border-zinc-200/60 p-4 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden">
          {showIOSInstructions ? (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="space-y-4"
            >
               <button onClick={() => setShowIOSInstructions(false)} className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-black bg-zinc-50 rounded-full">
                 <X className="w-4 h-4" />
               </button>
               <h3 className="font-bold text-zinc-900 text-lg mb-4 pr-2 pt-2">لتثبيت التطبيق على آيفون:</h3>
               <ol className="space-y-4 px-2">
                 <li className="flex items-center gap-4 text-sm font-medium text-zinc-700">
                   <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 font-bold text-zinc-500">1</div>
                   <span>اضغط زر المشاركة <Share className="w-4 h-4 inline mx-1 text-blue-500" /> أسفل الشاشة</span>
                 </li>
                 <li className="flex items-center gap-4 text-sm font-medium text-zinc-700">
                   <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 font-bold text-zinc-500">2</div>
                   <span>اختر "إضافة إلى الشاشة الرئيسية" <br/><span className="text-xs text-zinc-400 font-mono mt-1 block">(Add to Home Screen)</span></span>
                 </li>
                 <li className="flex items-center gap-4 text-sm font-medium text-zinc-700">
                   <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 font-bold text-zinc-500">3</div>
                   <span>اضغط "إضافة" (Add) في الزاوية العلوية</span>
                 </li>
               </ol>
               <button 
                  onClick={handleDismiss}
                  className="w-full mt-6 p-4 rounded-2xl bg-zinc-100 text-zinc-800 font-bold text-sm hover:bg-zinc-200 transition-colors"
                >
                  حسناً، فهمت
                </button>
            </motion.div>
          ) : (
            <>
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-black p-[2px] shadow-lg shrink-0">
                   <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center">
                     <span className="text-white font-black text-2xl tracking-tighter">ت</span>
                   </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-zinc-900 text-base leading-tight mb-1">ثبّت تطبيق تبيان</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed max-w-[200px]">للوصول السريع وتجربة أسهل من الشاشة الرئيسية</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center gap-3 mt-5">
                <button 
                  onClick={handleInstallClick}
                  className="flex-1 bg-black text-white px-4 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  تثبيت التطبيق
                </button>
                <button 
                  onClick={handleDismiss}
                  className="px-6 py-3.5 rounded-2xl text-zinc-500 text-sm font-bold hover:bg-zinc-100 transition-colors"
                >
                  لاحقاً
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
