import React from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';

export const GamificationBadge = ({ language }: { language: 'ar' | 'en' }) => {
  const { state } = useGamification();

  return (
    <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-full px-4 py-2 shadow-sm">
        <div className="bg-amber-100 text-amber-700 p-1.5 rounded-full">
            <Trophy className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 uppercase">{state.rank}</span>
            <span className="text-xs font-black text-black">LVL {state.level}</span>
        </div>
    </div>
  );
};
