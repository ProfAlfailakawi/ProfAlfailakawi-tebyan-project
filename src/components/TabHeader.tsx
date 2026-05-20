import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, X, Eye, Minimize2 } from 'lucide-react';

export const TabHeader: React.FC<{ 
    title: { ar: string, en: string }; 
    description: { ar: string, en: string }; 
    icon: React.ElementType;
    language: string;
    onBack?: () => void;
    onClose?: () => void;
}> = ({ title, description, icon: Icon, language, onBack, onClose }) => {
    const [isFocus, setIsFocus] = useState(false);

    useEffect(() => {
        document.body.classList.toggle('tebyan-focus-mode', isFocus);
        return () => document.body.classList.remove('tebyan-focus-mode');
    }, [isFocus]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 md:gap-6 mb-8 md:mb-10 p-6 md:p-8 rounded-[32px] md:rounded-[40px] bg-[#FAF9F6]/82 backdrop-blur-xl border border-[#8E7AAE]/14 shadow-[0_18px_55px_rgba(24,34,49,0.06)] relative overflow-hidden"
        >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#8E7AAE]/20 to-transparent" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-[#8E7AAE]/12 text-[#6E5F8E] border border-[#8E7AAE]/18 rounded-[20px] md:rounded-[24px] flex items-center justify-center shrink-0 shadow-lg">
                        <Icon className="w-7 h-7 md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#182231] tracking-tighter">
                            {language === 'ar' ? title.ar : title.en}
                        </h2>
                        <p className="text-sm md:text-base lg:text-lg text-[#64788D] font-bold mt-1 tracking-tight">
                            {language === 'ar' ? description.ar : description.en}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setIsFocus(v => !v)}
                        className="flex-1 md:flex-none px-4 md:px-5 py-3 rounded-2xl bg-white/70 hover:bg-[#8E7AAE]/10 hover:text-[#6E5F8E] text-[#64788D] border border-[#8FA9C7]/15 font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                        title={language === 'ar' ? 'وضع التركيز' : 'Focus mode'}
                    >
                        {isFocus ? <Minimize2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {isFocus ? (language === 'ar' ? 'خروج التركيز' : 'Exit focus') : (language === 'ar' ? 'وضع التركيز' : 'Focus')}
                    </button>
                    {onBack && (
                        <button 
                            onClick={onBack}
                            className="flex-1 md:flex-none px-4 md:px-5 py-3 rounded-2xl bg-white/70 hover:bg-[#8E7AAE]/10 hover:text-[#6E5F8E] text-[#64788D] border border-[#8FA9C7]/15 font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {language === 'ar' ? 'رجوع' : 'Back'}
                        </button>
                    )}
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="flex-1 md:flex-none px-4 md:px-5 py-3 rounded-2xl bg-white/70 hover:bg-rose-50 hover:text-rose-700 text-[#64788D] border border-[#8FA9C7]/15 font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <X className="w-4 h-4" />
                            {language === 'ar' ? 'خروج' : 'Exit'}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
