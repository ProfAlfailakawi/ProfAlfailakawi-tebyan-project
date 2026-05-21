import React, { createContext, useContext, useState, useEffect } from 'react';

type CognitiveMode = 'default' | 'focus' | 'executive' | 'genesis';

interface CognitiveModeContextType {
  mode: CognitiveMode;
  setMode: (mode: CognitiveMode) => void;
  timeTheme: 'morning' | 'evening';
}

const CognitiveModeContext = createContext<CognitiveModeContextType | undefined>(undefined);

export const CognitiveModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<CognitiveMode>('default');
  const [timeTheme, setTimeTheme] = useState<'morning' | 'evening'>('morning');

  useEffect(() => {
    // Biological Rhythm (Time of day theme)
    const updateTimeTheme = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 17) {
        setTimeTheme('morning');
        document.documentElement.classList.remove('theme-evening');
        document.documentElement.classList.add('theme-morning');
      } else {
        setTimeTheme('evening');
        document.documentElement.classList.remove('theme-morning');
        document.documentElement.classList.add('theme-evening');
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
