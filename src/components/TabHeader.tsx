import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, X } from 'lucide-react';

export const TabHeader: React.FC<{ 
    title: { ar: string, en: string }; 
    description: { ar: string, en: string }; 
    icon: React.ElementType;
    language: string;
    onBack?: () => void;
    onClose?: () => void;
}> = ({ title, description, icon: Icon, language, onBack, onClose }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 md:gap-6 mb-8 md:mb-10 p-6 md:p-8 rounded-[32px] md:rounded-[40px] bg-white/50 backdrop-blur-xl border border-zinc-100 shadow-xl relative overflow-hidden"
        >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-zinc-200 to-transparent" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-black text-white rounded-[20px] md:rounded-[24px] flex items-center justify-center shrink-0 shadow-lg">
                        <Icon className="w-7 h-7 md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-zinc-950 tracking-tighter">
                            {language === 'ar' ? title.ar : title.en}
                        </h2>
                        <p className="text-sm md:text-base lg:text-lg text-zinc-600 font-bold mt-1 tracking-tight">
                            {language === 'ar' ? description.ar : description.en}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                    {onBack && (
                        <button 
                            onClick={onBack}
                            className="flex-1 md:flex-none px-4 md:px-5 py-3 rounded-2xl bg-zinc-100 hover:bg-black hover:text-white text-zinc-600 font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {language === 'ar' ? 'رجوع' : 'Back'}
                        </button>
                    )}
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="flex-1 md:flex-none px-4 md:px-5 py-3 rounded-2xl bg-zinc-100 hover:bg-rose-600 hover:text-white text-zinc-600 font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
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
