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
                    <p className="font-black text-xl mb-2">{language === 'ar' ? 'جدار الحكمة فارغ حالياً' : 'Your Gallery is currently empty'}</p>
                    <p className="text-sm font-bold opacity-60">{language === 'ar' ? 'ابدأ في حفظ الأفكار والقرارات لتُعرض هنا كلوحات.' : 'Start saving ideas and decisions to see them displayed here.'}</p>
                </div>
            ) : (
                <div className="relative w-full h-[65vh] bg-white rounded-[40px] shadow-2xl border border-zinc-200 overflow-hidden flex flex-col pt-12 items-center">
                    <div className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400 mb-8 z-10 text-center px-4 leading-relaxed group-hover:text-black transition-colors">
                      {language === 'ar' ? 'المعرض الإدراكي - اسحب لاستعراض اللوحات' : 'COGNITIVE GALLERY - SCROLL TO EXPLORE'}
                      <div className="w-32 h-px bg-zinc-300 mx-auto mt-4"></div>
                    </div>
                    
                    {/* Dark/Warm lighting effect for wall */}
                    <div className="absolute inset-0 bg-stone-100 pointer-events-none -z-10 bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] opacity-30"></div>
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-stone-200/50 to-transparent pointer-events-none -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-stone-300 to-transparent pointer-events-none -z-10"></div>

                    <ul className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory gap-20 px-[20vw] pb-16 w-full h-full custom-scrollbar items-center my-auto -mt-6">
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

                            return (
                                <motion.li 
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.8 }}
                                    key={index} 
                                    className="relative flex-none snap-center group w-[350px] md:w-[450px]"
                                >
                                    {/* Gallery Frame Shadow/Spotlight */}
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-2 bg-yellow-100/50 blur-xl group-hover:bg-yellow-200/80 transition-all pointer-events-none"></div>
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150%] bg-white/20 blur-3xl opacity-0 group-hover:opacity-100 mix-blend-overlay transition-opacity duration-700 pointer-events-none"></div>
                                    
                                    {/* Physical Frame and Matting */}
                                    <div className="bg-stone-900 p-3 md:p-4 rounded-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border-t border-zinc-700 border-l border-r border-zinc-800 border-b-8 border-b-black transition-transform duration-700 hover:-translate-y-2 hover:rotate-1">
                                      <div className="bg-[#f0ece1] p-6 md:p-10 border border-[#e0d6c8] shadow-inner relative overflow-hidden h-[400px] md:h-[500px] flex flex-col justify-center text-center">
                                          <div className="absolute inset-0 bg-[#e9dbce] mix-blend-multiply opacity-20 pointer-events-none"></div>
                                          
                                          <div className="relative z-10 h-full overflow-y-auto custom-scrollbar pr-2 flex flex-col justify-center">
                                            {title && <h3 className="text-[#2a1e12] font-black text-xl md:text-3xl leading-snug mb-6" style={{ fontFamily: 'Amiri, serif' }}>{title}</h3>}
                                            <div className="text-[#4a3b2c] font-medium leading-loose text-sm md:text-lg italic" style={{ fontFamily: 'Aref Ruqaa, auto' }}>
                                                {type === 'oracle' ? <ReactMarkdown>{content.substring(0, 300) + (content.length > 300 ? '...' : '')}</ReactMarkdown> : content}
                                            </div>
                                          </div>
                                      </div>
                                    </div>
                                    
                                    {/* Museum Label */}
                                    <div className="mx-auto mt-6 md:mt-10 bg-white border border-stone-300 p-4 md:p-6 shadow-md w-11/12 max-w-[300px] text-center relative pointer-events-auto flex flex-col gap-4">
                                       <div className="w-2 h-2 rounded-full bg-stone-300 mx-auto absolute top-2 left-1/2 -translate-x-1/2 shadow-inner"></div>
                                       <div>
                                           <div className="text-xs font-black text-black uppercase tracking-widest leading-none mb-2">{language === 'ar' ? label.ar : type}</div>
                                           <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Item No. {String(index + 1).padStart(3, '0')}</div>
                                       </div>
                                       <div className="flex flex-col gap-2 relative z-10 w-full mt-2 border-t pt-4">
                                          <div className="flex gap-2">
                                            <button 
                                                onClick={() => removeFromLibrary(item)}
                                                className="flex-1 py-2 bg-stone-50 text-stone-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-xs font-black transition-all border border-transparent hover:border-rose-100 flex items-center justify-center gap-2"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                {language === 'ar' ? 'إزالة' : 'Remove'}
                                            </button>
                                            <button 
                                                onClick={() => {
                                                  alert(language === 'ar' ? 'لقد ارتديت روح هذا المفهوم الآن.' : 'You have now donned the spirit of this concept.');
                                                }}
                                                className="flex-1 py-2 bg-stone-900 text-white hover:bg-black rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2"
                                            >
                                                <Shirt className="w-3 h-3" />
                                                {language === 'ar' ? 'ارتداء' : 'Wear'}
                                            </button>
                                          </div>
                                          {tabId && (
                                            <button 
                                                onClick={() => {
                                                  if (handleTabChange) handleTabChange(tabId, title);
                                                }}
                                                className="w-full py-2 bg-mood-primary text-white hover:opacity-90 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2"
                                            >
                                                <ArrowUpRight className="w-3 h-3" />
                                                {language === 'ar' ? 'العودة للمساحة' : 'Return'}
                                            </button>
                                          )}
                                       </div>
                                    </div>
                                </motion.li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MyLibraryTab;
