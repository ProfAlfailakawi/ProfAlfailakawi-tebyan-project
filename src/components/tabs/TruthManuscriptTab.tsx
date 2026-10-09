import React, { useState, useRef, useEffect, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Sparkles, Wand2, RefreshCw, Eye, X, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAmbientIntelligence } from '../../hooks/useAmbientIntelligence';
import ReactMarkdown from 'react-markdown';
import { TebyanLoader } from '../ui/TebyanLoader';
import { TabHeader } from '../TabHeader';
import { proxyGenerateContent } from '../../lib/aiProxy';
import { KnowledgeMemoryService } from '../../services/knowledgeMemoryService';

export const TruthManuscriptTab = React.memo(({ language, handleTabChange, initialValue }: { language: 'ar' | 'en', handleTabChange: any, initialValue?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [percentRevealed, setPercentRevealed] = useState(0);
  const [manuscriptContent, setManuscriptContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localQuery, setLocalQuery] = useState(initialValue || '');
  const [isZenMode, setIsZenMode] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorNodeRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const playAmbientSound = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtxClass();
      const ctx = audioCtxRef.current;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(136.1, ctx.currentTime); // "OM" frequency approx
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 3); // fade in to very quiet

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorNodeRef.current = osc;
      gainNodeRef.current = gain;
    } catch (e) { console.error(e); }
  };

  const stopAmbientSound = () => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 2);
      setTimeout(() => {
        if (oscillatorNodeRef.current) {
          oscillatorNodeRef.current.stop();
          oscillatorNodeRef.current.disconnect();
        }
      }, 2000);
    }
  };

  useEffect(() => {
    if (isZenMode) {
      playAmbientSound();
    } else {
      stopAmbientSound();
    }
    return stopAmbientSound;
  }, [isZenMode]);

  const generateWisdom = async (query: string) => {
    setIsLoading(true);
    try {
      const prompt = `أنت حكيم قديم وتكتب في "مخطوطة الحقيقة الضائعة".
المستخدم يبحث عن بصيرة أو حكمة بخصوص الموضوع التالي: "${query || 'عن الحياة والخفايا'}"

اكتب فقرات قصيرة جداً (3 أو 4 فقرات كحد أقصى) بلغة عربية فصحى بليغة جداً وعميقة، تتحدث عن الحكمة الضائعة أو السر وراء هذا الموضوع، وكأنها نصوص منسية تم العثور عليها.
تجنب أي كلمات معاصرة، استخدم أسلوباً بلاغياً يلامس الروح.
لا تضع مقدمات بل ادخل في الحكمة مباشرة.`;

      const res = await KnowledgeMemoryService.processUnderstanding(
          query || 'عن الحياة والخفايا',
          prompt,
          { temperature: 0.9 },
          async (textContext, instructionContext) => {
              const response = await proxyGenerateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: 'user', parts: [{ text: instructionContext }] }],
              });
              return response.text || '';
          }
      );

      setManuscriptContent(res.text || 'لم نجد شيئاً في ظلمات النسيان..');
      resetCanvas();
    } catch (error) {
      console.error(error);
      setManuscriptContent('الغبار كثيف، لم نتمكن من قراءة الحقيقة اليوم.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialValue) {
      generateWisdom(initialValue);
    } else {
      generateWisdom("خواطر عن البحث والتأمل");
    }
  }, []);

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set internal canvas size to match layout
    if (containerRef.current) {
        canvas.width = containerRef.current.offsetWidth;
        canvas.height = containerRef.current.offsetHeight;
    } else {
        canvas.width = 800;
        canvas.height = 600;
    }

    // Draw dusty layer
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#E9E3EF'; // Soft lilac veil
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise/texture to dust
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 12 - 6;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Islamic geometric pattern faintly on dust
    ctx.strokeStyle = 'rgba(110, 91, 145, 0.22)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < canvas.width; i += 100) {
      for (let j = 0; j < canvas.height; j += 100) {
        ctx.beginPath();
        ctx.moveTo(i, j + 50);
        ctx.lineTo(i + 50, j);
        ctx.lineTo(i + 100, j + 50);
        ctx.lineTo(i + 50, j + 100);
        ctx.closePath();
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = 'destination-out';
    setIsRevealed(false);
    setPercentRevealed(0);
  };

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Calculate scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: any) => {
    setIsDrawing(true);
    scratch(e);
  };

  const handlePointerMove = (e: any) => {
    if (!isDrawing) return;
    // prevent scrolling on mobile when scratching
    if (e.touches) e.preventDefault();
    scratch(e);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    checkReveal();
  };

  const scratch = (e: any) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, Math.min(canvas.width, canvas.height) * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.filter = 'blur(10px)'; // soft edges
    
    // Throttle checking reveal percent
    if (Math.random() < 0.1) {
        checkReveal();
    }
  };

  const checkReveal = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // A quick sample checking to estimate clear area, doing full image data is slow on 100% checks
    const stride = 100;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    let total = 0;

    for (let i = 3; i < imgData.length; i += 4 * stride) {
      if (imgData[i] < 128) {
        transparent++;
      }
      total++;
    }

    const percent = (transparent / total) * 100;
    setPercentRevealed(percent);

    if (percent > 60 && !isRevealed) {
      setIsRevealed(true);
      // Auto clear the rest gracefully
      canvas.style.transition = 'opacity 1s ease-out';
      canvas.style.opacity = '0';
      setTimeout(() => {
          if (canvas) canvas.style.display = 'none';
      }, 1000);
    }
  };

  useEffect(() => {
    const handleResize = () => {
        if (!isRevealed) resetCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isRevealed]);

  // Initial draw
  useEffect(() => {
      if (!isLoading && manuscriptContent) {
          // Allow some time for DOM paint
          setTimeout(() => resetCanvas(), 100);
      }
  }, [isLoading, manuscriptContent]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      className="p-4 md:p-8 flex flex-col items-center max-w-4xl mx-auto min-h-screen"
    >
      <div className="w-full mb-8">
        <TabHeader 
          icon={ScrollText}
          title={{ ar: 'مخطوطة الحقيقة الضائعة', en: 'Lost Truth Manuscript' }}
          description={{ ar: 'أزل الغبار المتراكم، لتتجلى لك الحكمة العميقة وراء ما تبحث عنه.', en: 'Clear the dust to reveal the deep wisdom you seek.' }}
          language={language}
          onBack={() => handleTabChange('discover', '')}
          onClose={() => handleTabChange('discover', '', true)}
        />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); generateWisdom(localQuery); }} className="w-full mb-8 flex gap-2 max-w-2xl">
         <input 
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="عن ماذا تبحث الحكمة؟"
            className="flex-1 min-w-0 bg-white/50 border border-navy/10 rounded-xl px-4 py-3 placeholder-ink-mute text-navy font-medium focus:outline-none focus:ring-2 focus:ring-lilac/40"
         />
         <button type="submit" disabled={isLoading} className="shrink-0 bg-lilac hover:bg-lilac-deep text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50">
           {isLoading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5" />}
           <span>استنبط</span>
         </button>
      </form>

      {!isLoading && !isRevealed && manuscriptContent && (
        <p className="mb-3 text-center text-sm font-semibold text-ink-soft">امسح الغبار بإصبعك أو بالفأرة لتظهر الحكمة.</p>
      )}

      {/* Manuscript Container */}
      <div className="flex-1 w-full relative group">
          {isLoading ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-white rounded-[28px] border border-navy/10">
                <TebyanLoader size={48} label="جاري التحميل" />
                <p className="text-navy font-bold text-lg mt-4" style={{ fontFamily: 'Amiri, serif' }}>يتم استحضار الأرواح المعرفية...</p>
             </div>
          ) : (
             <div 
               ref={containerRef}
               className="relative w-full h-full flex flex-col items-center p-8 overflow-hidden rounded-[28px] custom-scrollbar overflow-y-auto"
               style={{
                   backgroundColor: '#FFFFFF',
                   boxShadow: '0 1px 2px rgba(24,34,49,0.04), 0 12px 30px -18px rgba(24,34,49,0.2)', border: '1px solid rgba(24,34,49,0.08)'
               }}
             >
                {/* The Revealed Content */}
                <div className="relative z-0 max-w-2xl mx-auto py-12 text-center pointer-events-auto">
                    <ReactMarkdown 
                       className="markdown-body text-xl md:text-3xl leading-relaxed font-bold text-navy"
                       components={{
                           p: ({node, ...props}) => <p style={{ fontFamily: 'Amiri, Aref Ruqaa, serif', }} className="mb-6" {...props} />
                       }}
                    >
                        {manuscriptContent || ''}
                    </ReactMarkdown>
                    
                    {isRevealed && (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mt-12 flex flex-col items-center gap-6">
                          <Wand2 className="w-8 h-8 text-lilac opacity-50" />
                          <div className="flex flex-wrap gap-4 justify-center">
                            <button
                               onClick={() => setIsZenMode(true)}
                               className="flex items-center gap-2 bg-lilac text-white px-6 py-3 rounded-full hover:bg-lilac-deep transition-all font-bold group"
                            >
                               <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                               {language === 'ar' ? 'وضع التأمل العميق' : 'Zen Reading Mode'}
                            </button>
                            <a 
                               href={`mailto:?subject=حكمة بليغة من مخطوطة الحقيقة الضائعة&body=${encodeURIComponent(manuscriptContent || '')}`}
                               className="flex items-center gap-2 bg-white text-lilac border border-lilac/30 px-6 py-3 rounded-full hover:bg-lilac-mist transition-all font-bold group"
                            >
                               <Mail className="w-5 h-5 group-hover:-translate-y-1 transition-transform" aria-hidden="true" />
                               إرسال إلى بريدي
                            </a>
                          </div>
                      </motion.div>
                    )}
                </div>

                {/* The Dust Canvas */}
                <canvas
                   ref={canvasRef}
                   onMouseDown={handlePointerDown}
                   onMouseMove={handlePointerMove}
                   onMouseUp={handlePointerUp}
                   onMouseLeave={handlePointerUp}
                   onTouchStart={handlePointerDown}
                   onTouchMove={handlePointerMove}
                   onTouchEnd={handlePointerUp}
                   style={{ touchAction: 'none' }}
                   className={cn(
                       "absolute top-0 left-0 w-full h-full cursor-crosshair z-10",
                       isRevealed ? "pointer-events-none" : "pointer-events-auto"
                   )}
                />
             </div>
          )}
      </div>

      <AnimatePresence>
        {isZenMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-ivory overflow-y-auto"
          >
            <button
              onClick={() => setIsZenMode(false)}
              className="fixed top-8 right-8 z-50 p-4 text-ink-mute hover:text-navy transition-colors rounded-full hover:bg-white"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="max-w-4xl mx-auto py-20 text-center">
              <ReactMarkdown 
                 className="markdown-body text-2xl md:text-5xl leading-loose font-bold text-navy"
                 components={{
                     p: ({node, ...props}) => <p style={{ fontFamily: 'Amiri, auto', lineHeight: '2.5' }} className="mb-12" {...props} />
                 }}
              >
                  {manuscriptContent || ''}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
});

export default TruthManuscriptTab;
