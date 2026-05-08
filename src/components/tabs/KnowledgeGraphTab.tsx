import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Search, X, Sparkles, Zap, ArrowRight, BrainCircuit, Layout } from 'lucide-react';
import { TabHeader } from '../TabHeader';
import { cn } from '../../lib/utils';

export const KnowledgeGraphTab = ({ language, handleTabChange }: { language: string, handleTabChange: any }) => {
  const [history, setHistory] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tibyan_search_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(Array.from(new Set(parsed as string[])).slice(0, 12));
        }
      } catch (e) {}
    }
  }, []);

  const { nodes, edges } = useMemo(() => {
    const n: any[] = [];
    const e: any[] = [];
    const centerX = 400;
    const centerY = 300;

    // Center Node (Core Identity)
    n.push({ 
        id: 0, 
        x: centerX, 
        y: centerY, 
        label: language === 'ar' ? 'الوعي المركزي' : 'Core Consciousness', 
        type: 'core',
        description: language === 'ar' ? 'هذا هو مركزك المعرفي، نقطة الانطلاق لكل تساؤلاتك.' : 'This is your cognitive center, the starting point for all your queries.'
    });

    let activeHistory = history;
    if (activeHistory.length === 0) {
        activeHistory = [
            language === 'ar' ? 'الذكاء الاصطناعي' : 'AI',
            language === 'ar' ? 'فلسفة الوعي' : 'Philosophy of Consciousness',
            language === 'ar' ? 'التعلم المستمر' : 'Continuous Learning',
            language === 'ar' ? 'مستقبل التقنية' : 'Future of Tech'
        ];
    }

    activeHistory.forEach((query, index) => {
        // Use golden ratio or fixed angles for more deterministic layout
        const angle = (index / activeHistory.length) * Math.PI * 2;
        const radius = 180 + (index % 2 === 0 ? 40 : -40);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        n.push({ 
            id: index + 1, 
            x, 
            y, 
            label: query, 
            type: 'node',
            category: index % 3 === 0 ? 'concept' : index % 3 === 1 ? 'scientific' : 'philosophical'
        });
        
        // Primary connection to center
        e.push({ source: 0, target: index + 1, type: 'primary' });
        
        // Structural connections between nodes to form the "network"
        if (index > 0) {
            e.push({ source: index + 1, target: index, type: 'secondary' });
        }
        if (index === activeHistory.length - 1 && activeHistory.length > 2) {
            e.push({ source: index + 1, target: 1, type: 'secondary' });
        }
    });

    return { nodes: n, edges: e };
  }, [history, language]);

  const handleNodeClick = (node: any) => {
    if (node.type === 'core') {
        setSelectedNode(node);
        return;
    }
    setSelectedNode(node);
  };

  const executeSearch = (term: string) => {
    handleTabChange('oracle', term);
  };

  return (
    <div className="w-full bg-zinc-950 text-white min-h-[85vh] rounded-[32px] p-4 md:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_0%,transparent_70%)] pointer-events-none"></div>
      
      {/* Improved Exit Button - Repositioned for mobile to avoid overlap */}
      <div className="absolute top-4 inset-x-4 md:top-8 md:end-8 md:start-auto z-50 flex justify-between md:justify-end pointer-events-none">
        <div className="md:hidden" /> {/* Spacer for mobile */}
        <button 
          onClick={() => handleTabChange('home')} 
          className="px-6 py-2.5 md:py-3 bg-zinc-900 border border-zinc-700 text-white rounded-full font-black text-[10px] md:text-sm tracking-widest shadow-2xl flex items-center gap-2 hover:bg-zinc-800 transition-all active:scale-95 pointer-events-auto"
          title={language === 'ar' ? 'العودة للرئيسية' : 'Go Home'}
        >
          <ArrowRight className={cn("w-4 h-4 md:w-5 md:h-5", language === 'ar' ? "" : "rotate-180")} />
          {language === 'ar' ? 'الرجوع' : 'BACK'}
        </button>
      </div>

      {/* Left Content / Graph Area */}
      <div className="flex-1 flex flex-col relative z-10 pt-32 md:pt-0">
        <div className="mb-6 md:mb-10">
            <h2 className="text-3xl md:text-5xl font-black text-white flex items-center gap-4 tracking-tighter italic">
                <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                  <Network className="w-10 h-10 md:w-16 md:h-16 text-indigo-400" />
                </div>
                {language === 'ar' ? 'الشبكة العصبية المعرفية' : 'Neural Knowledge Graph'}
            </h2>
            <p className="text-zinc-400 font-medium mt-2 max-w-xl">
                {language === 'ar' 
                  ? 'تمثيل بصري تفاعلي لرحلتك المعرفية. الأفكار التي تبحث عنها تترابط لتشكل وعيك الرقمي.' 
                  : 'An interactive visual representation of your cognitive journey. Your search topics interconnect to form your digital consciousness.'}
            </p>
        </div>

        <div className="flex-1 relative w-full h-full min-h-[500px] border border-white/10 rounded-[32px] bg-black/40 backdrop-blur-sm overflow-hidden flex items-center justify-center group z-0">
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 800 600" 
            preserveAspectRatio="xMidYMid meet"
            className="touch-none absolute inset-0"
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Edges */}
            {edges.map((edge, i) => {
              const source = nodes.find(n => n.id === edge.source);
              const target = nodes.find(n => n.id === edge.target);
              if (!source || !target) return null;
              
              return (
                <motion.line
                  key={`edge-${i}`}
                  x1={source.x} y1={source.y} x2={target.x} y2={target.y}
                  stroke={edge.type === 'primary' ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.1)"} 
                  strokeWidth={edge.type === 'primary' ? "2" : "1"}
                  strokeDasharray={edge.type === 'secondary' ? "4 4" : "none"}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, delay: i * 0.05 }}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node, i) => {
              const isSelected = selectedNode?.id === node.id;
              
              return (
                <motion.g 
                  key={`node-${node.id}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: isSelected ? 1.1 : 1, 
                    opacity: 1 
                  }}
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(node)}
                >
                  {/* Invisible larger hit area */}
                  <circle cx={node.x} cy={node.y} r="40" fill="transparent" />
                  
                  {/* Circular Glow */}
                  {isSelected && (
                    <circle 
                      cx={node.x} cy={node.y} r={node.type === 'core' ? 45 : 25} 
                      fill="none" stroke="#6366f1" strokeWidth="2" 
                      className="animate-pulse opacity-40" 
                    />
                  )}

                  <circle 
                    cx={node.x} cy={node.y} 
                    r={node.type === 'core' ? 35 : 18} 
                    fill={node.type === 'core' ? '#6366f1' : isSelected ? '#4f46e5' : '#18181b'} 
                    stroke={node.type === 'core' ? '#818cf8' : isSelected ? '#818cf8' : '#3f3f46'} 
                    strokeWidth="3"
                    filter="url(#glow)"
                  />
                  
                  {node.type === 'core' && (
                    <motion.circle 
                      cx={node.x} cy={node.y} r="45" 
                      fill="none" stroke="#6366f1" strokeWidth="1" 
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: 1.2, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}

                  <text 
                    x={node.x} y={node.y + (node.type === 'core' ? 60 : 35)} 
                    textAnchor="middle" 
                    fill={isSelected ? "white" : "#a1a1aa"} 
                    fontSize={node.type === 'core' ? "16" : "12"} 
                    fontWeight={isSelected ? "900" : "bold"}
                    className="select-none pointer-events-none"
                  >
                    {node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label}
                  </text>
                </motion.g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Right Side Panel - Details */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="w-full md:w-80 lg:w-96 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-[32px] p-6 flex flex-col relative z-20 shadow-2xl"
          >
            <button 
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mt-8 flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-500/20 rounded-2xl">
                  {selectedNode.type === 'core' ? <BrainCircuit className="w-6 h-6 text-indigo-400" /> : <Sparkles className="w-6 h-6 text-indigo-400" />}
                </div>
                <h3 className="text-xl font-black">{selectedNode.label}</h3>
              </div>

              <div className="space-y-6">
                <p className="text-zinc-400 leading-relaxed font-medium">
                  {selectedNode.type === 'core' 
                    ? selectedNode.description 
                    : language === 'ar' 
                      ? `هذا المفهوم هو أحد ركائز اهتمامك حالياً. تم استكشافه وتوصيله بمركز وعيك المعرفي.` 
                      : `This concept is a pillar of your current interest. It has been explored and connected to your core cognitive center.`}
                </p>

                {selectedNode.type !== 'core' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                            {language === 'ar' ? 'ارتباطات نشطة' : 'Active Connections'}
                        </div>
                        <div className="flex flex-wrap gap-2">
                             <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 rounded-full text-xs font-bold">
                                {language === 'ar' ? 'بحث مباشر' : 'Live Search'}
                             </span>
                             <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 rounded-full text-xs font-bold">
                                {language === 'ar' ? 'محور اهتمام' : 'Interest Hub'}
                             </span>
                        </div>
                    </div>

                    <button 
                      onClick={() => executeSearch(selectedNode.label)}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20"
                    >
                      <Search className="w-5 h-5" />
                      {language === 'ar' ? 'استشارة تبيان العميقة' : 'Consult Tibyan Deeply'}
                    </button>
                    
                    <button 
                      onClick={() => executeSearch(selectedNode.label)}
                      className="w-full py-2 group/tibyan bg-white/5 rounded-xl border border-white/5 hover:border-indigo-500/40 transition-all"
                    >
                      <p className="text-[12px] text-zinc-400 group-hover/tibyan:text-indigo-400 font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                          {language === 'ar' ? 'متابعة التحليل في تبيان' : 'CONTINUE ANALYSIS IN TIBYAN'}
                          <ArrowRight className={cn("w-3 h-3", language === 'ar' ? "rotate-180" : "")} />
                      </p>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-zinc-500 inline-flex items-center gap-2">
               <Zap className="w-4 h-4 text-amber-400" />
               {language === 'ar' ? 'البيانات حية وتتطور ببحثك المستمر' : 'Data is live and evolves with your search'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedNode && (
        <div className="hidden md:flex w-80 lg:w-96 flex-col justify-center items-center text-center p-8 space-y-6">
           <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
               <ArrowRight className={cn("w-8 h-8 text-zinc-700", language === 'ar' ? "rotate-180" : "")} />
           </div>
           <p className="text-zinc-500 font-bold">
               {language === 'ar' ? 'اضغط على أي خلية عصبية لاستكشاف تفاصيلها وارتباطاتها.' : 'Click on any neuron to explore its details and connections.'}
           </p>
        </div>
      )}
    </div>
  );
};

