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
}> = ({ title, description, icon: Icon, language, onBack, onClose }) => {
    const handleBack = onBack || onClose;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="tebyan-tab-header relative flex flex-col gap-4 md:gap-6 mb-6 md:mb-8 p-5 md:p-7 rounded-[26px] md:rounded-[34px] bg-white/76 backdrop-blur-xl border border-[#8E7AAE]/12 shadow-[0_18px_55px_rgba(24,34,49,0.055)] overflow-hidden"
        >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#8E7AAE]/20 to-transparent" />

            {handleBack && (
                <button
                    type="button"
                    onClick={handleBack}
                    aria-label={language === 'ar' ? 'رجوع' : 'Back'}
                    title={language === 'ar' ? 'رجوع' : 'Back'}
                    className="tebyan-page-back fixed top-[78px] start-4 md:top-[84px] md:start-6 z-[60] w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white/92 hover:bg-white text-[#64788D] hover:text-[#6E5F8E] border border-[#8FA9C7]/18 shadow-[0_10px_30px_rgba(24,34,49,0.10)] backdrop-blur-xl transition-all active:scale-95 flex items-center justify-center"
                >
                    <ArrowLeft className={language === 'ar' ? 'w-5 h-5' : 'w-5 h-5 rotate-180'} />
                </button>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pe-0 ps-0 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-[#8E7AAE]/12 text-[#6E5F8E] border border-[#8E7AAE]/18 rounded-[18px] md:rounded-[24px] flex items-center justify-center shrink-0 shadow-lg">
                        <Icon className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-2xl md:text-3xl lg:text-[2.15rem] font-black text-[#182231] tracking-tighter leading-tight break-words">
                            {language === 'ar' ? title.ar : title.en}
                        </h2>
                        <p className="text-sm md:text-base text-[#64788D] font-semibold mt-1 tracking-tight leading-relaxed max-w-2xl break-words">
                            {language === 'ar' ? description.ar : description.en}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
