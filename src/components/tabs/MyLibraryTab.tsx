import React from 'react';
import { useUser } from '../../contexts/UserContext';
import { motion } from 'motion/react';
import { LibraryBig, Shirt, Trash2, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';

const MoodCloud = ({ items, language }: { items: any[], language: string }) => {
  const counts = items.reduce((acc: any, item: any) => {
    const type = (item && typeof item === 'object' ? item.type : 'item') || 'item';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeData: Record<string, { color: string, labelAr: string, labelEn: string }> = {
    'qawlfasl': { color: 'bg-emerald-500', labelAr: 'قول فصل', labelEn: 'Decision' },
    'oracle': { color: 'bg-indigo-500', labelAr: 'المستشار', labelEn: 'Oracle' },
    'concept': { color: 'bg-amber-500', labelAr: 'الأفكار', labelEn: 'Concepts' },
    'roadmap': { color: 'bg-rose-500', labelAr: 'المسار', labelEn: 'Roadmap' },
    'item': { color: 'bg-zinc-500', labelAr: 'مادة', labelEn: 'Items' }
  };

  return (
    <div className="flex flex-wrap gap-4 mb-16 justify-center">
       {Object.entries(counts).map(([type, count]: [any, any]) => (
         <motion.div
           key={type}
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           whileHover={{ y: -5, scale: 1.05 }}
           className={cn(
             "px-6 py-4 rounded-[32px] flex items-center gap-4 shadow-xl border-4 border-white text-white",
             typeData[type]?.color || 'bg-zinc-500'
           )}
         >
           <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black text-xl">
             {count}
           </div>
           <span className="font-black text-xs uppercase tracking-[0.2em]">
             {language === 'ar' ? (typeData[type]?.labelAr || type) : (typeData[type]?.labelEn || type)}
           </span>
         </motion.div>
       ))}
    </div>
  );
};

const MyLibraryTab = ({ language = 'ar', handleTabChange }: { language?: string, handleTabChange?: (id: string, context?: string) => void }) => {
    const { preferences, removeFromLibrary } = useUser();
    
    return (
        <div className="p-6 pb-32">
            <div className="flex items-center justify-between mb-12">
                <div className="space-y-1">
                  <h2 className="text-4xl font-black tracking-tight">{language === 'ar' ? 'قصر الذاكرة' : 'Memory Palace'}</h2>
                  <p className="text-zinc-500 font-bold text-sm tracking-widest uppercase">{language === 'ar' ? 'مخزن الأفكار المُلهمة والمسارات المحفوظة' : 'Storehouse of inspiring ideas and saved paths'}</p>
                </div>
                {handleTabChange && (
                    <button 
                        onClick={() => handleTabChange('discover')}
                        className="px-6 py-3 bg-white border border-zinc-200 hover:border-black hover:bg-zinc-50 rounded-2xl text-sm font-black transition-all flex items-center gap-2"
                    >
                        {language === 'ar' ? 'العودة للصفحة الرئيسية' : 'Return to Home Page'}
                    </button>
                )}
            </div>

            {preferences.savedLibrary && Array.isArray(preferences.savedLibrary) && preferences.savedLibrary.length > 0 && (
              <MoodCloud items={preferences.savedLibrary} language={language} />
            )}

            {preferences.savedLibrary && Array.isArray(preferences.savedLibrary) && preferences.savedLibrary.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-zinc-400 bg-zinc-50 rounded-[48px] border border-dashed border-zinc-200">
                    <LibraryBig className="w-24 h-24 mb-6 opacity-10" />
                    <p className="font-black text-xl mb-2">{language === 'ar' ? 'الذاكرة فارغة حالياً' : 'Your memory is currently empty'}</p>
                    <p className="text-sm font-bold opacity-60">{language === 'ar' ? 'ابدأ في حفظ الأفكار والقرارات لتراها هنا.' : 'Start saving ideas and decisions to see them here.'}</p>
                </div>
            ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.isArray(preferences.savedLibrary) && preferences.savedLibrary.map((stored, index) => {
                        let content = '';
                        let title = '';
                        let type = 'item';
                        const item = stored;
                        const tabId = item && typeof item === 'object' ? item.tabId : undefined;
                        
                        if (typeof item === 'string') {
                            content = item;
                            type = 'text';
                        } else if (item && typeof item === 'object') {
                            type = item.type || 'item';
                            if (type === 'qawlfasl') {
                                title = item.question || item.title || '';
                                content = item.quickSummary || '';
                            } else if (type === 'oracle') {
                                title = item.question || '';
                                content = item.content || '';
                            } else if (type === 'concept') {
                                title = item.question || '';
                                content = item.content || '';
                            } else if (type === 'roadmap') {
                                title = item.title || '';
                                content = item.estimated_duration || '';
                            } else {
                                title = item.title || '';
                                content = item.text || item.content || item.question || JSON.stringify(item);
                            }
                        }

                        const typeLabels: Record<string, { ar: string, color: string }> = {
                            'qawlfasl': { ar: 'قول فصل', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                            'oracle': { ar: 'المستشار الكلي', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                            'concept': { ar: 'هندسة الأفكار', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                            'roadmap': { ar: 'طريق النجاح', color: 'bg-rose-50 text-rose-600 border-rose-100' },
                            'text': { ar: 'نص', color: 'bg-zinc-50 text-zinc-600 border-zinc-100' },
                            'item': { ar: 'مادة', color: 'bg-zinc-50 text-zinc-600 border-zinc-100' }
                        };

                        const label = typeLabels[type] || typeLabels.item;

                        // Aesthetic Memory Decay (Items at the bottom / higher index appear older)
                        // If there are many items, the older ones get a yellowish sepia wash and slight blur/fade
                        // When hovered, the group-hover resets it
                        const isDecaying = index > 3; // Let's say items past index 3 start decaying
                        const decayLevel = Math.min((index - 3) * 0.1, 0.4); // max 0.4 opacity on sepia
                        
                        return (
                            <motion.li 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                key={index} 
                                className="relative p-6 bg-white border border-zinc-200 rounded-[28px] shadow-sm hover:shadow-md transition-all duration-1000 flex flex-col justify-between gap-4 group overflow-hidden"
                            >
                                {/* Decay Overlay applied to old items */}
                                {isDecaying && (
                                    <div 
                                        className="absolute inset-0 bg-[#D4C3A3] pointer-events-none mix-blend-multiply transition-opacity duration-1000 ease-out group-hover:opacity-0"
                                        style={{ opacity: decayLevel }}
                                    ></div>
                                )}
                                
                                <div className={cn("space-y-3 relative z-10 transition-all duration-1000", isDecaying ? "sepia-[0.3] opacity-80 group-hover:sepia-0 group-hover:opacity-100" : "")}>
                                    <div className="flex items-center justify-between">
                                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", label.color)}>
                                            {language === 'ar' ? label.ar : type}
                                        </span>
                                    </div>
                                    {title && <h3 className="text-black font-black text-lg leading-tight transition-colors line-clamp-2">{title}</h3>}
                                    <div className="text-zinc-500 font-medium leading-relaxed text-sm line-clamp-4">
                                        {type === 'oracle' ? <ReactMarkdown>{content.substring(0, 300) + (content.length > 300 ? '...' : '')}</ReactMarkdown> : content}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 relative z-10">
                                  <div className="flex gap-2">
                                    <button 
                                        onClick={() => removeFromLibrary(item)}
                                        className="flex-1 py-3 bg-zinc-50 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl text-xs font-black transition-all border border-transparent hover:border-rose-100 flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        {language === 'ar' ? 'حذف' : 'Remove'}
                                    </button>
                                    <button 
                                        onClick={() => {
                                          alert(language === 'ar' ? 'لقد ارتديت روح هذا المفهوم الآن.' : 'You have now donned the spirit of this concept.');
                                        }}
                                        className="flex-1 py-3 bg-zinc-950 text-white hover:bg-black rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2"
                                    >
                                        <Shirt className="w-3.5 h-3.5" />
                                        {language === 'ar' ? 'ارتداء' : 'Wear'}
                                    </button>
                                  </div>
                                  {tabId && (
                                    <button 
                                        onClick={() => {
                                          if (handleTabChange) handleTabChange(tabId, title);
                                        }}
                                        className="w-full py-4 bg-mood-primary text-white hover:opacity-90 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-mood-glow"
                                    >
                                        <ArrowUpRight className="w-4 h-4" />
                                        {language === 'ar' ? 'العودة لمساحة الفكر' : 'Return to Thought Space'}
                                    </button>
                                  )}
                                </div>
                            </motion.li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default MyLibraryTab;
