import React from 'react';
import { useUser } from '../../contexts/UserContext';
import { motion } from 'motion/react';
import { LibraryBig } from 'lucide-react';
import { cn } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';

const MyLibraryTab = ({ language = 'ar', handleTabChange }: { language?: string, handleTabChange?: (id: string, context?: string) => void }) => {
    const { preferences, removeFromLibrary } = useUser();
    
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">المكتبة المفضلة</h2>
                {handleTabChange && (
                    <button 
                        onClick={() => handleTabChange('discover')}
                        className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-sm font-bold transition-all"
                    >
                        {language === 'ar' ? 'رجوع' : 'Back'}
                    </button>
                )}
            </div>
            {preferences.savedLibrary && Array.isArray(preferences.savedLibrary) && preferences.savedLibrary.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                    <LibraryBig className="w-16 h-16 mb-4 opacity-20" />
                    <p className="font-bold">{language === 'ar' ? 'لا توجد نصائح محفوظة في المكتبة حالياً.' : 'No saved items in your library yet.'}</p>
                </div>
            ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <div className="flex gap-2 relative z-10">
                                  <button 
                                      onClick={() => removeFromLibrary(item)}
                                      className="flex-1 py-3 bg-zinc-50 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl text-xs font-black transition-all border border-transparent hover:border-rose-100"
                                  >
                                      {language === 'ar' ? 'حذف' : 'Remove'}
                                  </button>
                                  {tabId && (
                                    <button 
                                        onClick={() => {
                                          if (handleTabChange) handleTabChange(tabId, title); // Simplified navigation attempt
                                        }}
                                        className="flex-1 py-3 bg-black text-white hover:bg-zinc-800 rounded-2xl text-xs font-black transition-all"
                                    >
                                        {language === 'ar' ? 'العودة' : 'Return'}
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
