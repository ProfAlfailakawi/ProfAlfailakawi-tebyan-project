import { useEffect, useRef, useState } from 'react';
import { useCognitiveMode } from '../contexts/CognitiveModeContext';

export const useAmbientIntelligence = (scrollContainerRef?: React.RefObject<HTMLElement>) => {
  // Quiet mode: avoid high-frequency mouse/scroll state updates that caused visible stutter.
  // Returns stable ambient values while preserving the hook contract for the rest of the app.
  const [isConfused] = useState(false);
  const [isZen] = useState(false);
  const [intensity] = useState<number>(0.24);
  const [scrollState] = useState<'idle' | 'dwelling' | 'scrolling' | 'fast'>('idle');

  useEffect(() => {
    document.body.classList.remove('zen-idle', 'scroll-fast', 'scroll-dwelling', 'scroll-idle');
  }, [scrollContainerRef]);

  return { scrollState, isConfused, isZen, intensity };
};
