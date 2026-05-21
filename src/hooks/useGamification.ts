import { useState, useEffect } from 'react';

export interface GamificationState {
  xp: number;
  level: number;
  rank: string;
}

const LEVEL_THRESHOLDS = [
  { xp: 0, rankAr: 'باحث', rankEn: 'Seeker' },
  { xp: 100, rankAr: 'متيقظ', rankEn: 'Awakened' },
  { xp: 300, rankAr: 'مستنير', rankEn: 'Enlightened' },
  { xp: 600, rankAr: 'حكيم', rankEn: 'Sage' },
  { xp: 1200, rankAr: 'متسامي', rankEn: 'Transcendent' },
];

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
