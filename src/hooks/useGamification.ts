import { useState, useEffect } from 'react';
import { levels } from '../constants/gamification';

export interface GamificationState {
  xp: number;
  level: number;
  rank: string;
}

// One source of truth for the ladder: src/constants/gamification.ts
const LEVEL_THRESHOLDS = levels.map((l) => ({ xp: l.min, rankAr: l.ar, rankEn: l.en }));

export function useGamification() {
  const [state, setState] = useState<GamificationState>(() => {
    const savedXp = Number(localStorage.getItem('edu_ai_xp') || 0);
    return calculateState(savedXp);
  });

  function calculateState(xp: number): GamificationState {
    let currentRank = LEVEL_THRESHOLDS[0].rankAr;
    let currentLevel = 1;

    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (xp >= LEVEL_THRESHOLDS[i].xp) {
            currentRank = LEVEL_THRESHOLDS[i].rankAr; // Defaults to Arabic, we can handle En in the badge
            currentLevel = i + 1;
        } else {
            break;
        }
    }
    return { xp, level: currentLevel, rank: currentRank };
  }

  const addXp = (amount: number) => {
    setState(prev => {
        const newXp = prev.xp + amount;
        localStorage.setItem('edu_ai_xp', newXp.toString());
        return calculateState(newXp);
    });
  };

  useEffect(() => {
    const handleAddXp = (e: CustomEvent<{amount: number}>) => {
        if (e.detail && typeof e.detail.amount === 'number') {
            addXp(e.detail.amount);
        }
    };
    
    // @ts-ignore
    window.addEventListener('add_xp', handleAddXp);
    
    return () => {
        // @ts-ignore
        window.removeEventListener('add_xp', handleAddXp);
    }
  }, []);

  return { state, addXp };
}
