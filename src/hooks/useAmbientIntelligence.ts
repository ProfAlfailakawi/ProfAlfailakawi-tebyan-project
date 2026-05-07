import { useEffect, useRef, useState } from 'react';
import { useCognitiveMode } from '../contexts/CognitiveModeContext';

export const useAmbientIntelligence = (scrollContainerRef?: React.RefObject<HTMLElement>) => {
  const { mode, setMode } = useCognitiveMode();
  const [scrollState, setScrollState] = useState<'idle' | 'dwelling' | 'scrolling' | 'fast'>('idle');
  const [isConfused, setIsConfused] = useState(false);

  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const mousePositions = useRef<{x: number, y: number, time: number}[]>([]);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const dwellingTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      // Determine if we are scrolling the main container or window
      const currentScrollY = target.scrollTop ?? window.scrollY;
      
      const now = Date.now();
      const deltaY = Math.abs(currentScrollY - lastScrollY.current);
      const deltaTime = now - lastScrollTime.current;
      
      const velocity = deltaTime > 0 ? deltaY / deltaTime : 0;

      lastScrollY.current = currentScrollY;
      lastScrollTime.current = now;

      // Auto-Focus Mode on deep scroll down
      if (currentScrollY > 300 && velocity > 0.5 && mode !== 'focus' && currentScrollY > lastScrollY.current) {
         // Wait, we only want to auto-focus if scrolling down smoothly
         // Let's just track fast vs slow
      }

      if (velocity > 2) {
        setScrollState('fast');
        document.body.classList.add('scroll-fast');
        document.body.classList.remove('scroll-dwelling', 'scroll-idle');
      } else {
        setScrollState('scrolling');
        document.body.classList.remove('scroll-fast', 'scroll-dwelling');
        document.body.classList.add('scroll-idle'); // Treat slow scroll as normal
      }

      clearTimeout(scrollTimeout.current);
      clearTimeout(dwellingTimeout.current);

      scrollTimeout.current = setTimeout(() => {
        setScrollState('idle');
        document.body.classList.remove('scroll-fast');
        
        // If they stopped scrolling, maybe they are dwelling
        dwellingTimeout.current = setTimeout(() => {
          setScrollState('dwelling');
          document.body.classList.add('scroll-dwelling');
        }, 2000); // 2 seconds of no scroll = dwelling
      }, 150);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      mousePositions.current.push({ x: e.clientX, y: e.clientY, time: now });
      
      // Auto-Zen (Wake up on move)
      document.body.classList.remove('zen-idle');
      clearTimeout(dwellingTimeout.current);
      
      // Enter Zen Mode if idle for 4 seconds
      dwellingTimeout.current = setTimeout(() => {
          document.body.classList.add('zen-idle');
          // Optional: if (mode === 'default') setMode('focus'); 
          // But CSS approach is safer and smoother: 
          // we add a global class `zen-idle` and we can style UI to vanish gently.
      }, 4000);

      // Keep only last 2 seconds of mouse movements
      mousePositions.current = mousePositions.current.filter(p => now - p.time < 2000);

      if (mousePositions.current.length > 20) {
        // Calculate erratic movement (rapid direction changes)
        let directionChanges = 0;
        for (let i = 2; i < mousePositions.current.length; i++) {
          const p1 = mousePositions.current[i-2];
          const p2 = mousePositions.current[i-1];
          const p3 = mousePositions.current[i];
          
          const v1x = p2.x - p1.x;
          const v1y = p2.y - p1.y;
          const v2x = p3.x - p2.x;
          const v2y = p3.y - p2.y;

          // Dot product to check angle
          const dot = v1x*v2x + v1y*v2y;
          if (dot < 0) directionChanges++; // Changed direction > 90 degrees
        }

        if (directionChanges > 8) {
          setIsConfused(true);
          // Auto-exit focus mode if confused
          if (mode === 'focus') {
             setMode('default');
          }
          mousePositions.current = []; // Reset to avoid spam
          setTimeout(() => setIsConfused(false), 5000);
        }
      }
    };

    const container = scrollContainerRef?.current || window;
    container.addEventListener('scroll', handleScroll as EventListener, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll as EventListener);
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(scrollTimeout.current);
      clearTimeout(dwellingTimeout.current);
    };
  }, [mode, setMode, scrollContainerRef]);

  return { scrollState, isConfused };
};
