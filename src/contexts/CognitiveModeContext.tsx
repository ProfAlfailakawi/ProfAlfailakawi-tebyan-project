import React, { createContext, useContext, useState, useEffect } from 'react';

type CognitiveMode = 'default' | 'focus' | 'executive' | 'genesis';
type DetailedTimeTheme = 'morning' | 'evening' | 'dawn' | 'midday' | 'sunset' | 'night';

interface CognitiveModeContextType {
  mode: CognitiveMode;
  setMode: (mode: CognitiveMode) => void;
  timeTheme: DetailedTimeTheme;
}

const CognitiveModeContext = createContext<CognitiveModeContextType | undefined>(undefined);

export const CognitiveModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<CognitiveMode>('default');
  const [timeTheme, setTimeTheme] = useState<DetailedTimeTheme>('morning');

  useEffect(() => {
    // Biological Rhythm (Detailed Spatial Chrono-UI)
    const updateTimeTheme = () => {
      const hour = new Date().getHours();
      
      // Clear all theme classes first to prevent overlaps
      document.documentElement.classList.remove(
        'theme-morning', 
        'theme-evening', 
        'theme-dawn', 
        'theme-midday', 
        'theme-sunset', 
        'theme-night'
      );

      if (hour >= 4 && hour < 8) {
        // Dawn Theme (فجر ناصع وساكن)
        setTimeTheme('dawn');
        document.documentElement.classList.add('theme-dawn', 'theme-morning');
      } else if (hour >= 8 && hour < 16) {
        // Midday Theme (ضحى حاد سويسري)
        setTimeTheme('midday');
        document.documentElement.classList.add('theme-midday', 'theme-morning');
      } else if (hour >= 16 && hour < 20) {
        // Sunset Theme (غروب دافئ)
        setTimeTheme('sunset');
        document.documentElement.classList.add('theme-sunset', 'theme-evening');
      } else {
        // Night Theme (ليل مظلم عتيق)
        setTimeTheme('night');
        document.documentElement.classList.add('theme-night', 'theme-evening');
      }
    };
    
    updateTimeTheme();
    const interval = setInterval(updateTimeTheme, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Apply mode classes to body
    document.body.classList.remove('mode-default', 'mode-focus', 'mode-executive', 'mode-genesis');
    document.body.classList.add(`mode-${mode}`);
  }, [mode]);

  return (
    <CognitiveModeContext.Provider value={{ mode, setMode, timeTheme }}>
      {children}
    </CognitiveModeContext.Provider>
  );
};

export const useCognitiveMode = () => {
  const context = useContext(CognitiveModeContext);
  if (context === undefined) {
    throw new Error('useCognitiveMode must be used within a CognitiveModeProvider');
  }
  return context;
};
