import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { Box, Sparkles, AlertTriangle, ArrowRight, ShieldCheck, Zap, X, Type, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ai, parseGeminiError } from '../../services/gemini';

export const ARTab = ({ language, initialValue, handleTabChange }: any) => {
  const [idea, setIdea] = useState(initialValue || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [arData, setArData] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Device orientation for parallax AR effect
  useEffect(() => {
    if (!arData) return;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // gamma: left-to-right (-90 to 90) -> mapped to X translation
      // beta: front-to-back (-180 to 180) -> mapped to Y translation
      // Adjust multipliers for smoother/more pronounced effect
      const tiltX = (e.gamma || 0) * 1.2;
      const tiltY = ((e.beta || 0) - 45) * 1.2; // roughly center around 45deg holding angle
      
      setTilt({ 
        x: tiltX,
        y: tiltY
      });
    };
    
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [arData]);

  // Handle Camera Startup/Cleanup
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (arData && !stream && !permissionError) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(mediaStream => {
          activeStream = mediaStream;
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().catch(e => console.error("Video play error:", e));
          }
        })
        .catch(err => {
          console.error("Camera permission denied", err);
          setPermissionError(true);
        });
    }

    return () => {
      // Cleanup on unmount or `arData` close
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [arData, stream, permissionError]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setArData(null);
    setPermissionError(false);
    setTilt({ x: 0, y: 0 });
  };

  const analyzeIdea = async () => {
    if (!idea.trim()) return;
    setIsAnalyzing(true);
    setArData(null);

    try {
      const prompt = `
        Analyze this idea and break it down into spatial nodes for an AR experience: "${idea}"
        Create exactly 4 nodes:
        1. Core (الجوهر): The essence of the idea
        2. Strength (القوة): The main advantage
        3. Risk (المخاطرة): The main challenge or weakness
        4. Path (المسار): The logical next step

        Reply strictly in JSON formatting:
        {
          "nodes": [
            { "id": "core", "type": "core", "title": "...", "description": "...", "icon": "zap", "color": "blue" },
            { "id": "strength", "type": "strength", "title": "...", "description": "...", "icon": "shield", "color": "emerald" },
            { "id": "risk", "type": "risk", "title": "...", "description": "...", "icon": "alert", "color": "rose" },
            { "id": "path", "type": "path", "title": "...", "description": "...", "icon": "arrow", "color": "amber" }
          ]
        }
      `;
      
      let nodes = [];
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        nodes = parsed.nodes;
      } catch (err) {
         // Fallback
         nodes = [
            { id: "core", type: "core", title: language === 'ar' ? "جوهر الفكرة" : "Core Idea", description: idea, color: "blue" },
            { id: "strength", type: "strength", title: language === 'ar' ? "نقطة القوة" : "Strength", description: language === 'ar' ? "الابتكار في الطرح" : "Innovative approach", color: "emerald" },
            { id: "risk", type: "risk", title: language === 'ar' ? "المخاطرة" : "Risk", description: language === 'ar' ? "عقبات التنفيذ" : "Execution hurdles", color: "rose" },
            { id: "path", type: "path", title: language === 'ar' ? "المسار" : "Path", description: language === 'ar' ? "البدء بالنموذج الأولي" : "Start MVP", color: "amber" }
         ];
      }

      // Add tighter spatial positioning for mobile screens
      const positionedNodes = nodes.map((n: any, idx: number) => {
         const pos = [
           {x: 0, y: -20}, // center
           {x: -90, y: -160}, // top right
           {x: 90, y: -160}, // top left
           {x: 0, y: 120} // bottom
         ][idx] || {x: 0, y: 0};
         return { ...n, ...pos };
      });

      setArData({ nodes: positionedNodes });

    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'core': return <Sparkles className="w-6 h-6" />;
      case 'strength': return <ShieldCheck className="w-6 h-6" />;
      case 'risk': return <AlertTriangle className="w-6 h-6" />;
      case 'path': return <ArrowRight className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  const getColorClasses = (color: string) => {
    switch(color) {
      case 'blue': return 'bg-blue-900/70 border-blue-400/50 text-blue-100 shadow-[0_0_30px_rgba(59,130,246,0.3)]';
      case 'emerald': return 'bg-emerald-900/70 border-emerald-400/50 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.3)]';
      case 'rose': return 'bg-rose-900/70 border-rose-400/50 text-rose-100 shadow-[0_0_30px_rgba(244,63,94,0.3)]';
      case 'amber': return 'bg-amber-900/70 border-amber-400/50 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.3)]';
      default: return 'bg-zinc-900/70 border-zinc-400/50 text-zinc-100 shadow-[0_0_30px_rgba(255,255,255,0.2)]';
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col space-y-6 relative overflow-hidden bg-dot-pattern">
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/80 pointer-events-none"></div>

      <div className="relative z-20 w-full max-w-2xl mx-auto space-y-6">
         <div className="text-center space-y-3">
           <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-black rounded-2xl sm:rounded-[24px] shadow-xl sm:shadow-2xl shadow-black/20 mb-2">
             <Box className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
           </div>
           <h1 className="text-2xl sm:text-4xl font-serif text-black font-medium tracking-tight">
             {language === 'ar' ? 'فضاء تبيان' : 'Tabyan Space'}
           </h1>
           <p className="text-sm sm:text-lg text-zinc-500 font-medium">
             {language === 'ar' ? 'المشهد المعرفي: شاهد أفكارك تتجسد أمامك في مساحة ثلاثية الأبعاد' : 'Cognitive Scene: See your ideas materialize in a 3D space'}
           </p>
         </div>

         {!arData && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-zinc-200/60 shadow-xl shadow-zinc-200/30 space-y-6"
           >
             <div className="space-y-4">
               <label className="block text-sm font-bold text-zinc-700">
                 {language === 'ar' ? 'ما هي الفكرة التي تود تجسيدها؟' : 'What idea would you like to visualize?'}
               </label>
               <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب فكرتك هنا...' : 'Type your idea here...'}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-black/5 text-lg font-medium resize-none shadow-inner"
               />
             </div>
             
             <button
                onClick={analyzeIdea}
                disabled={isAnalyzing || !idea.trim()}
                className="w-full py-4 bg-black hover:bg-zinc-800 text-white rounded-2xl font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98]"
             >
                {isAnalyzing ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Layers className="w-5 h-5" />
                    <span>{language === 'ar' ? 'تجسيد الفكرة' : 'Materialize Idea'}</span>
                  </>
                )}
             </button>
           </motion.div>
         )}
      </div>

      {arData && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 relative z-10 w-full rounded-[32px] overflow-hidden bg-black shadow-2xl min-h-[500px]"
          ref={containerRef}
        >
           {/* Camera Feed Background */}
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             muted 
             className="absolute inset-0 w-full h-full object-cover"
           />

           {/* Space Background Grid Gradient (Overlay on camera) */}
           <div className="absolute inset-0 perspective-1000">
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] origin-[50%_100%] [transform:rotateX(60deg)_scale(2.5)_translateY(-20%)] opacity-40"></div>
           </div>

           {permissionError && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20">
               <div className="text-center p-6 bg-white/10 border border-white/20 rounded-2xl max-w-sm">
                 <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                 <h3 className="text-white font-bold text-lg mb-2">
                   {language === 'ar' ? 'عذراً لا يمكن الوصول للكاميرا' : 'Camera Access Denied'}
                 </h3>
                 <p className="text-white/70 text-sm">
                   {language === 'ar' ? 'يرجى السماح بالوصول للكاميرا في إعدادات المتصفح لتجربة الواقع المعزز.' : 'Please allow camera access in browser settings to experience AR.'}
                 </p>
               </div>
             </div>
           )}

           <button 
             onClick={stopCamera}
             className="absolute top-4 sm:top-6 right-4 sm:right-6 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full shadow-lg text-white z-50 border border-white/10 transition-colors"
           >
             <X className="w-5 h-5" />
           </button>

           <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 perspective-1000">
             {arData.nodes.map((node: any, idx: number) => (
                <motion.div
                  key={node.id}
                  drag
                  dragConstraints={containerRef}
                  dragElastic={0.2}
                  whileDrag={{ scale: 1.05, zIndex: 60, cursor: 'grabbing' }}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    opacity: 1, 
                    scale: selectedNode?.id === node.id ? 1.1 : 1, 
                    x: node.x + tilt.x, 
                    y: node.y + tilt.y,
                    zIndex: selectedNode?.id === node.id ? 50 : 30
                  }}
                  transition={{ type: 'spring', damping: 20, delay: idx * 0.1 }}
                  onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                  className={cn(
                    "absolute cursor-grab p-5 rounded-3xl backdrop-blur-xl border border-white/20 hover:shadow-2xl transition-shadow w-48 sm:w-56 flex flex-col items-center text-center gap-3 pointer-events-auto",
                    getColorClasses(node.color)
                  )}
                  style={{
                    boxShadow: selectedNode?.id === node.id ? '0 0 50px rgba(255,255,255,0.2)' : undefined
                  }}
                >
                  <div className={cn("p-4 bg-black/40 rounded-2xl shadow-inner backdrop-blur-md border border-white/10", node.type === 'core' && 'p-5 scale-110')}>
                    {getIcon(node.type)}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base">{node.title}</h3>
                  
                  <AnimatePresence>
                    {selectedNode?.id === node.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs sm:text-sm font-medium opacity-80 pt-2 border-t border-black/10 w-full"
                      >
                        {node.description}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
             ))}
           </div>
        </motion.div>
      )}

      {/* AR Background styling helper */}
      <style>{`
        .bg-dot-pattern {
          background-image: radial-gradient(rgba(0,0,0,0.05) 2px, transparent 2px);
          background-size: 30px 30px;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default ARTab;
