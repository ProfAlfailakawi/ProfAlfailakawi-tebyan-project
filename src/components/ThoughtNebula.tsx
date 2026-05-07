import React, { useEffect, useRef } from 'react';
import { useCognitiveMode } from '../contexts/CognitiveModeContext';

export const ThoughtNebula = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { timeTheme, mode } = useCognitiveMode();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener('mousemove', onMouseMove);
    
    // Slow, drifting particles
    const particles: any[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 80 + 20,
        alpha: Math.random() * 0.05 + 0.01 // very subtle
      });
    }

    let animationId: number;
    let hueOffset = 0;

    const render = () => {
      // Lerp mouse
      mouseX += (targetMouseX - mouseX) * 0.02;
      mouseY += (targetMouseY - mouseY) * 0.02;

      ctx.clearRect(0, 0, width, height);
      
      const themeColor = timeTheme === 'evening' ? '210, 150, 80' : '80, 120, 210';
      const secondaryColor = timeTheme === 'evening' ? '220, 100, 120' : '150, 80, 220';

      hueOffset += 0.1;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < -p.size) p.x = width + p.size;
        if (p.x > width + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = height + p.size;
        if (p.y > height + p.size) p.y = -p.size;

        // React to mouse slightly
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 300) {
          p.x -= (dx / dist) * 0.5;
          p.y -= (dy / dist) * 0.5;
        }

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(${themeColor}, ${p.alpha * (mode === 'genesis' ? 2 : 1)})`);
        gradient.addColorStop(1, `rgba(${secondaryColor}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    const onResize = () => {
       width = window.innerWidth;
       height = window.innerHeight;
       canvas.width = width;
       canvas.height = height;
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationId);
    };
  }, [timeTheme, mode]);

  return (
    <canvas 
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-[-1] transition-opacity duration-1000 ${mode === 'focus' ? 'opacity-0' : 'opacity-100'}`}
    />
  );
};
