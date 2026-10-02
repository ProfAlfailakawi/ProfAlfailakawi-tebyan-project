import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

export const TabHeader: React.FC<{
    title: { ar: string, en: string };
    description: { ar: string, en: string };
    icon: React.ElementType;
    language: string;
    onBack?: () => void;
    onClose?: () => void;
    /** When a parent heading already names this screen: keep the title for screen readers only. */
    hideTitleVisually?: boolean;
}> = ({ title, description, icon: Icon, language, onBack, onClose, hideTitleVisually }) => {
    const handleBack = onBack || onClose;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="tebyan-tab-header relative mb-4 md:mb-6 overflow-hidden"
        >
            {handleBack && (
                <button
                    type="button"
                    onClick={handleBack}
                    aria-label={language === 'ar' ? 'رجوع' : 'Back'}
                    title={language === 'ar' ? 'رجوع' : 'Back'}
                    className="tebyan-page-back fixed top-[calc(env(safe-area-inset-top)+12px)] left-3 md:top-5 md:left-5 z-[80] w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/94 hover:bg-white text-[#64788D] hover:text-[#6E5F8E] border border-[#8FA9C7]/18 shadow-[0_10px_28px_rgba(24,34,49,0.11)] backdrop-blur-xl transition-all active:scale-95 flex items-center justify-center"
                >
                    <ArrowLeft className={language === 'ar' ? 'w-5 h-5 rotate-180' : 'w-5 h-5'} />
                </button>
            )}

            <div className="tebyan-tab-header__row flex items-center gap-3 min-w-0">
                <div className="tebyan-tab-header__icon shrink-0 flex items-center justify-center text-[#6E5F8E] bg-[#8E7AAE]/10 border border-[#8E7AAE]/15">
                    <Icon strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className={`tebyan-tab-header__title font-extrabold text-[#182231] tracking-tight break-words${hideTitleVisually ? ' sr-only' : ''}`}>
                        {language === 'ar' ? title.ar : title.en}
                    </h2>
                    <p title={language === 'ar' ? description.ar : description.en} className="tebyan-tab-header__desc text-[#64788D] font-medium break-words">
                        {language === 'ar' ? description.ar : description.en}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
