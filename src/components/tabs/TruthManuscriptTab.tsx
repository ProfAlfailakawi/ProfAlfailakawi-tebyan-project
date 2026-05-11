import React, { useState, useRef, useEffect, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Sparkles, Wand2, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAmbientIntelligence } from '../../hooks/useAmbientIntelligence';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { TabHeader } from '../TabHeader';

export const TruthManuscriptTab = React.memo(({ language, handleTabChange, initialValue }: { language: 'ar' | 'en', handleTabChange: any, initialValue?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [percentRevealed, setPercentRevealed] = useState(0);
  const [manuscriptContent, setManuscriptContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localQuery, setLocalQuery] = useState(initialValue || '');
  const aiClient = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' }), []);

  const generateWisdom = async (query: string) => {
    setIsLoading(true);
    try {
      const prompt = `أنت حكيم قديم وتكتب في "مخطوطة الحقيقة الضائعة".
المستخدم يبحث عن بصيرة أو حكمة بخصوص الموضوع التالي: "${query || 'عن الحياة والخفايا'}"

اكتب فقرات قصيرة جداً (3 أو 4 فقرات كحد أقصى) بلغة عربية فصحى بليغة جداً وعميقة، تتحدث عن الحكمة الضائعة أو السر وراء هذا الموضوع، وكأنها نصوص منسية تم العثور عليها.
تجنب أي كلمات معاصرة، استخدم أسلوباً بلاغياً يلامس الروح.
لا تضع مقدمات بل ادخل في الحكمة مباشرة.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setManuscriptContent(response.text || 'لم نجد شيئاً في ظلمات النسيان..');
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
    ctx.fillStyle = '#bfa580'; // Sandy dust color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise/texture to dust
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 40 - 20;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Islamic geometric pattern faintly on dust
    ctx.strokeStyle = 'rgba(100, 80, 50, 0.4)';
    ctx.lineWidth = 2;
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
            className="flex-1 bg-white/50 border border-amber-900/20 rounded-xl px-4 py-3 placeholder-amber-900/40 text-amber-950 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
         />
         <button type="submit" disabled={isLoading} className="bg-amber-900 hover:bg-amber-800 text-amber-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50">
           {isLoading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5" />}
           <span>استنبط</span>
         </button>
      </form>

      {/* Manuscript Container */}
      <div className="flex-1 w-full relative group">
          {isLoading ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#e9dbce] rounded-lg shadow-inner border border-[#d3ba9f]">
                <RefreshCw className="w-12 h-12 text-amber-900/50 animate-spin mb-4" />
                <p className="text-amber-900 font-bold animate-pulse text-lg" style={{ fontFamily: 'Amiri, serif' }}>يتم استحضار الأرواح المعرفية...</p>
             </div>
          ) : (
             <div 
               ref={containerRef}
               className="relative w-full h-full flex flex-col items-center p-8 overflow-hidden rounded-lg custom-scrollbar overflow-y-auto"
               style={{
                   backgroundColor: '#e9dbce', // Parchment color
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke='%23d3ba9f' stroke-width='1' fill='none' d='M0 50 l50 -50 l50 50 l-50 50 z M25 50 l25 -25 l25 25 l-25 25 z'/%3E%3C/svg%3E")`,
                   boxShadow: 'inset 0 0 50px rgba(100,60,20,0.5), 0 10px 30px rgba(0,0,0,0.1)'
               }}
             >
                {/* The Revealed Content */}
                <div className="relative z-0 max-w-2xl mx-auto py-12 text-center pointer-events-auto">
                    <ReactMarkdown 
                       className="markdown-body text-xl md:text-3xl leading-relaxed font-bold text-[#2a1e12]"
                       components={{
                           p: ({node, ...props}) => <p style={{ fontFamily: 'Amiri, Aref Ruqaa, serif', textShadow: '0 1px 1px rgba(255,255,255,0.5)' }} className="mb-6" {...props} />
                       }}
                    >
                        {manuscriptContent || ''}
                    </ReactMarkdown>
                    
                    {isRevealed && (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mt-12 flex flex-col items-center gap-6">
                          <Wand2 className="w-8 h-8 text-amber-800 opacity-50" />
                          <a 
                             href={`mailto:?subject=حكمة بليغة من مخطوطة الحقيقة الضائعة&body=${encodeURIComponent(manuscriptContent || '')}`}
                             className="flex items-center gap-2 bg-amber-900 text-amber-50 px-6 py-3 rounded-full shadow-lg hover:bg-amber-800 transition-all font-bold group"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                             </svg>
                             إرسال إلى بريدي
                          </a>
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
    </motion.div>
  );
});

export default TruthManuscriptTab;
