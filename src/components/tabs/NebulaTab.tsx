import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'motion/react';
import { Sparkles, Network, Globe, Maximize2, MousePointer2, ZoomIn, ZoomOut, Info } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

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
    
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const resetView = () => {
        x.set(0);
        y.set(0);
        setZoom(typeof window !== 'undefined' && window.innerWidth < 768 ? 0.4 : 1);
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
            // Safer deterministic positioning using string hashing
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
                x: 400 + Math.cos(angle) * radius,
                y: 400 + Math.sin(angle) * radius,
                size: 16 + (r.likes || 0) * 3 + (r.type === 'seed' ? 12 : 0)
            } as IdeaNode;
        });
    }, [ripples]);

    return (
        <div className="relative w-full h-[70vh] bg-black rounded-[40px] overflow-hidden border border-zinc-800 shadow-2xl">
            {/* Nebula Background */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[150px] animate-pulse delay-1000" />
            </div>

            {/* Instruction Overlay */}
            <div className={cn(
                "absolute top-6 z-20 flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white/80 text-xs font-bold",
                language === 'ar' ? 'right-6' : 'left-6'
            )}>
                <Info className="w-4 h-4" />
                {language === 'ar' ? 'تفاعل مع نقاط الضوء لاستكشاف الأفكار' : 'Interact with light points to explore ideas'}
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
                <button onClick={resetView} className="p-3 bg-indigo-500/80 backdrop-blur-md rounded-xl border border-indigo-400 text-white hover:bg-indigo-600 transition-all shadow-lg flex items-center justify-center gap-2 group" title={language === 'ar' ? 'عرض كامل' : 'Fit to screen'}>
                    <Maximize2 className="w-5 h-5" />
                    <span className="text-[10px] font-bold hidden group-hover:inline md:hidden">{language === 'ar' ? 'عرض كامل' : 'Fit View'}</span>
                </button>
                <button onClick={() => setZoom(prev => Math.min(prev + 0.2, 2))} className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/20 transition-all">
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.3))} className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-white/20 transition-all">
                    <ZoomOut className="w-5 h-5" />
                </button>
            </div>

            {/* Map Container */}
            <div className="w-full h-full p-8 relative overflow-hidden cursor-move touch-none" dir="ltr">
                <motion.div 
                    drag
                    dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
                    dragElastic={0.1}
                    animate={{ scale: zoom }}
                    style={{ x, y }}
                    className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -ml-[400px] -mt-[400px] origin-center"
                >
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                        {nodes.map(node => {
                            if (!node.parentId) return null;
                            const parent = nodes.find(n => n.id === node.parentId);
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
                        {nodes.map(node => (
                            <motion.button
                                key={node.id}
                                layoutId={node.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ 
                                    scale: 1, 
                                    opacity: 1,
                                    x: node.x - node.size / 2,
                                    y: node.y - node.size / 2,
                                }}
                                whileHover={{ scale: 1.2, zIndex: 50 }}
                                onClick={() => setSelectedNode(node)}
                                className={cn(
                                    "absolute rounded-full flex items-center justify-center transition-shadow",
                                    node.type === 'seed' ? "bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" : "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                )}
                                style={{ width: node.size, height: node.size }}
                            >
                                <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                                
                                {/* Label */}
                                <div className={cn(
                                    "absolute top-full mt-2 whitespace-nowrap text-[10px] sm:text-xs font-bold text-white/40 group-hover:text-white group-hover:bg-black/50 px-2 py-1 rounded-full transition-all",
                                    language === 'ar' ? "right-1/2 translate-x-1/2" : "left-1/2 -translate-x-1/2"
                                )}>
                                    {node.text.slice(0, 15)}...
                                </div>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Selected Node Details */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className={cn(
                            "absolute bottom-8 z-30 w-full max-w-lg p-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] shadow-2xl",
                            language === 'ar' ? 'right-1/2 translate-x-1/2' : 'left-1/2 -translate-x-1/2'
                        )}
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                    >
                        <button onClick={() => setSelectedNode(null)} className="absolute top-4 right-4 text-white/50 hover:text-white">
                            <Maximize2 className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                selectedNode.type === 'seed' ? "bg-indigo-500 text-white" : "bg-emerald-500 text-white"
                            )}>
                                {selectedNode.type === 'seed' ? <Globe className="w-5 h-5" /> : <Network className="w-5 h-5" />}
                            </div>
                            <div>
                                <h4 className="text-white font-bold">{selectedNode.author}</h4>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                                    {selectedNode.type === 'seed' ? (language === 'ar' ? 'البذرة الأولى' : 'Origin Seed') : (language === 'ar' ? 'تطوير' : 'Evolution')}
                                </p>
                            </div>
                        </div>
                        <p className="text-white/90 font-medium line-clamp-3 mb-4">{selectedNode.text}</p>
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4 text-white/60 text-sm font-bold">
                                <span className="flex items-center gap-1"><Sparkles className="w-4 h-4 text-amber-400" /> {selectedNode.likes}</span>
                             </div>
                             <button 
                                onClick={() => onViewDetails(selectedNode.id)}
                                className="bg-white text-black px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-white/10"
                             >
                                {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                             </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
