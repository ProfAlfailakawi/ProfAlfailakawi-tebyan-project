import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';
import { Sparkles, Network, Globe, Maximize2, MousePointer2, ZoomIn, ZoomOut, Info, Clapperboard } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { SmartIconWrapper } from '../common/SmartIconGuidance';

type IdeaNode = {
    id: string;
    text: string;
    author: string;
    likes: number;
    parentId?: string;
    type: string;
    x: number;
    y: number;
    size: number;
};

export const NebulaTab = ({ language, onViewDetails }: { language: 'ar' | 'en', onViewDetails: (nodeId: string) => void }) => {
    const [ripples, setRipples] = useState<any[]>([]);
    const [selectedNode, setSelectedNode] = useState<IdeaNode | null>(null);
    const [zoom, setZoom] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768 ? 0.4 : 1);
    const [isCinematic, setIsCinematic] = useState(false);
    
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const resetView = () => {
        setIsCinematic(false);
        animate(x, 0, { duration: 1 });
        animate(y, 0, { duration: 1 });
        setZoom(typeof window !== 'undefined' && window.innerWidth < 768 ? 0.4 : 1);
        setSelectedNode(null);
    };

    useEffect(() => {
        const q = query(collection(db, 'ripples'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRipples(data);
        });
        return unsubscribe;
    }, []);

    const nodes = useMemo(() => {
        if (ripples.length === 0) return [];

        return ripples.map((r, index) => {
            let hash = 0;
            const str = r.id || '';
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0; 
            }
            const normalizedHash = Math.abs(hash % 1000) / 1000;
            
            const angle = (index / ripples.length) * Math.PI * 2 + (normalizedHash * Math.PI);
            const radius = 80 + (normalizedHash * 280);
            
            return {
                ...r,
                timestampValue: new Date(r.timestamp || 0).getTime(),
                x: 400 + Math.cos(angle) * radius,
                y: 400 + Math.sin(angle) * radius,
                size: 16 + (r.likes || 0) * 3 + (r.type === 'seed' ? 12 : 0)
            } as IdeaNode & {timestampValue: number};
        });
    }, [ripples]);

    const sortedByTime = useMemo(() => [...nodes].sort((a, b) => a.timestampValue - b.timestampValue), [nodes]);
    const [timelineStep, setTimelineStep] = useState(0);

    useEffect(() => {
        setTimelineStep(nodes.length);
    }, [nodes.length]);

    const visibleNodes = useMemo(() => {
        return sortedByTime.slice(0, timelineStep);
    }, [sortedByTime, timelineStep]);

    useEffect(() => {
        if (!isCinematic || visibleNodes.length === 0) return;
        
        let i = 0;
        const interval = setInterval(() => {
            const nextNode = visibleNodes[i % visibleNodes.length];
            setSelectedNode(nextNode);
            
            animate(x, 400 - nextNode.x, { duration: 4, ease: "easeInOut" });
            animate(y, 400 - nextNode.y, { duration: 4, ease: "easeInOut" });
            setZoom(1.8);
            
            i++;
        }, 6000);
        return () => clearInterval(interval);
    }, [isCinematic, visibleNodes, x, y]);

    return (
        <div className={cn("relative w-full overflow-hidden shadow-2xl transition-all duration-1000", isCinematic ? "fixed inset-0 z-50 h-screen bg-black rounded-none" : "h-[68vh] md:h-[70vh] bg-black rounded-[24px] md:rounded-[40px] border border-zinc-800")}>
            {/* Nebula Background */}
            <div className={cn("absolute inset-0 pointer-events-none transition-opacity duration-1000", isCinematic ? "opacity-20" : "opacity-40")}>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[150px] animate-pulse delay-1000" />
            </div>

            {/* Instruction Overlay */}
            {!isCinematic && (
              <div className={cn(
                  "absolute top-4 md:top-6 z-20 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 md:px-4 py-2 rounded-full border border-white/10 text-white/80 text-[10px] md:text-xs font-bold max-w-[52vw] md:max-w-none leading-relaxed",
                  language === 'ar' ? 'right-3 md:right-6' : 'left-3 md:left-6'
              )}>
                  <Info className="w-4 h-4" />
                  {language === 'ar' ? 'تفاعل مع نقاط الضوء لاستكشاف الأفكار' : 'Interact with light points to explore ideas'}
              </div>
            )}

            {/* Cinematic Button */}
            <div className={cn(
                "absolute top-4 md:top-6 z-20 flex items-center gap-2",
                language === 'ar' ? 'left-3 md:left-6' : 'right-3 md:right-6'
            )}>
              <button 
                  onClick={() => {
                      if (isCinematic) resetView();
                      else setIsCinematic(true);
                  }} 
                  className={cn(
                      "px-3 md:px-4 py-2 rounded-full font-bold text-[10px] md:text-xs flex items-center gap-1.5 md:gap-2 backdrop-blur-md shadow-lg transition-all border",
                      isCinematic ? "bg-white text-black border-white" : "bg-black/50 text-white border-white/10 hover:bg-white/10"
                  )}
              >
                  <Clapperboard className="w-4 h-4" />
                  {isCinematic ? (language === 'ar' ? 'خروج من العرض' : 'Exit Cinema') : (language === 'ar' ? 'مسرح الأفكار' : 'Cinematic Mode')}
              </button>
            </div>

            {/* Zoom Controls */}
            <AnimatePresence>
              {!isCinematic && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
                    <SmartIconWrapper
                      id="nebula_fit_screen"
                      guidanceText={language === 'ar' ? 'عرض كامل: يعيد ضبط الرؤية لرؤية سديم الأفكار بالكامل.' : 'Fit to screen: Resets the view to see the entire ideas nebula.'}
                      side="left"
                      lang={language}
                    >
                    <button onClick={resetView} className="p-3 bg-indigo-500/80 backdrop-blur-md rounded-xl border border-indigo-400 text-white hover:bg-indigo-600 transition-all shadow-lg flex items-center justify-center gap-2 group" title={language === 'ar' ? 'عرض كامل' : 'Fit to screen'}>
                        <Maximize2 className="w-5 h-5" />
                        <span className="text-[10px] font-bold hidden group-hover:inline md:hidden">{language === 'ar' ? 'عرض كامل' : 'Fit View'}</span>
                    </button>
                    </SmartIconWrapper>
                    <button onClick={() => setZoom(prev => Math.min(prev + 0.2, 2))} className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/20 transition-all">
                        <ZoomIn className="w-5 h-5" />
                    </button>
                    <button onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.3))} className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/20 transition-all">
                        <ZoomOut className="w-5 h-5" />
                    </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Map Container */}
            <div className="w-full h-full p-8 relative overflow-hidden cursor-move touch-none" dir="ltr">
                <motion.div 
                    drag={!isCinematic}
                    dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
                    dragElastic={0.1}
                    animate={{ scale: zoom }}
                    transition={{ duration: isCinematic ? 4 : 0.5, ease: "easeInOut" }}
                    style={{ x, y }}
                    className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -ml-[400px] -mt-[400px] origin-center"
                >
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                        {visibleNodes.map(node => {
                            if (!node.parentId) return null;
                            const parent = visibleNodes.find(n => n.id === node.parentId);
                            if (!parent) return null;
                            return (
                                <motion.line
                                    key={`line-${node.id}`}
                                    x1={node.x}
                                    y1={node.y}
                                    x2={parent.x}
                                    y2={parent.y}
                                    stroke="url(#lineGradient)"
                                    strokeWidth={zoom < 0.5 ? "2" : "1"}
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.3 }}
                                    transition={{ duration: 2 }}
                                />
                            );
                        })}
                        <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <AnimatePresence>
                        {visibleNodes.map(node => (
                            <motion.button
                                key={node.id}
                                layoutId={node.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ 
                                    scale: 1, 
                                    opacity: isCinematic && selectedNode && selectedNode.id !== node.id ? 0.3 : 1,
                                    x: node.x - node.size / 2,
                                    y: node.y - node.size / 2,
                                }}
                                transition={{ duration: isCinematic ? 2 : 0.5 }}
                                whileHover={!isCinematic ? { scale: 1.2, zIndex: 50 } : undefined}
                                onClick={() => !isCinematic && setSelectedNode(node)}
                                className={cn(
                                    "absolute rounded-full flex items-center justify-center transition-shadow",
                                    node.type === 'seed' ? "bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" : "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                )}
                                style={{ width: node.size, height: node.size }}
                            >
                                <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                                
                                {/* Label */}
                                <div className={cn(
                                    "absolute top-full mt-2 whitespace-nowrap text-[10px] sm:text-xs font-bold text-white/40 px-2 py-1 rounded-full transition-all",
                                    (!isCinematic || (isCinematic && selectedNode?.id === node.id)) ? "opacity-100" : "opacity-0",
                                    !isCinematic && "group-hover:text-white group-hover:bg-black/50",
                                    language === 'ar' ? "right-1/2 translate-x-1/2" : "left-1/2 -translate-x-1/2"
                                )}>
                                    {node.text.slice(0, 15)}...
                                </div>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Evolution Timeline Slider */}
            {!isCinematic && nodes.length > 0 && (
                <div className="absolute top-20 right-1/2 translate-x-1/2 z-20 w-11/12 max-w-xl bg-black/80 border border-white/10 backdrop-blur-md p-4 rounded-3xl shadow-xl flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs text-zinc-400 font-bold uppercase tracking-widest px-2">
                        <span>{language === 'ar' ? 'البداية' : 'Genesis'}</span>
                        <span className="text-white">{language === 'ar' ? 'ذاكرة النسيج' : 'Evolution Timeline'} ({timelineStep}/{nodes.length})</span>
                        <span>{language === 'ar' ? 'الآن' : 'Now'}</span>
                    </div>
                    <input 
                        type="range" 
                        min={1} 
                        max={nodes.length} 
                        value={timelineStep} 
                        onChange={(e) => setTimelineStep(Number(e.target.value))}
                        className="w-full h-2 bg-zinc-800 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                    />
                </div>
            )}

            {/* Selected Node Details */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        className={cn(
                            "absolute z-30 max-w-lg p-6 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl transition-all duration-1000",
                            isCinematic ? "top-1/2 -translate-y-1/2 mt-32 w-11/12 max-w-2xl bg-black/40" : "bottom-8 w-full",
                            language === 'ar' ? 'right-1/2 translate-x-1/2' : 'left-1/2 -translate-x-1/2'
                        )}
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                    >
                        {!isCinematic && (
                          <button onClick={() => setSelectedNode(null)} className="absolute top-4 right-4 text-white/50 hover:text-white">
                              <Maximize2 className="w-5 h-5" />
                          </button>
                        )}
                        
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                selectedNode.type === 'seed' ? "bg-indigo-500 text-white" : "bg-emerald-500 text-white"
                            )}>
                                {selectedNode.type === 'seed' ? <Globe className="w-5 h-5" /> : <Network className="w-5 h-5" />}
                            </div>
                            <div>
                                <h4 className={cn("text-white font-bold transition-all", isCinematic && "text-2xl")}>{selectedNode.author}</h4>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                                    {selectedNode.type === 'seed' ? (language === 'ar' ? 'البذرة الأولى' : 'Origin Seed') : (language === 'ar' ? 'تطوير' : 'Evolution')}
                                </p>
                            </div>
                        </div>
                        <p className={cn("text-white/90 font-medium mb-4 transition-all", isCinematic ? "text-3xl leading-relaxed italic" : "line-clamp-3")}>{selectedNode.text}</p>
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4 text-white/60 text-sm font-bold">
                                <span className="flex items-center gap-1"><Sparkles className="w-4 h-4 text-amber-400" /> {selectedNode.likes}</span>
                             </div>
                             {!isCinematic && (
                               <button 
                                  onClick={() => onViewDetails(selectedNode.id)}
                                  className="bg-white text-black px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-white/10"
                               >
                                  {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                               </button>
                             )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
