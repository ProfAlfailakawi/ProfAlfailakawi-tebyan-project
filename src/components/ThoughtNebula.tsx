import React, { useEffect, useRef } from 'react';
import { useCognitiveMode } from '../contexts/CognitiveModeContext';

export const ThoughtNebula = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { timeTheme, mode } = useCognitiveMode();

  const shouldSkipNebula = typeof window !== 'undefined' && (
    window.innerWidth < 768 ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (shouldSkipNebula) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    resizeCanvas();

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const style = getComputedStyle(document.documentElement);
    const moodPrimary = style.getPropertyValue('--mood-primary').trim() || '#6366f1';
    const moodSecondary = style.getPropertyValue('--mood-secondary').trim() || '#10b981';

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '99, 102, 241';
    };

    const themeColor = hexToRgb(moodPrimary);
    const secondaryColor = hexToRgb(moodSecondary);

    const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number }> = [];
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.045,
        vy: (Math.random() - 0.5) * 0.045,
        size: Math.random() * 70 + 24,
        alpha: Math.random() * 0.035 + 0.008
      });
    }

    let animationId = 0;
    let lastFrame = 0;
    const frameInterval = 1000 / 30;

    const render = (timestamp: number) => {
      animationId = requestAnimationFrame(render);
      if (timestamp - lastFrame < frameInterval) return;
      lastFrame = timestamp;

      mouseX += (targetMouseX - mouseX) * 0.018;
      mouseY += (targetMouseY - mouseY) * 0.018;

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -p.size) p.x = width + p.size;
        if (p.x > width + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = height + p.size;
        if (p.y > height + p.size) p.y = -p.size;

        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0 && dist < 140) {
          p.x -= (dx / dist) * 0.045;
          p.y -= (dy / dist) * 0.045;
        }

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(${themeColor}, ${p.alpha * (mode === 'genesis' ? 1.45 : 1)})`);
        gradient.addColorStop(1, `rgba(${secondaryColor}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    animationId = requestAnimationFrame(render);

    window.addEventListener('resize', resizeCanvas, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [timeTheme, mode, shouldSkipNebula]);

  if (shouldSkipNebula) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-[-1] transition-opacity duration-1000 ${mode === 'focus' ? 'opacity-0' : 'opacity-100'}`}
    />
  );
};
