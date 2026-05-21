import { useCallback, useRef } from 'react';

// Generates soft, pleasing UI sounds using Web Audio API (Psychoacoustics)
export const useAcoustics = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initCtx = () => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
         // Create context on first interaction
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            audioCtxRef.current = new AudioContextClass();
        }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSound = useCallback((type: 'click' | 'thud' | 'whisper' | 'chime') => {
    try {
        const ctx = initCtx();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
            gainNode.gain.setValueAtTime(0.05, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'thud') {
            osc.type = 'sine';
            // Deep, soft thud like a luxury car door closing
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
            gainNode.gain.setValueAtTime(0.1, now); // soft
            gainNode.gain.setTargetAtTime(0, now + 0.05, 0.05);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'whisper') {
             // White noise burst
            const bufferSize = ctx.sampleRate * 0.1; // 100ms
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 5000;
            
            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            gainNode.gain.setValueAtTime(0.02, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            noise.start(now);
            noise.stop(now + 0.1);
        } else if (type === 'chime') {
             osc.type = 'sine';
             osc.frequency.setValueAtTime(600, now);
             osc.frequency.setValueAtTime(1200, now + 0.05);
             gainNode.gain.setValueAtTime(0, now);
             gainNode.gain.linearRampToValueAtTime(0.05, now + 0.05);
             gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
             osc.start(now);
             osc.stop(now + 0.8);
        }
    } catch (e) {
        // Ignore audio errors (e.g. autoplay restrictions)
    }
  }, []);

  return { playSound };
};
