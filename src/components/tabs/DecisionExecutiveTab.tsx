import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Search, Loader2, Sparkles, ShieldAlert, Users, History, MessageSquareQuote, GitBranch, Hourglass, Eye, Lock, VolumeX } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';
import { ai } from '../../services/gemini';
import ReactMarkdown from 'react-markdown';

type AnalysisTool = {
    id: string;
    title: { ar: string, en: string };
    icon: any;
    prompt: string;
    bgColor: string;
};

export const DecisionExecutiveTab = ({ language, handleTabChange, initialValue = '', onValueUsed }: { language: 'ar' | 'en', handleTabChange: any, initialValue?: string, onValueUsed?: () => void }) => {
    const [dilemma, setDilemma] = useState(initialValue);

    useEffect(() => {
        if (initialValue) {
            setDilemma(initialValue);
            if (onValueUsed) onValueUsed();
        }
    }, [initialValue, onValueUsed]);
    const [result, setResult] = useState<{tool: string, content: string | any, isJson?: boolean} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Emotional Radar State
    const [showRadarWarning, setShowRadarWarning] = useState(false);
    const keyStrokes = useRef<{time: number, key: string}[]>([]);
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        const now = Date.now();
        keyStrokes.current.push({ time: now, key: e.key });
        
        // Keep only last 10 seconds of keystrokes
        keyStrokes.current = keyStrokes.current.filter(k => now - k.time < 10000);
        
        // Analyze
        if (keyStrokes.current.length > 20) {
            const backspaces = keyStrokes.current.filter(k => k.key === 'Backspace').length;
            const typingSpeed = keyStrokes.current.length; // per 10 seconds (approx)
            
            // If typing super fast with lots of backspaces = erratic/emotional
            if (typingSpeed > 30 && backspaces > 8 && !showRadarWarning) {
                setShowRadarWarning(true);
            }
        }
    };

    const tools: AnalysisTool[] = [
        { id: 'consequences', title: { ar: 'آلة العواقب', en: 'Consequences Machine' }, icon: GitBranch, bgColor: 'bg-indigo-500', prompt: 'حلل العواقب من الدرجة الأولى والثانية والثالثة لهذا القرار: ' },
        { id: 'council', title: { ar: 'مجلس العقول المتعددة', en: 'Council of Minds' }, icon: Users, bgColor: 'bg-emerald-500', prompt: 'حلل هذا القرار كفيلسوف، اقتصادي، قانوني، استراتيجي، خصم، ومؤرخ: ' },
        { id: 'collapse', title: { ar: 'محاكاة الانهيار', en: 'Collapse Simulation' }, icon: ShieldAlert, bgColor: 'bg-rose-500', prompt: 'حاول تدمير هذا القرار فكرياً واكشف نقاط ضعفه: ' },
        { id: 'hidden', title: { ar: 'خريطة القوى الخفية', en: 'Hidden Powers Map' }, icon: Eye, bgColor: 'bg-amber-500', prompt: 'اكشف أصحاب المصلحة والنفوذ والمخاطر والتحالفات لهذا القرار: ' },
        { id: 'memory', title: { ar: 'ذاكرة فكرية', en: 'Intellectual Memory' }, icon: History, bgColor: 'bg-slate-500', prompt: 'تحليل القرار بناءً على نمط التفكير المعتاد: ' },
        { id: 'questions', title: { ar: 'الأسئلة العميقة', en: 'Deep Questions' }, icon: MessageSquareQuote, bgColor: 'bg-purple-500', prompt: 'ولد الأسئلة التي كان يجب أن تُسأل ولم تُسأل حول هذا القرار: ' },
        { id: 'debate', title: { ar: 'مناظرة داخلية', en: 'Internal Debate' }, icon: Brain, bgColor: 'bg-cyan-500', prompt: 'ابنِ أقوى حجة مع، وأقوى حجة ضد، ثم احكم بينهما لهذا القرار: ' },
        { id: 'butterfly', title: { ar: 'تأثير الفراشة', en: 'Butterfly Effect' }, icon: Sparkles, bgColor: 'bg-fuchsia-600', prompt: 'تخيل أنني اتخذت هذا القرار. محاكاة العواقب بعد 5 سنوات. أرجع الرد بصيغة JSON فقط JSON ONLY يحتوي على: { "magazineName": "FORBES 2030", "headline": "العنوان الرئيسي القوي", "subheadline": "عنوان فرعي يشرح الصدمة", "bulletPoints": ["نقطة 1", "نقطة 2", "نقطة 3"], "quote": "اقتباس مقولة عني" }. لا ترجع أي نص خارج الJSON. القرار هو: ' },
        { id: 'vault', title: { ar: 'كبسولة الزمن', en: 'Time Vault' }, icon: Lock, bgColor: 'bg-stone-800', prompt: 'أنا سأتخذ هذا القرار المصيري. قم بتحليل توقعاتي واصنع "مرآة قاسية" تكشف أين قد أقع في فخ الغرور والتحيز (Hindsight Bias). حلل كيف سأندم وكيف سأفرح. أسلوبك قاسي جداً وواقعي: ' },
        { id: 'secret', title: { ar: 'القرار التنفيذي', en: 'Decision Room' }, icon: Lock, bgColor: 'bg-black', prompt: 'حول هذه الأزمة لقرار واضح ومنظم تنفيذي: ' },
    ];

    const runAnalysis = async (tool: AnalysisTool) => {
        if (!dilemma) return;
        setIsLoading(true);
        setResult(null);
        try {
            const prompt = `${tool.prompt} ${dilemma}`;
            const { universalOracle } = await import('../../services/gemini');
            const content = await universalOracle(prompt, 'Decision Executive', language);
            
            if (tool.id === 'butterfly') {
                try {
                    let jsonStr = content.trim();
                    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/```json\n?/, '');
                    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```\n?/, '');
                    if (jsonStr.endsWith('```')) jsonStr = jsonStr.replace(/```$/, '');
                    setResult({ tool: tool.id, content: JSON.parse(jsonStr), isJson: true });
                } catch(e) {
                    setResult({ tool: tool.id, content: { magazineName: 'Error Future', headline: 'خطأ في المحاكاة', subheadline: 'الذكاء لم يستطع تصور المستقبل', bulletPoints: [], quote: '...' }, isJson: true });
                }
            } else {
               setResult({ tool: tool.id, content: content || 'No result' });
            }
        } catch (e: any) {
            setResult({ tool: 'Error', content: language === 'ar' ? `لقد اصطدمت الأفكار ببعضها.. يحتاج "العقل المدبر" إلى لحظة صفاء ذهني ليعاود ترتيبها. جرب التريث قليلاً ثم عاود الإرسال. (${e.message})` : `The thoughts have collided.. The Mastermind needs a moment of clarity to reorganize. Try pausing and resending. (${e.message})` });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 px-2 max-w-5xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
           <TabHeader 
                icon={Lock}
                title={{ ar: 'غرفة القرار السرية', en: 'Decision Executive Lab' }}
                description={{ ar: 'استخدم أدوات التفكير الاستراتيجي للتحليل والقرار.', en: 'Use high-level strategic reasoning tools for decision making.' }}
                language={language}
                onBack={() => handleTabChange('discover')}
           />

           <div className="relative">
             <textarea 
               value={dilemma}
               onChange={(e) => {
                 setDilemma(e.target.value);
                 if (showRadarWarning && e.target.value === '') setShowRadarWarning(false);
               }}
               onKeyDown={handleKeyDown}
               className={cn(
                 "w-full h-32 p-6 rounded-3xl border focus:ring-4 transition-all relative z-10",
                 showRadarWarning ? "border-rose-900/50 bg-black text-rose-100 placeholder:text-rose-900 focus:ring-rose-900/50" : "border-zinc-200 bg-white focus:ring-black/5 focus:border-black"
               )}
               placeholder={language === 'ar' ? 'ادخل معضلتك أو قرارك هنا...' : 'Enter your dilemma or decision here...'}
             />
             
             <AnimatePresence>
               {showRadarWarning && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0 }}
                   className="absolute -bottom-16 left-0 right-0 z-20 flex justify-center"
                 >
                   <div className="bg-black/90 backdrop-blur border border-rose-900/50 text-white px-6 py-3 rounded-full flex items-center justify-between gap-4 shadow-2xl">
                     <div className="flex flex-col">
                       <span className="font-bold text-sm text-rose-400">{language === 'ar' ? 'تحذير النبض الإدراكي' : 'Cognitive Pulse Warning'}</span>
                       <span className="text-xs text-zinc-300">{language === 'ar' ? 'يبدو أنك تتخذ هذا القرار بانفعال، أنصحك بحفظه للغد.' : 'You seem to be making an emotional decision, wait till tomorrow.'}</span>
                     </div>
                     <button onClick={() => setShowRadarWarning(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                        <VolumeX className="w-4 h-4" />
                     </button>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {tools.map(tool => (
                  <button 
                    key={tool.id} 
                    onClick={() => runAnalysis(tool)}
                    disabled={isLoading || !dilemma}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                      <div className={cn("p-3 rounded-xl text-white", tool.bgColor)}>
                        <tool.icon className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-center text-xs">{language === 'ar' ? tool.title.ar : tool.title.en}</span>
                  </button>
              ))}
           </div>

           <AnimatePresence>
            {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-20 text-zinc-500">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p>{language === 'ar' ? 'جاري التحليل العميق...' : 'Analyzing deeply...'}</p>
                </motion.div>
            )}
            {result && !isLoading && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                    
                    {result.tool === 'butterfly' && result.isJson ? (
                        <div className="bg-zinc-900 text-white rounded-t-3xl overflow-hidden shadow-2xl relative min-h-[500px] flex flex-col justify-end p-8 md:p-12 border-8 border-white">
                            <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000')] bg-cover bg-center"></div>
                            <div className="absolute top-8 left-8 text-xl font-black tracking-tighter text-white/50 border-b-2 border-rose-500 pb-1">
                                {result.content.magazineName}
                            </div>
                            <div className="relative z-10 space-y-6 mt-32">
                                <h1 className="text-5xl md:text-7xl font-black leading-tight text-white drop-shadow-lg">
                                    {result.content.headline}
                                </h1>
                                <p className="text-xl md:text-2xl font-bold italic text-rose-300 max-w-2xl">
                                    "{result.content.subheadline}"
                                </p>
                                <div className="space-y-2 mt-8 border-l-4 border-rose-500 pl-4 py-2 bg-black/20 backdrop-blur-sm">
                                    {result.content.bulletPoints?.map((pt: string, i: number) => (
                                        <div key={i} className="text-lg font-bold text-white/90">• {pt}</div>
                                    ))}
                                </div>
                                <div className="mt-12 text-center pt-8 border-t border-white/20 text-xl font-medium tracking-tight text-white/70">
                                    {result.content.quote}
                                </div>
                            </div>
                        </div>
                    ) : result.tool === 'vault' ? (
                        <div className="bg-stone-900 border-2 border-stone-700 p-8 md:p-12 rounded-[32px] shadow-2xl text-stone-200">
                             <div className="flex items-center justify-center gap-4 mb-8 text-stone-500">
                               <Lock className="w-8 h-8" />
                               <span className="text-xl font-black tracking-widest">{language === 'ar' ? 'رسالة من المستقبل المظلم' : 'MESSAGE FROM DARK FUTURE'}</span>
                             </div>
                             <div className="markdown-body prose prose-invert max-w-none prose-headings:text-stone-300 prose-a:text-rose-400">
                               <ReactMarkdown>{result.content}</ReactMarkdown>
                             </div>
                        </div>
                    ) : (
                        <div className={`p-8 rounded-3xl border shadow-sm space-y-4 ${tools.find(t => t.id === result.tool)?.bgColor.replace('bg-', 'bg-opacity-10 bg-')} border-zinc-200/50`}>
                            <div className="flex items-center gap-3 border-b border-zinc-200/60 pb-4">
                                {tools.find(t => t.id === result.tool)?.icon && React.createElement(tools.find(t => t.id === result.tool)!.icon as any, {className: `w-6 h-6 ${tools.find(t => t.id === result.tool)?.bgColor.replace('bg-', 'text-')}`})}
                                <h3 className={`text-2xl font-black ${tools.find(t => t.id === result.tool)?.bgColor.replace('bg-', 'text-')}`}>
                                    {language === 'ar' ? tools.find(t => t.id === result.tool)?.title.ar : tools.find(t => t.id === result.tool)?.title.en}
                                </h3>
                            </div>
                            <div className="prose md:prose-lg max-w-none text-zinc-800 prose-headings:text-zinc-900 prose-strong:text-zinc-900 leading-relaxed font-serif rtl:font-sans py-4">
                              <ReactMarkdown>{result.content}</ReactMarkdown>
                            </div>
                        </div>
                    )}

                </motion.div>
            )}
           </AnimatePresence>
        </div>
    );
};
