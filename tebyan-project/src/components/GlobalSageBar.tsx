import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useGamificationContext } from './GamificationProvider';
import { badges, levels } from '../constants/gamification';

export const GlobalSageBar: React.FC<{ language: string }> = ({ language }) => {
    const { sageProgress } = useGamificationContext();
    
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-3 py-1 bg-zinc-100 rounded-full border border-zinc-200"
        >
            <div className="flex -space-x-1.5 rtl:space-x-reverse items-center">
                {badges.map(b => (
                    <div 
                        key={b.id}
                        className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center border border-white transition-all",
                            sageProgress.badges.includes(b.id) ? "bg-emerald-500 text-white scale-105 z-10" : "bg-zinc-200 text-zinc-400 opacity-50"
                        )}
                        title={language === 'ar' ? b.ar : b.en}
                    >
                        <b.icon className="w-3 h-3" />
                    </div>
                ))}
                <div className="ml-3 rtl:mr-3 px-2 py-0.5 bg-zinc-800 text-white rounded-full text-[9px] font-black tracking-widest hidden md:block">
                    {language === 'ar' ? (levels.find(l => l.id === sageProgress.level)?.ar) : (levels.find(l => l.id === sageProgress.level)?.en)}
                    <span className="opacity-50 mx-1">|</span>
                    {sageProgress.points} PT
                </div>
                <div className="ml-3 rtl:mr-3 px-2 py-0.5 bg-zinc-800 text-white rounded-full text-[9px] font-black tracking-widest md:hidden">
                    {sageProgress.points} PT
                </div>
            </div>
        </motion.div>
    );
};
