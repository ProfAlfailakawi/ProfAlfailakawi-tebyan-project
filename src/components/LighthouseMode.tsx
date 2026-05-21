import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, EyeOff, Sparkles, Anchor } from 'lucide-react';
import { cn } from '../lib/utils';

interface LighthouseProps {
    idea: { text: string; author: string };
    onClose: () => void;
    language: 'ar' | 'en';
}

export const LighthouseMode = ({ idea, onClose, language }: LighthouseProps) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 overflow-hidden"
        >
            {/* Cinematic Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                        rotate: [0, 90, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity }}
                    className="absolute top-1/4 -right-1/4 w-[80vw] h-[80vw] bg-mood-primary rounded-full blur-[180px]"
                />
                <motion.div 
                    animate={{ 
                        scale: [1.2, 1, 1.2],
                        opacity: [0.1, 0.15, 0.1],
                        rotate: [0, -90, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, delay: 5 }}
                    className="absolute -bottom-1/4 -left-1/4 w-[70vw] h-[70vw] bg-mood-secondary rounded-full blur-[150px]"
                />
                
                {/* Particle Gathering Effect */}
                <AnimatePresence>
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={`p-${i}`}
                            initial={{ 
                                x: (Math.random() - 0.5) * 2000, 
                                y: (Math.random() - 0.5) * 2000,
                                opacity: 0,
                                scale: 0
                            }}
                            animate={{ 
                                x: 0, 
                                y: 0, 
                                opacity: [0, 0.4, 0],
                                scale: [0, 1, 0] 
                            }}
                            transition={{ 
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2
                            }}
                            className="absolute left-1/2 top-1/2 w-1 h-1 bg-white rounded-full blur-[1px]"
                        />
                    ))}
                </AnimatePresence>
            </div>

            <button 
                onClick={onClose}
                className="absolute top-8 right-8 z-50 text-white/40 hover:text-white transition-colors bg-white/5 p-4 rounded-full border border-white/10 hover:bg-white/10"
            >
                <X className="w-8 h-8" />
            </button>

            <div className="relative max-w-5xl w-full text-center space-y-24 px-6 mb-20 flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 80 }}
                    className="relative group"
                >
                    <div className="absolute inset-0 bg-mood-primary/30 rounded-full blur-3xl group-hover:bg-mood-primary/40 transition-all duration-1000 animate-pulse" />
                    <div className="relative w-24 h-24 bg-mood-primary/10 rounded-full flex items-center justify-center text-mood-primary border border-mood-primary/20 backdrop-blur-2xl shadow-[0_0_50px_rgba(var(--mood-primary),0.3)]">
                        <Anchor className="w-10 h-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 60, opacity: 0, filter: 'blur(20px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ delay: 0.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-4xl relative"
                >
                    {/* Echo Trace layer */}
                    <motion.h2 
                        animate={{ 
                            opacity: [0, 0.15, 0],
                            scale: [1, 1.05, 1.1],
                            y: [0, -5, -10]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
                        className={cn(
                            "absolute inset-0 text-white pointer-events-none select-none blur-[4px]",
                            language === 'ar' ? 'font-serif leading-[1.3]' : 'font-serif italic'
                        )}
                        style={{ fontSize: 'inherit' }}
                    >
                        {idea.text}
                    </motion.h2>

                    <motion.h2 
                        animate={{ 
                            opacity: [0.9, 1, 0.9],
                            scale: [1, 1.02, 1],
                            textShadow: [
                                "0 0 20px rgba(var(--mood-primary),0)",
                                "0 0 40px rgba(var(--mood-primary),0.3)",
                                "0 0 20px rgba(var(--mood-primary),0)"
                            ]
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className={cn(
                            "relative text-5xl md:text-7xl lg:text-8xl text-white font-medium leading-[1.1] tracking-tighter selection:bg-mood-primary selection:text-white",
                            language === 'ar' ? 'font-serif leading-[1.3]' : 'font-serif italic text-7xl md:text-8xl lg:text-9xl'
                        )}
                    >
                        {idea.text}
                    </motion.h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 1 }}
                    className="flex flex-col items-center gap-12"
                >
                    <div className="flex items-center gap-10">
                        <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-mood-primary/40 to-transparent" />
                        <p className="text-white/60 font-black text-[10px] md:text-xs uppercase tracking-[0.8em] flex items-center gap-2">
                            {idea.author}
                        </p>
                        <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-mood-primary/40 to-transparent" />
                    </div>
                    
                    <div className="group flex flex-col items-center gap-5">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-4 px-10 py-5 bg-white/[0.02] rounded-[2rem] border border-white/10 backdrop-blur-3xl transition-all hover:bg-mood-primary/10 hover:border-mood-primary/30 cursor-default shadow-2xl"
                        >
                            <Sparkles className="w-5 h-5 text-mood-primary group-hover:rotate-12 transition-transform" />
                            <span className="text-xs text-white/40 font-black uppercase tracking-[0.5em] transition-colors group-hover:text-mood-primary">
                                {language === 'ar' ? 'منارة التبيان' : 'TABYAN LIGHTHOUSE'}
                            </span>
                        </motion.div>
                        <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.3em] opacity-60 group-hover:opacity-100 transition-opacity">
                            {language === 'ar' ? 'تأمل في لجة الفكر • التركيز العميق' : 'DEEP CONTEMPLATION • FOCUS MODE'}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-64 h-[2px] bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="h-full bg-mood-primary w-1/2 shadow-[0_0_15px_rgba(var(--mood-primary),0.5)]"
                />
            </div>
        </motion.div>
    );
};
