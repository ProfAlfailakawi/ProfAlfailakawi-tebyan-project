import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { GitCommit } from 'lucide-react';

export const IntellectualKintsugi = ({ oldText, newText, language }: { oldText: string, newText: string, language: 'ar' | 'en' }) => {
    return (
        <div className="relative p-6 md:p-8 rounded-[32px] border border-amber-900/30 bg-stone-900 overflow-hidden group">
            {/* Ambient Golden Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-600/10 pointer-events-none" />
            
            {/* SVG Cracks (Kintsugi veins) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity duration-1000 mix-blend-color-dodge" preserveAspectRatio="none">
                <motion.path 
                    d="M 10 0 L 20 30 L 15 50 L 40 80 L 35 150 M 80 0 L 70 40 L 90 90 M 150 20 L 130 60 L 160 100" 
                    stroke="url(#goldGradient)" 
                    strokeWidth="1.5" 
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                    className="drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                />
                <motion.path 
                    d="M 50 150 L 60 120 L 40 80 M 120 150 L 110 110 L 130 60 L 90 90" 
                    stroke="url(#goldGradient)" 
                    strokeWidth="1" 
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 4, ease: "easeInOut", delay: 0.5 }}
                />
                <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fcd34d" />
                        <stop offset="50%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 opacity-50 relative">
                    <p className="text-stone-400 font-serif leading-relaxed line-through decoration-amber-500/30 decoration-1">{oldText}</p>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-stone-900 z-10" />
                </div>
                <div className="shrink-0 text-amber-500/50">
                    <GitCommit className="w-6 h-6 rotate-90 md:rotate-0" />
                </div>
                <div className="flex-1">
                    <p className="text-zinc-100 font-serif leading-relaxed">{newText}</p>
                </div>
            </div>
            
            <div className="absolute top-4 right-6 text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60 font-mono flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {language === 'ar' ? 'تصدع فكري مُصلَح' : 'MENDED COGNITIVE TRACE'}
            </div>
        </div>
    );
};
