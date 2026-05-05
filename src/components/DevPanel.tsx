import React, { useEffect, useState } from 'react';
import { Activity, X, AlertTriangle } from 'lucide-react';
import { perfMonitor } from '../lib/performance';
import { motion, AnimatePresence } from 'motion/react';

export default function DevPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    loadTime: 0,
    apiCalls: 0,
    slowCount: 0,
    avgAiTime: 0,
    recentSlow: [] as any[]
  });

  useEffect(() => {
    const updateStats = () => {
      const aiTimes = perfMonitor.aiResponseTimes.map((x: any) => x.time);
      const avg = aiTimes.length ? aiTimes.reduce((a: number, b: number) => a + b, 0) / aiTimes.length : 0;
      setStats({
        loadTime: perfMonitor.pageLoadTime,
        apiCalls: perfMonitor.apiCallsCount,
        slowCount: perfMonitor.slowOperations.length,
        avgAiTime: avg,
        recentSlow: perfMonitor.slowOperations.slice(-3).reverse()
      });
    };
    
    const handleAlert = (e: Event) => {
      const customEvent = e as CustomEvent;
      setAlerts(prev => [...prev, customEvent.detail]);
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== customEvent.detail.id));
      }, 5000); // clear after 5s
    };

    perfMonitor.addEventListener('update', updateStats);
    perfMonitor.addEventListener('alert', handleAlert);
    
    updateStats();
    return () => {
      perfMonitor.removeEventListener('update', updateStats);
      perfMonitor.removeEventListener('alert', handleAlert);
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[999] flex flex-col items-end gap-2 text-xs font-mono ltr" dir="ltr">
      <AnimatePresence>
        {alerts.map(alert => (
          <motion.div 
            key={alert.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`flex items-start gap-2 p-3 rounded-lg shadow-lg border text-white font-bold max-w-xs
              ${alert.type === 'warning' ? 'bg-orange-500/95 border-orange-400' : 'bg-blue-500/95 border-blue-400'}
            `}
          >
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span className="leading-relaxed whitespace-pre-wrap">{alert.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {isOpen && (
        <div className="bg-slate-900/95 text-emerald-400 p-4 rounded-xl shadow-lg border border-slate-700 w-72 mt-2 max-h-96 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-700">
            <span className="font-bold text-white flex items-center gap-2"><Activity size={14}/> DevPerf Panel</span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={14}/></button>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between"><span>Page Load:</span> <span className="text-white">{(stats.loadTime ).toFixed(0)} ms</span></div>
            <div className="flex justify-between"><span>API Calls:</span> <span className="text-white">{stats.apiCalls}</span></div>
            <div className="flex justify-between"><span>Avg AI Time:</span> <span className="text-white">{stats.avgAiTime.toFixed(0)} ms</span></div>
            <div className="flex justify-between"><span>Slow Ops (&gt;1s):</span> <span className="text-rose-400">{stats.slowCount}</span></div>
          </div>
          
          {stats.recentSlow.length > 0 && (
            <div className="space-y-3 border-t border-slate-700 pt-3">
              <div className="text-slate-400 font-bold mb-1 uppercase tracking-widest text-[10px]">Recent Root Causes</div>
              {stats.recentSlow.map((op, i) => (
                <div key={i} className="bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-rose-400">{op.name}</span>
                    <span className="text-slate-400">{(op.time / 1000).toFixed(1)}s</span>
                  </div>
                  <div className="text-slate-300 text-[10px] leading-tight">
                    {op.rootCause || "Unknown cause"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {!isOpen && (
        <div className="fixed bottom-0 right-10 w-24 h-6 bg-transparent hover:bg-slate-900/5 transition-all group flex items-end justify-center cursor-pointer rounded-t-lg" onClick={() => setIsOpen(true)}>
           <div className="w-8 h-1 bg-slate-300 rounded-full mb-2 group-hover:bg-emerald-400 group-hover:h-1.5 transition-all"></div>
        </div>
      )}
    </div>
  );
}
