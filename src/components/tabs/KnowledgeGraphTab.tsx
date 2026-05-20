import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Search, X, Sparkles, Zap, ArrowRight, BrainCircuit, Lightbulb, Beaker, Bookmark, Link2 } from 'lucide-react';
import { TebyanEmptyState } from '../common/TebyanEmptyState';
import { TabHeader } from '../TabHeader';
import { cn } from '../../lib/utils';

export const KnowledgeGraphTab = ({ language, handleTabChange }: { language: string, handleTabChange: any }) => {
  const [history, setHistory] = useState<string[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]);
  const [timeEra, setTimeEra] = useState<number>(3); // 1: Past, 2: Recent, 3: Present, 4: Future
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tebyan_search_history');
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
        label: language === 'ar' ? 'عقلك الاستراتيجي' : 'Strategic Mind', 
        type: 'core',
        description: language === 'ar' ? 'هذا هو مركزك المعرفي، يعكس اهتماماتك وتوجهاتك.' : 'This is your cognitive center, reflecting your interests and drifts.'
    });

    let activeHistory = history;
    if (activeHistory.length === 0) {
        activeHistory = [
            language === 'ar' ? 'الذكاء الاصطناعي' : 'AI',
            language === 'ar' ? 'الابتكار المؤسسي' : 'Corporate Innovation',
            language === 'ar' ? 'إدارة الأزمات' : 'Crisis Management',
            language === 'ar' ? 'فلسفة القيادة' : 'Leadership Philosophy'
        ];
    }

    // Time-based layout constraints
    const scaleFactor = timeEra === 1 ? 0.6 : timeEra === 2 ? 0.8 : timeEra === 3 ? 1 : 1.3;
    const visibleCount = timeEra === 1 ? Math.min(3, activeHistory.length) : 
                         timeEra === 2 ? Math.min(6, activeHistory.length) : 
                         activeHistory.length;

    const uniqueNodes = new Map();
    activeHistory.slice(0, visibleCount).forEach((query, index) => {
        if (uniqueNodes.has(query)) return;

        const angle = (index / visibleCount) * Math.PI * 2;
        // Make radius change with time, but also vary a bit
        const baseRadius = 180 * scaleFactor;
        const radius = baseRadius + (index % 2 === 0 ? 40 * scaleFactor : -40 * scaleFactor);
        const x = centerX + Math.cos(angle) * (timeEra === 4 ? radius + (Math.random() * 20 - 10) : radius);
        const y = centerY + Math.sin(angle) * (timeEra === 4 ? radius + (Math.random() * 20 - 10) : radius);

        const newNode = { 
            id: index + 1, 
            x, 
            y, 
            label: query, 
            type: 'node',
            category: index % 3 === 0 ? 'concept' : index % 3 === 1 ? 'scientific' : 'philosophical'
        };
        uniqueNodes.set(query, newNode);
        n.push(newNode);
        
        e.push({ source: 0, target: newNode.id, type: 'primary' });
        
        if (n.length > 2 && timeEra >= 2) { // Adjusted indices reference to use the unique node IDs
             e.push({ source: newNode.id, target: n[n.length-2].id, type: 'secondary' });
        }
    });

    if (timeEra === 4) {
        n.push({
            id: 999,
            x: centerX + 260,
            y: centerY - 250,
            label: language === 'ar' ? 'الوعي الجمعي (عقدة ذهبية)' : 'Collective Consciousness (Golden)',
            type: 'golden',
            category: 'philosophical'
        });
        e.push({ source: 0, target: 999, type: 'primary' });
        if (n.length > 2) {
            e.push({ source: 1, target: 999, type: 'secondary' });
        }
    }

    return { nodes: n, edges: e };
  }, [history, language, timeEra]);

  const handleNodeClick = (node: any) => {
    if (node.type === 'core') return;
    
    if (selectedNodes.find(n => n.id === node.id)) {
        setSelectedNodes(prev => prev.filter(n => n.id !== node.id));
    } else {
        if (selectedNodes.length >= 2) {
            setSelectedNodes([selectedNodes[1], node]);
        } else {
            setSelectedNodes([...selectedNodes, node]);
        }
    }
  };

  const saveNode = (node: any) => {
    try {
      const saved = JSON.parse(localStorage.getItem('tebyan_saved_nodes') || '[]');
      const item = { id: `node-${Date.now()}`, title: node.label, type: node.category || node.type || 'idea', createdAt: new Date().toISOString() };
      localStorage.setItem('tebyan_saved_nodes', JSON.stringify([item, ...saved].slice(0, 50)));
    } catch (e) {}
  };

  const executeSearch = (term: string) => {
    handleTabChange('oracle', term);
  };

  const executeMerge = () => {
    if (selectedNodes.length !== 2) return;
    const mergeTerm = language === 'ar' 
        ? `ابحث عن التقاطع العبقري والحلول المبتكرة عند دمج: "${selectedNodes[0].label}" مع "${selectedNodes[1].label}"`
        : `Find the genius intersection and innovative solutions when merging: "${selectedNodes[0].label}" with "${selectedNodes[1].label}"`;
    handleTabChange('oracle', mergeTerm);
  };

  const getEraLabel = (val: number) => {
      switch(val) {
          case 1: return language === 'ar' ? 'التسعينات' : '1990s';
          case 2: return language === 'ar' ? '2010' : '2010s';
          case 3: return language === 'ar' ? 'الآن' : 'Now';
          case 4: return language === 'ar' ? 'المستقبل' : '2050';
          default: return '';
      }
  };

  return (
    <div className="w-full bg-[#FBFAF7] text-[#182231] min-h-[85vh] rounded-[32px] p-4 md:p-8 shadow-[0_24px_80px_rgba(142,122,174,0.12)] relative overflow-hidden flex flex-col md:flex-row gap-6 border border-[#E9E2F1]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(142,122,174,0.12)_0%,transparent_70%)] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-overlay"></div>
      
      <div className="absolute top-4 inset-x-4 md:top-8 md:end-8 md:start-auto z-50 flex justify-between md:justify-end">
        <div className="md:hidden" />
        <button 
          onClick={() => handleTabChange('home', '', true)} 
          className="px-6 py-2.5 md:py-3 bg-white border border-[#E6E1EA] text-[#7C8796] rounded-full font-black text-[10px] md:text-sm tracking-widest shadow-2xl flex items-center gap-2 hover:bg-[#F7F3FB] hover:text-[#8E7AAE] transition-all active:scale-95 pointer-events-auto cursor-pointer"
        >
          <ArrowRight className={cn("w-4 h-4 md:w-5 md:h-5", language === 'ar' ? "" : "rotate-180")} />
          {language === 'ar' ? 'الرجوع' : 'BACK'}
        </button>
      </div>

      <div className="flex-1 flex flex-col relative z-10 pt-32 md:pt-0">
        <div className="mb-6 md:mb-10 pl-2">
            <h2 className="text-3xl md:text-5xl font-black text-[#182231] flex items-center gap-4 tracking-tighter italic">
                <div className="p-3 bg-[#F1ECF7] rounded-2xl border border-[#E8E2F1] flex items-center justify-center shrink-0">
                  <Network className="w-10 h-10 md:w-16 md:h-16 text-[#8E7AAE]" />
                </div>
                <div className="flex-1 min-w-0 pb-1 pt-1">
                  <div className="bg-gradient-to-r from-[#182231] to-[#8E7AAE] bg-clip-text text-transparent leading-tight">
                    {language === 'ar' ? 'البصمة المعرفية' : 'Cognitive Blueprint'}
                  </div>
                  <div className="text-sm md:text-lg text-[#8E7AAE] font-bold not-italic tracking-normal mt-1">
                    {language === 'ar' ? 'مختبر دمج الأفكار' : 'Ideas Fusion Lab'}
                  </div>
                </div>
            </h2>
            <div className="mt-6 p-5 rounded-2xl bg-white/70 border border-[#E9E2F1] backdrop-blur-sm max-w-3xl">
                <p className="text-[#6F7785] font-medium leading-relaxed md:text-lg text-justify">
                    {language === 'ar' 
                      ? 'هنا لا نعطيك مجرد إجابات مُعلبة، بل نُريك المجرة المعرفية المحيطة بها. الأفكار لا تعيش في عزلة.. اكتشف الروابط الخفية بين قراراتك، وكيف يمكن لفكرة واحدة أن تفتح لك مسارات لم تكن تتوقعها.' 
                      : 'Here we don’t just give you canned answers; we show you the cognitive galaxy surrounding them. Ideas don’t live in isolation. Discover the hidden connections between your decisions.'}
                </p>
                <div className="mt-4 flex items-center gap-3 text-[#5A8C75] font-bold text-sm">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span>{language === 'ar' ? 'تحليل شبكتك: تتركز اهتماماتك بقوة حول مفاهيمك الحالية، استكشف لربطها وتوسيع مداركك.' : 'Network Analysis: Your focus is strong on current concepts, merge them to expand your mindset.'}</span>
                </div>
            </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <button type="button" onClick={() => setViewMode('map')} className={cn('px-4 py-2 rounded-full text-xs font-black border transition-all', viewMode === 'map' ? 'bg-[#8E7AAE] text-[#182231] border-[#8E7AAE]' : 'bg-white text-[#64788D] border-[#8FA9C7]/18')}>{language === 'ar' ? 'خريطة الوعي' : 'Mind map'}</button>
          <button type="button" onClick={() => setViewMode('list')} className={cn('px-4 py-2 rounded-full text-xs font-black border transition-all', viewMode === 'list' ? 'bg-[#8E7AAE] text-[#182231] border-[#8E7AAE]' : 'bg-white text-[#64788D] border-[#8FA9C7]/18')}>{language === 'ar' ? 'العرض التقليدي' : 'List view'}</button>
        </div>

        {viewMode === 'list' && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {nodes.filter(n => n.type !== 'core').map(node => (
              <button key={node.id} type="button" onClick={() => handleNodeClick(node)} className="text-right rounded-2xl border border-[#8FA9C7]/16 bg-white/80 p-4 hover:border-[#8E7AAE]/30 transition-all">
                <p className="text-[10px] font-black tracking-widest text-[#8E7AAE] mb-1">{node.category || node.type}</p>
                <h4 className="font-black text-[#182231]">{node.label}</h4>
                <p className="text-xs font-bold text-[#7C8796] mt-2">{language === 'ar' ? 'اضغط لفتح البطاقة الجانبية والروابط.' : 'Tap to open the side card and links.'}</p>
              </button>
            ))}
          </div>
        )}

        {viewMode === 'map' && <div className="flex-1 relative w-full h-full min-h-[500px] border border-[#E9E2F1] rounded-[32px] bg-white/70 shadow-inner overflow-hidden flex items-center justify-center group z-0">
          {history.length === 0 && (
            <div className="absolute top-6 left-6 right-6 z-20 pointer-events-auto">
              <TebyanEmptyState
                language={language}
                icon={Network}
                title={language === 'ar' ? 'شبكتك المعرفية تبدأ من أول سؤال' : 'Your knowledge network starts with one question'}
                description={language === 'ar' ? 'هذه الخريطة ستبني روابطها تلقائياً من أسئلتك وقراراتك القادمة.' : 'This map will build itself from your next questions and decisions.'}
                actionLabel={language === 'ar' ? 'اسأل أول سؤال' : 'Ask first question'}
                onAction={() => handleTabChange('discover')}
                className="p-5 md:p-6 shadow-sm"
              />
            </div>
          )}
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 800 600" 
            preserveAspectRatio="xMidYMid meet"
            className="touch-none absolute inset-0"
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Premium Organic Wisdom Gradients */}
              <radialGradient id="parchmentGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FAF6EE" />
                <stop offset="60%" stopColor="#E6DBBF" />
                <stop offset="100%" stopColor="#C9B88E" />
              </radialGradient>
              
              <radialGradient id="goldenGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FFEFAA" />
                <stop offset="50%" stopColor="#DFB247" />
                <stop offset="100%" stopColor="#9C771E" />
              </radialGradient>
              
              <radialGradient id="coreGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="60%" stopColor="#4338CA" />
                <stop offset="100%" stopColor="#1E1B4B" />
              </radialGradient>
              
              <radialGradient id="selectedGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#6EE7B7" />
                <stop offset="60%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#064E3B" />
              </radialGradient>
            </defs>

            {edges.map((edge, i) => {
              const source = nodes.find(n => n.id === edge.source);
              const target = nodes.find(n => n.id === edge.target);
              if (!source || !target) return null;
              
              const isSourceSelected = selectedNodes.find(n => n.id === source.id);
              const isTargetSelected = selectedNodes.find(n => n.id === target.id);
              const isBothSelected = isSourceSelected && isTargetSelected;
              // Visual Ripple Effect: if ONLY ONE node is selected, highlight edges connected to it
              const isRipple = selectedNodes.length === 1 && (isSourceSelected || isTargetSelected);

              return (
                <motion.line
                  key={`edge-${edge.source}-${edge.target}`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    x1: source.x, y1: source.y, 
                    x2: target.x, y2: target.y,
                    pathLength: 1, 
                    opacity: 1, 
                    strokeDashoffset: isRipple ? [0, -24] : 0 
                  }}
                  stroke={isBothSelected ? "rgba(52,211,153,0.8)" : isRipple ? "rgba(142,122,174,0.55)" : edge.type === 'primary' ? "rgba(142,122,174,0.22)" : "rgba(142,122,174,0.10)"} 
                  strokeWidth={isBothSelected ? "3" : isRipple ? "2.5" : edge.type === 'primary' ? "2" : "1"}
                  strokeDasharray={isRipple ? "8 4" : edge.type === 'secondary' ? "4 4" : "none"}
                  transition={{ 
                    duration: 0.8,
                    pathLength: { duration: 2, delay: i * 0.05 },
                    opacity: { duration: 2, delay: i * 0.05 },
                    strokeDashoffset: { repeat: Infinity, duration: 1, ease: "linear" } 
                  }}
                />
              );
            })}

            {nodes.map((node, i) => {
              const isSelected = selectedNodes.find(n => n.id === node.id);
              const isGolden = node.type === 'golden';
              const baseFillUrl = node.type === 'core' ? 'url(#coreGrad)' : isGolden ? 'url(#goldenGrad)' : isSelected ? 'url(#selectedGrad)' : 'url(#parchmentGrad)';
              const strokeColor = node.type === 'core' ? '#818cf8' : isGolden ? '#b45309' : isSelected ? '#10b981' : '#8c7d5c';
              const isRippleTarget = selectedNodes.length === 1 && edges.some(e => 
                 (e.source === selectedNodes[0].id && e.target === node.id) || 
                 (e.target === selectedNodes[0].id && e.source === node.id)
              );
              
              return (
                <motion.g 
                  key={`node-${node.id}`}
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ 
                    scale: isSelected ? 1.2 : isRippleTarget ? 1.1 : 1, 
                    opacity: 1,
                    y: 0
                  }}
                  style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                  whileHover={{ scale: 1.15 }}
                  transition={{ duration: 0.8, type: 'spring', stiffness: 300, damping: 20 }}
                  className={node.type !== 'core' ? "cursor-pointer" : ""}
                  onClick={() => handleNodeClick(node)}
                >
                  <motion.circle animate={{ cx: node.x, cy: node.y }} transition={{ duration: 0.8 }} r="45" fill="transparent" />
                  
                  {isSelected && (
                    <motion.circle 
                      animate={{ cx: node.x, cy: node.y, scale: [1, 2], opacity: [0.5, 0] }} 
                      r={isGolden ? 32 : 28} 
                      fill="none" stroke="#34d399" strokeWidth="2" 
                      transition={{ 
                         cx: { duration: 0.8 }, 
                         cy: { duration: 0.8 }, 
                         scale: { duration: 1.5, repeat: Infinity, ease: "easeOut" },
                         opacity: { duration: 1.5, repeat: Infinity, ease: "easeOut" }
                      }}
                      style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                    />
                  )}

                  <motion.circle 
                    animate={{ 
                      cx: node.x, 
                      cy: [node.y - 4, node.y + 4, node.y - 4] 
                    }}
                    transition={{ 
                      cx: { duration: 0.8 },
                      cy: { repeat: Infinity, duration: 4 + (i % 3) * 1.5, ease: "easeInOut" }
                    }}
                    r={node.type === 'core' ? 38 : isGolden ? 24 : 20} 
                    fill={baseFillUrl} 
                    stroke={strokeColor} 
                    strokeWidth="3"
                    filter="url(#glow)"
                  />
                  
                  <title>{node.label}</title>
                  
                  {node.type === 'core' && (
                    <motion.circle 
                      r="50" 
                      fill="none" stroke="#6366f1" strokeWidth="1" 
                      animate={{ cx: node.x, cy: node.y, scale: [0.8, 1.4], opacity: [0.8, 0] }}
                      transition={{ 
                         cx: { duration: 0.8 }, 
                         cy: { duration: 0.8 }, 
                         scale: { duration: 2.5, repeat: Infinity, ease: "easeOut" },
                         opacity: { duration: 2.5, repeat: Infinity, ease: "easeOut" }
                      }}
                      style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                    />
                  )}

                  {isGolden && (
                     <motion.circle 
                      r="30" 
                      fill="none" stroke="#fbbf24" strokeWidth="1" 
                      animate={{ cx: node.x, cy: node.y, scale: [0.8, 1.5], opacity: [0.8, 0] }}
                      transition={{ 
                         cx: { duration: 0.8 }, 
                         cy: { duration: 0.8 }, 
                         scale: { duration: 1.5, repeat: Infinity, ease: "easeOut" },
                         opacity: { duration: 1.5, repeat: Infinity, ease: "easeOut" }
                      }}
                      style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                    />
                  )}

                  <motion.text 
                    animate={{ 
                      x: node.x, 
                      y: [
                        node.y + (node.type === 'core' ? 61 : isGolden ? 41 : 36), 
                        node.y + (node.type === 'core' ? 69 : isGolden ? 49 : 44), 
                        node.y + (node.type === 'core' ? 61 : isGolden ? 41 : 36)
                      ]
                    }}
                    transition={{ 
                      x: { duration: 0.8 },
                      y: { repeat: Infinity, duration: 4 + (i % 3) * 1.5, ease: "easeInOut" }
                    }}
                    textAnchor="middle" 
                    fill={isSelected ? "#34d399" : isGolden ? "#fcd34d" : node.type === 'core' ? "white" : "#a1a1aa"} 
                    fontSize={node.type === 'core' ? "18" : isGolden ? "15" : "13"} 
                    fontWeight={isSelected || node.type === 'core' || isGolden ? "900" : "bold"}
                    className="select-none pointer-events-none drop-shadow-md"
                  >
                    {isSelected ? node.label : (node.label.length > 25 ? node.label.substring(0, 25) + '...' : node.label)}
                  </motion.text>
                </motion.g>
              );
            })}
          </svg>

          {/* Time Traveling Slider */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[85%] md:w-[60%] z-40 bg-zinc-900/90 backdrop-blur-xl border border-[#8FA9C7]/18 rounded-full p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
             <div className="w-full flex items-center justify-between gap-4">
                 <span className={cn("text-xs md:text-sm font-bold min-w-[60px] text-center", timeEra === 1 ? "text-[#8E7AAE]" : "text-[#8E7AAE]")}>
                     {getEraLabel(1)}
                 </span>
                 <input 
                    type="range" 
                    min="1" max="4" 
                    value={timeEra} 
                    onChange={e => setTimeEra(parseInt(e.target.value))} 
                    className="flex-1 accent-indigo-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
                 />
                 <span className={cn("text-xs md:text-sm font-bold min-w-[60px] text-center", timeEra === 4 ? "text-amber-400" : "text-[#8E7AAE]")}>
                    {getEraLabel(4)}
                 </span>
             </div>
             <div className="text-[10px] md:text-xs font-medium text-[#7C8796] whitespace-nowrap text-center">
                 {language === 'ar' ? 'رحلة الأفكار عبر الزمن' : 'Time-Traveling Concepts'}
             </div>
          </div>
        </div>}
      </div>

      <AnimatePresence mode="wait">
        {selectedNodes.length > 0 && (
          <motion.div 
            key={selectedNodes.length}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0 }}
            className="w-full md:w-[350px] lg:w-[400px] bg-white/88 border border-[#8FA9C7]/18 rounded-[32px] p-6 flex flex-col relative z-20 shadow-[0_24px_80px_rgba(24,34,49,0.10)] backdrop-blur-xl"
          >
            <button 
              onClick={() => setSelectedNodes([])}
              className="absolute top-4 right-4 p-2 bg-[#F7F5F2] rounded-full hover:bg-[#F1EEF4] text-[#64788D] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedNodes.length === 1 ? (
                <>
                    <div className="mt-8 flex-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className={cn("p-3 rounded-2xl border", selectedNodes[0].type === 'golden' ? "bg-amber-500/20 border-amber-500/20" : "bg-emerald-500/20 border-emerald-500/20")}>
                                {selectedNodes[0].type === 'golden' ? <Sparkles className="w-6 h-6 text-amber-400" /> : <Lightbulb className="w-6 h-6 text-[#5A8C75]" />}
                            </div>
                            <h3 className="text-2xl font-black">{selectedNodes[0].label}</h3>
                        </div>

                        <div className="space-y-6">
                            <p className="text-[#7C8796] leading-relaxed font-medium">
                            {selectedNodes[0].type === 'golden' ? (language === 'ar' ? 'لقد اكتشفت عقدة ذهبية! هذا المفهوم نادر ويظهر عند توسيع مداركك في المستقبل.' : 'You discovered a Golden Node! This rare concept appears when expanding your future mindset.') : (language === 'ar' 
                                ? `أحد المفاهيم الحيوية في شبكتك. إنها نقطة قوة تشكلت من بحثك المسبق. ماذا لو تم دمجها مع مجال آخر لا علاقة له بها؟ الإشعاع الذي تراه هو "استشراف الأثر"، هكذا تتأثر باقي شبكتك بهذا المفهوم.` 
                                : `A vital concept in your network. It's a strength carved by your searches. What if you merged it with an unrelated field? The pulse you see is the "Ripple Effect", showing how decisions impact the whole map.`)}
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="rounded-2xl bg-[#FBFAF7] border border-[#8FA9C7]/16 p-3">
                                <p className="text-[10px] font-black text-[#8E7AAE] mb-1">{language === 'ar' ? 'نوع العقدة' : 'Node type'}</p>
                                <p className="text-sm font-black text-[#182231]">{selectedNodes[0].category || selectedNodes[0].type || (language === 'ar' ? 'فكرة' : 'Idea')}</p>
                              </div>
                              <div className="rounded-2xl bg-[#FBFAF7] border border-[#8FA9C7]/16 p-3">
                                <p className="text-[10px] font-black text-[#8E7AAE] mb-1">{language === 'ar' ? 'التاريخ' : 'Date'}</p>
                                <p className="text-sm font-black text-[#182231]">{new Date().toLocaleDateString(language === 'ar' ? 'ar-KW' : 'en-US')}</p>
                              </div>
                            </div>

                            <div className="p-5 bg-[#F7F5F2] rounded-2xl border border-[#8FA9C7]/18 shadow-inner">
                                <div className={cn("text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2", selectedNodes[0].type === 'golden' ? "text-amber-400" : "text-[#5A8C75]")}>
                                    <Sparkles className="w-4 h-4" />
                                    {language === 'ar' ? 'دعوة للابتكار' : 'Call for Innovation'}
                                </div>
                                <p className="text-sm font-bold text-[#182231] mb-4">
                                    {language === 'ar' ? 'اسحب عقلك لنقطة أبعد. اضغط على فقاعة أخرى في الشاشة لدمجها واكتشاف منطقة العبقرية.' : 'Stretch your mind further. Tap another bubble to merge and discover the genius zone.'}
                                </p>
                            </div>

                            <button 
                            onClick={() => executeSearch(selectedNodes[0].label)}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-[#8E7AAE] hover:bg-[#806D9F] text-[#182231] rounded-2xl font-black transition-all active:scale-[0.98] border border-white/5"
                            >
                            <Search className="w-5 h-5" />
                            {language === 'ar' ? 'استكشاف هذا المفهوم منفرداً' : 'Explore Singly'}
                            </button>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button onClick={() => saveNode(selectedNodes[0])} className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-[#8FA9C7]/18 text-[#465568] rounded-2xl font-black text-sm transition-all active:scale-[0.98]">
                                <Bookmark className="w-4 h-4" /> {language === 'ar' ? 'احفظ العقدة' : 'Save node'}
                              </button>
                              <button onClick={() => setSelectedNodes(prev => prev.slice(0,1))} className="w-full flex items-center justify-center gap-2 py-3 bg-[#F1EEF4] border border-[#8E7AAE]/16 text-[#6E5F8E] rounded-2xl font-black text-sm transition-all active:scale-[0.98]">
                                <Link2 className="w-4 h-4" /> {language === 'ar' ? 'اربط بفكرة أخرى' : 'Link another idea'}
                              </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="mt-8 flex-1 flex flex-col justify-center">
                        <div className="text-center mb-6">
                            <div className="inline-flex p-4 bg-indigo-500/20 rounded-full border border-indigo-500/20 mb-4 animate-pulse">
                                <Beaker className="w-10 h-10 text-[#8E7AAE]" />
                            </div>
                            <h3 className="text-2xl font-black text-[#182231]">
                                {language === 'ar' ? 'اصطدام الأفكار' : 'Idea Collider'}
                            </h3>
                        </div>

                        <div className="relative flex flex-col items-center gap-4 my-8">
                            <div className={cn("w-full p-4 border rounded-2xl text-center shadow-lg transform -rotate-2", selectedNodes[0].type === 'golden' ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20")}>
                                <span className={cn("font-bold", selectedNodes[0].type === 'golden' ? "text-amber-300" : "text-emerald-300")}>{selectedNodes[0].label}</span>
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-4 border-[#F7F5F2] z-10 text-[#8E7AAE] font-bold text-sm">
                                +
                            </div>
                            <div className={cn("w-full p-4 border rounded-2xl text-center shadow-lg transform rotate-2", selectedNodes[1].type === 'golden' ? "bg-amber-500/10 border-amber-500/20" : "bg-cyan-500/10 border-cyan-500/20")}>
                                <span className={cn("font-bold", selectedNodes[1].type === 'golden' ? "text-amber-300" : "text-cyan-300")}>{selectedNodes[1].label}</span>
                            </div>
                        </div>

                        <p className="text-[#7C8796] text-center font-medium mb-8 text-sm leading-relaxed">
                            {language === 'ar' 
                                ? 'دعنا نضع هذين المفهومين في محرك "المستشار الكلي" لنستخرج منهما ابتكاراً جديداً يعطيك أفضلية استراتيجية. لم يسبق لأحد أن دمج هذين المسارين بهذا العمق!' 
                                : 'Let’s put these two concepts in the "Omni Counselor" to extract a new innovation giving you a strategic edge. Seldom has anyone merged these paths this deeply!'}
                        </p>

                        <button 
                            onClick={executeMerge}
                            className="w-full flex items-center justify-center gap-3 py-5 bg-[#8E7AAE] hover:bg-[#806D9F] text-white rounded-2xl font-black transition-all active:scale-[0.98] shadow-xl shadow-emerald-500/20 text-lg"
                        >
                            <Sparkles className="w-6 h-6" />
                            {language === 'ar' ? 'توليد الابتكار الآن' : 'Generate Innovation Now'}
                        </button>
                    </div>
                </>
            )}
            
            <div className="mt-6 text-center text-xs text-[#7C8796] font-medium">
               {language === 'ar' ? 'خوارزمية تبيان للربط الإبداعي' : 'Tibyan Creative Connect Algorithm'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



