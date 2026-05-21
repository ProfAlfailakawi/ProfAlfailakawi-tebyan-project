import { useState, useEffect, useCallback } from 'react';

export const useFluidTyping = () => {
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [lastTypeTime, setLastTypeTime] = useState(Date.now());
  const [fluidTheme, setFluidTheme] = useState('calm'); // calm, active, hyper

  useEffect(() => {
    // Decay typing speed over time if no typing
    const interval = setInterval(() => {
      setTypingSpeed((prev) => {
        const newSpeed = Math.max(0, prev - 2);
        return newSpeed;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typingSpeed > 20) {
      setFluidTheme('hyper');
    } else if (typingSpeed > 5) {
      setFluidTheme('active');
    } else {
      setFluidTheme('calm');
    }
  }, [typingSpeed]);

  const onType = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastTypeTime;
    setLastTypeTime(now);
    
    setTypingSpeed((prev) => Math.min(30, prev + (timeDiff < 500 ? 2 : 1)));
  }, [lastTypeTime]);

  const getFluidStyles = () => {
    switch(fluidTheme) {
      case 'hyper': return "bg-gradient-to-r from-orange-500/10 to-rose-500/10 border-orange-400 font-bold transition-all duration-300";
      case 'active': return "bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 border-indigo-400 transition-all duration-300";
      default: return "bg-zinc-50 border-zinc-200 transition-all duration-700";
    }
  };

  const getFluidAmbient = () => {
    switch(fluidTheme) {
      case 'hyper': return "shadow-[0_0_40px_rgba(249,115,22,0.15)] ring-2 ring-orange-400/50";
      case 'active': return "shadow-[0_0_20px_rgba(99,102,241,0.1)] ring-1 ring-indigo-400/30";
      default: return "shadow-none ring-0";
    }
  };

  return { onType, fluidTheme, getFluidStyles, getFluidAmbient };
};
