import React, { createContext, useContext, useState, useEffect } from 'react';
import { levels } from '../constants/gamification';

interface SageProgress {
    points: number;
    level: string;
    badges: string[];
    stats: { wisdom: number; dialogue: number; patience: number };
}

const GamificationContext = createContext<{
    sageProgress: SageProgress;
    updateSageProgress: (pointsToAdd: number, statKey?: keyof SageProgress['stats']) => void;
}>({
    sageProgress: { points: 0, level: 'explorer', badges: [], stats: { wisdom: 0, dialogue: 0, patience: 0 } },
    updateSageProgress: () => {},
});

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sageProgress, setSageProgress] = useState<SageProgress>({
        points: 0,
        level: 'explorer',
        badges: [],
        stats: { wisdom: 0, dialogue: 0, patience: 0 }
    });

    useEffect(() => {
        const savedProgress = localStorage.getItem('tebyan_sage_progress');
        if (savedProgress) {
            setSageProgress(JSON.parse(savedProgress));
        }
    }, []);

    const updateSageProgress = (pointsToAdd: number, statKey?: keyof SageProgress['stats']) => {
        setSageProgress(prev => {
            const newPoints = prev.points + pointsToAdd;
            const newStats = { ...prev.stats };
            if (statKey) newStats[statKey] += 1;

            const currentLevelObj = [...levels].reverse().find(l => newPoints >= l.min) || levels[0];
            const newBadges = [...prev.badges];
            if (newStats.wisdom >= 3 && !newBadges.includes('wisdom')) newBadges.push('wisdom');
            if (newStats.dialogue >= 3 && !newBadges.includes('dialogue')) newBadges.push('dialogue');
            if (newStats.patience >= 2 && !newBadges.includes('patience')) newBadges.push('patience');

            const next = {
                points: newPoints,
                level: currentLevelObj.id,
                badges: newBadges,
                stats: newStats
            };
            localStorage.setItem('tebyan_sage_progress', JSON.stringify(next));
            return next;
        });
    };

    return (
        <GamificationContext.Provider value={{ sageProgress, updateSageProgress }}>
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamificationContext = () => useContext(GamificationContext);
