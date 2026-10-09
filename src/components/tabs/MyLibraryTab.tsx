import React from 'react';
import { useUser } from '../../contexts/UserContext';
import { motion } from 'motion/react';
import { LibraryBig, Shirt, Trash2, ArrowUpRight, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';
import { TebyanEmptyState } from '../common/TebyanEmptyState';
import { IS_DEMO_MODE } from '../../lib/demoMode';
import { localizeDemoLibrary } from '../../data/demoFixtures';

const MoodCloud = ({ items, language, action }: { items: any[], language: string, action?: React.ReactNode }) => {
  const counts = items.reduce((acc: any, item: any) => {
    const type = (item && typeof item === 'object' ? item.type : 'item') || 'item';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeData: Record<string, { color: string, labelAr: string, labelEn: string }> = {
    'qawlfasl': { color: 'bg-[#eef3ef] text-[#3f6b55]', labelAr: 'قول فصل', labelEn: 'Decision' },
    'oracle': { color: 'bg-[#f1eef6] text-[#6e5f8e]', labelAr: 'المستشار', labelEn: 'Oracle' },
    'concept': { color: 'bg-[#f7f1e6] text-[#8a6a3b]', labelAr: 'الأفكار', labelEn: 'Concepts' },
    'roadmap': { color: 'bg-[#f6eeef] text-[#8e5a63]', labelAr: 'المسار', labelEn: 'Roadmap' },
    'item': { color: 'bg-[#f2f2f4] text-[#5b6472]', labelAr: 'مادة', labelEn: 'Items' }
  };

  const ringColors: Record<string, string> = {
    qawlfasl: '#3f6b55', oracle: '#6e5f8e', concept: '#8a6a3b', roadmap: '#8e5a63', item: '#8b93a1'
  };
  const entries = Object.entries(counts) as [string, number][];
  const total = entries.reduce((sum, [, c]) => sum + c, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  const GAP = entries.length > 1 ? 4 : 0;
  let offset = 0;

  return (
    <div className="mb-10 md:mb-12 flex flex-col md:flex-row items-center justify-center gap-5 md:gap-12">
    {total > 0 && (
      <div className="relative h-36 w-36 md:h-44 md:w-44" role="img" aria-label={entries.map(([t, c]) => `${language === 'ar' ? (typeData[t]?.labelAr || t) : (typeData[t]?.labelEn || t)} ${c}`).join(' · ')}>
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="64" cy="64" r={R} fill="none" stroke="#EFEAF4" strokeWidth="10" />
          {entries.map(([type, count]) => {
            const len = (count / total) * C;
            const seg = (
              <circle
                key={type}
                cx="64" cy="64" r={R}
                fill="none"
                stroke={ringColors[type] || ringColors.item}
                strokeWidth="10"
                strokeLinecap="butt"
                strokeDasharray={`${Math.max(len - GAP, 0.5)} ${C}`}
                strokeDashoffset={-offset}
                opacity={0.85}
              />
            );
            offset += len;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-4xl md:text-5xl font-black text-navy">{total}</div>
      </div>
    )}
    <div className="flex flex-wrap gap-2 justify-center md:flex-col md:items-stretch" role="list">
       {Object.entries(counts).map(([type, count]: [any, any]) => (
         <motion.div
           key={type}
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
                      role="listitem"
           className={cn(
             "pe-4 ps-2 py-1.5 rounded-full flex items-center gap-2.5 border border-[#6e5f8e]/10",
             typeData[type]?.color || 'bg-[#f2f2f4] text-[#5b6472]'
           )}
         >
           <span className="w-2.5 h-2.5 rounded-full shrink-0 ms-1" style={{ backgroundColor: ringColors[type] || ringColors.item, opacity: 0.85 }} aria-hidden="true" />
           <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center font-bold text-sm">
             {count}
           </div>
           <span className="font-bold text-sm">
             {language === 'ar' ? (typeData[type]?.labelAr || type) : (typeData[type]?.labelEn || type)}
           </span>
         </motion.div>
       ))}
    </div>
    {action}
    </div>
  );
};

const GalleryDots = ({ listRef, count }: { listRef: React.RefObject<HTMLUListElement>, count: number }) => {
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const box = el.getBoundingClientRect();
      const mid = box.left + box.width / 2;
      let best = 0;
      let bestDist = Infinity;
      Array.from(el.children).forEach((child, i) => {
        const r = (child as HTMLElement).getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      setActive(best);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [listRef, count]);
  if (count < 2) return null;
  if (count > 12) {
    return <div className="mb-5 text-xs font-bold text-zinc-400 tabular-nums" aria-hidden="true" dir="ltr">{active + 1} / {count}</div>;
  }
  return (
    <div className="mb-5 flex items-center justify-center gap-1.5" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={cn('h-1.5 rounded-full transition-all', i === active ? 'w-5 bg-lilac' : 'w-1.5 bg-lilac/25')} />
      ))}
    </div>
  );
};

const MyLibraryTab = ({ language = 'ar', handleTabChange, embedded = false }: { language?: string, handleTabChange?: (id: string, context?: string) => void, embedded?: boolean }) => {
    const { preferences, removeFromLibrary } = useUser();
    const galleryRef = React.useRef<HTMLUListElement>(null);
    // في العرض تظهر المحفوظات النموذجية بلغة الواجهة؛ الحذف يبقى على العنصر المخزَّن.
    const hasSaved = Array.isArray(preferences.savedLibrary) && preferences.savedLibrary.length > 0;
    const displayLibrary = React.useMemo(
        () => (IS_DEMO_MODE && Array.isArray(preferences.savedLibrary) ? localizeDemoLibrary(preferences.savedLibrary, language) : preferences.savedLibrary),
        [preferences.savedLibrary, language],
    );
    
    // مع وجود محفوظات يجاور الزرُّ الحلقةَ ووسيلةَ الإيضاح؛ وبدونها يبقى في ترويسة الصفحة.
    const exploreBtn = handleTabChange ? (
        <button
            onClick={() => handleTabChange('discover')}
            className="w-full sm:w-auto order-first md:order-none px-5 py-3 bg-white border border-zinc-200 hover:border-black hover:bg-zinc-50 rounded-[20px] text-sm font-black transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
        >
            {language === 'ar' ? 'استكشف تبيان' : 'Explore Tebyan'}
        </button>
    ) : null;

    return (
        <div className="p-4 md:p-6 pb-28 md:pb-32">
            <div className={cn('flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8 md:mb-12', embedded && hasSaved && 'mb-0 md:mb-0')}>
                <div className={cn('space-y-1 text-right', embedded && 'sr-only')}>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight">{language === 'ar' ? 'قصر الذاكرة' : 'Memory Palace'}</h2>
                  <p className="text-zinc-500 font-bold text-xs md:text-sm tracking-widest uppercase leading-relaxed">{language === 'ar' ? 'مخزن الأفكار المُلهمة والمسارات المحفوظة' : 'Storehouse of inspiring ideas and saved paths'}</p>
                </div>
                {!hasSaved && exploreBtn}
            </div>

            {preferences.savedLibrary && Array.isArray(preferences.savedLibrary) && preferences.savedLibrary.length > 0 && (
              <MoodCloud items={displayLibrary} language={language} action={exploreBtn} />
            )}

            {preferences.savedLibrary && Array.isArray(preferences.savedLibrary) && preferences.savedLibrary.length === 0 ? (
                <TebyanEmptyState
                  language={language}
                  icon={Sparkles}
                  title={language === 'ar' ? 'لم يبدأ النسيج بعد' : 'The fabric has not begun yet'}
                  description={language === 'ar' ? 'اكتب أول فكرة أو احفظ أول نتيجة، وسنحوّلها إلى عقدة في خريطتك المعرفية.' : 'Write or save your first thought, and it will become a node in your knowledge map.'}
                  actionLabel={language === 'ar' ? 'ابدأ أول فكرة' : 'Start first idea'}
                  onAction={() => handleTabChange?.('discover')}
                  className="min-h-[220px]"
                />
            ) : (
                <div className="relative w-full min-h-[58vh] md:min-h-[65vh] bg-white rounded-[32px] md:rounded-[40px] shadow-2xl border border-zinc-200 overflow-hidden flex flex-col pt-8 md:pt-12 items-center">
                    <div className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400 mb-8 z-10 text-center px-4 leading-relaxed group-hover:text-black transition-colors">
                      {language === 'ar' ? 'المعرض الإدراكي - اسحب لاستعراض اللوحات' : 'COGNITIVE GALLERY - SCROLL TO EXPLORE'}
                      <div className="w-32 h-px bg-zinc-300 mx-auto mt-4"></div>
                    </div>
                    
                    {/* Dark/Warm lighting effect for wall */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-stone-200/50 to-transparent pointer-events-none -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-stone-300 to-transparent pointer-events-none -z-10"></div>

                    <ul ref={galleryRef} className={cn('tebyan-gallery-mask flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory gap-8 md:gap-20 px-5 pb-10 md:pb-16 w-full flex-1 custom-scrollbar items-center md:[justify-content:safe_center]', (Array.isArray(preferences.savedLibrary) ? preferences.savedLibrary.length : 0) > 2 ? 'md:px-[calc(50%-175px)]' : 'md:px-8')}>
                        {Array.isArray(preferences.savedLibrary) && preferences.savedLibrary.map((stored, index) => {
                            let content = '';
                            let title = '';
                            let type = 'item';
                            const item = displayLibrary[index] ?? stored;
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
                                'oracle': { ar: 'المستشار الكلي', color: 'bg-lilac-mist text-lilac border-lilac-mist' },
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
                                    className="relative flex-none snap-center group w-[88vw] max-w-[350px] md:w-[450px]"
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
                                           <div className="text-xs uppercase font-bold text-stone-500 tracking-wider">{language === 'ar' ? 'العنصر رقم' : 'Item No.'} {String(index + 1).padStart(3, '0')}</div>
                                       </div>
                                       <div className="flex flex-col gap-2 relative z-10 w-full mt-2 border-t pt-4">
                                          <div className="flex gap-2">
                                            <button 
                                                onClick={() => removeFromLibrary(stored)}
                                                className="flex-1 py-2 bg-stone-50 text-stone-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-xs font-black transition-all border border-transparent hover:border-rose-100 flex items-center justify-center gap-2"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                {language === 'ar' ? 'إزالة' : 'Remove'}
                                            </button>
                                            <button 
                                                onClick={() => {
                                                  alert(language === 'ar' ? 'لقد ارتديت روح هذا المفهوم الآن.' : 'You have now donned the spirit of this concept.');
                                                }}
                                                className="flex-1 py-2 bg-lilac text-white hover:bg-lilac-deep rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2"
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
                    <GalleryDots listRef={galleryRef} count={Array.isArray(preferences.savedLibrary) ? preferences.savedLibrary.length : 0} />
                </div>
            )}
        </div>
    );
};

export default MyLibraryTab;
