import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Network, Search, X } from 'lucide-react';
import { TabHeader } from '../TabHeader';

export const KnowledgeGraphTab = ({ language, handleTabChange }: { language: string, handleTabChange: any }) => {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('tibyan_search_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved).slice(0, 15)); // Limit to last 15 for graph
      } catch (e) {}
    }
  }, []);

  const { nodes, edges } = useMemo(() => {
    const n = [];
    const e = [];
    const centerX = 400;
    const centerY = 300;

    // Center Node (User Consciousness)
    n.push({ id: 0, x: centerX, y: centerY, label: language === 'ar' ? 'الوعي المركزي' : 'Core Consciousness', type: 'core' });

    history.forEach((query, index) => {
        const radius = 100 + Math.random() * 150;
        const angle = (index / history.length) * Math.PI * 2 + Math.random() * 0.5;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        n.push({ id: index + 1, x, y, label: query.substring(0, 20) + (query.length > 20 ? '...' : ''), type: 'node' });
        // Connect to center
        e.push({ source: 0, target: index + 1 });
        
        // Randomly connect some nodes to each other to form a network
        if (index > 0 && Math.random() > 0.6) {
            e.push({ source: index + 1, target: index });
        }
    });

    return { nodes: n, edges: e };
  }, [history, language]);

  return (
    <div className="w-full bg-zinc-950 text-white min-h-[85vh] rounded-[32px] p-8 shadow-2xl relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-screen pointer-events-none"></div>
      
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
                <Network className="w-8 h-8 text-indigo-400" />
                {language === 'ar' ? 'الشبكة العصبية المعرفية' : 'Personal Knowledge Graph'}
            </h2>
            <p className="text-zinc-400 font-medium mt-2">
                {language === 'ar' ? 'خريطة ذهنية حية لاهتماماتك وكيفية ترابط أفكارك وبحثك بمرور الزمن.' : 'A live mental map of your interests and how your thoughts interconnect over time.'}
            </p>
        </div>
        <button 
          onClick={() => handleTabChange('discover', '', true)} 
          className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative w-full h-full min-h-[500px] border border-white/10 rounded-3xl bg-black/50 overflow-hidden shadow-inner flex items-center justify-center">
         {history.length === 0 ? (
            <div className="text-center text-zinc-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{language === 'ar' ? 'ابدأ البحث والتحليل لتغذية شبكتك العصبية.' : 'Start searching to feed your neural network.'}</p>
            </div>
         ) : (
             <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
                {/* Edges */}
                {edges.map((edge, i) => {
                    const source = nodes.find(n => n.id === edge.source);
                    const target = nodes.find(n => n.id === edge.target);
                    if (!source || !target) return null;
                    return (
                        <motion.line
                            key={`edge-${i}`}
                            x1={source.x} y1={source.y} x2={target.x} y2={target.y}
                            stroke="rgba(255,255,255,0.1)" strokeWidth="2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, delay: i * 0.1 }}
                        />
                    );
                })}
                {/* Nodes */}
                {nodes.map((node, i) => (
                    <motion.g 
                        key={`node-${node.id}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', delay: i * 0.1 + 0.5 }}
                    >
                        <circle 
                            cx={node.x} cy={node.y} 
                            r={node.type === 'core' ? 30 : 15} 
                            fill={node.type === 'core' ? '#6366f1' : '#18181b'} 
                            stroke={node.type === 'core' ? '#818cf8' : '#3f3f46'} strokeWidth="3"
                        />
                        {node.type === 'core' && (
                            <circle cx={node.x} cy={node.y} r="40" fill="none" stroke="#6366f1" strokeWidth="1" className="animate-ping opacity-20" />
                        )}
                        <text 
                            x={node.x} y={node.y + (node.type === 'core' ? 50 : 30)} 
                            textAnchor="middle" fill="#a1a1aa" fontSize={node.type === 'core' ? "16" : "12"} fontWeight="bold"
                        >
                            {node.label}
                        </text>
                    </motion.g>
                ))}
             </svg>
         )}
      </div>
    </div>
  );
};
