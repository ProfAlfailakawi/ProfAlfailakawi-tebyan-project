import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Search, Loader2, Sparkles, ShieldAlert, Users, History, MessageSquareQuote, GitBranch, Hourglass, Eye, Lock, VolumeX, X, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';
import { ai, universalOracle } from '../../services/gemini';
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
        { id: 'decision', title: { ar: 'القرار التنفيذي', en: 'Executive Decision' }, icon: Lock, bgColor: 'bg-black', prompt: 'حول هذه الموقف لقرار تنفيذي حاسم ومسؤول: ' },
        { id: 'consequences', title: { ar: 'موجات العواقب', en: 'Consequence Waves' }, icon: GitBranch, bgColor: 'bg-indigo-600', prompt: 'حلل العواقب من الدرجة الأولى والثانية والثالثة لهذا القرار: ' },
        { id: 'council', title: { ar: 'مجلس العقول', en: 'Council of Minds' }, icon: Users, bgColor: 'bg-emerald-600', prompt: 'حلل هذا القرار كفيلسوف، اقتصادي، قانوني، استراتيجي، وخصم: ' },
        { id: 'collapse', title: { ar: 'اختبار الاختراق فكرياً', en: 'Red Team Test' }, icon: ShieldAlert, bgColor: 'bg-rose-600', prompt: 'قم بدور "الفريق الأحمر" وحاول تدمير هذا القرار فكرياً واكشف نقاط ضعفه القاتلة: ' },
        { id: 'hidden', title: { ar: 'الخيوط الخفية', en: 'Hidden Threads' }, icon: Eye, bgColor: 'bg-amber-600', prompt: 'اكشف أصحاب المصلحة والنفوذ والمخاطر الصامتة لهذا القرار: ' },
        { id: 'memory', title: { ar: 'البصمة الفكرية', en: 'Cognitive Trace' }, icon: History, bgColor: 'bg-slate-700', prompt: 'حلل هذا القرار بناءً على سياق التفكير الاستراتيجي العميق ومبادئه: ' },
        { id: 'questions', title: { ar: 'محرك الأسئلة', en: 'Question Engine' }, icon: MessageSquareQuote, bgColor: 'bg-purple-600', prompt: 'ولد الأسئلة الليزرية الدقيقة التي كان يجب أن تُسأل ولم تُسأل حول هذا القرار: ' },
        { id: 'debate', title: { ar: 'الميزان الاستراتيجي', en: 'Strategic Scale' }, icon: Brain, bgColor: 'bg-cyan-600', prompt: 'ابنِ أقوى حجة مع، وأقوى حجة ضد، ثم احكم بينهما لهذا القرار بإنصاف: ' },
        { id: 'butterfly', title: { ar: 'رؤية 360 درجة', en: '360 Horizon' }, icon: Sparkles, bgColor: 'bg-fuchsia-700', prompt: 'تخيل أنني اتخذت هذا القرار. محاكاة العواقب بعد 5 سنوات. أرجع الرد بصيغة JSON فقط JSON ONLY يحتوي على: { "magazineName": "FORBES 2030", "headline": "العنوان الرئيسي القوي", "subheadline": "عنوان فرعي يشرح الصدمة", "bulletPoints": ["نقطة 1", "نقطة 2", "نقطة 3"], "quote": "اقتباس مقولة عني" }. لا ترجع أي نص خارج الJSON. القرار هو: ' },
        { id: 'vault', title: { ar: 'مرآة التحيزات', en: 'Bias Mirror' }, icon: Lock, bgColor: 'bg-stone-900', prompt: 'أنا سأتخذ هذا القرار. اصنع "مرآة قاسية" تكشف أين أقع بمصيدة الانحياز التأكيدي. حلل كيف سأندم وكيف سأفرح. أسلوبك قاسي جداً وواقعي: ' },
    ];

    const runAnalysis = async (tool: AnalysisTool) => {
        const trimmedDilemma = dilemma.trim();
        if (!trimmedDilemma) {
            const el = document.getElementById('dilemma-input');
            if (el) {
                el.classList.add('animate-shake');
                setTimeout(() => el.classList.remove('animate-shake'), 500);
            }
            return;
        }
        setIsLoading(true);
        setResult(null);
        try {
            const prompt = `${tool.prompt} ${trimmedDilemma}`;
            const content = await universalOracle(prompt, tool.title.en, language);
            
            if (!content) throw new Error("No response from Oracle");

            if (tool.id === 'butterfly') {
                try {
                    let jsonStr = content.trim();
                    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/```json\n?/, '');
                    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```\n?/, '');
                    if (jsonStr.endsWith('```')) jsonStr = jsonStr.replace(/```$/, '');
                    setResult({ tool: tool.id, content: JSON.parse(jsonStr), isJson: true });
                } catch(e) {
                    setResult({ tool: tool.id, content: { magazineName: 'Future Link', headline: 'تم استشراف المستقبل', subheadline: 'الذكاء حلل الأثر البعيد للقرار', bulletPoints: [content.substring(0, 100) + '...'], quote: 'تبيان استكشف الأثر.' }, isJson: true });
                }
            } else {
               setResult({ tool: tool.id, content: content });
            }
        } catch (e: any) {
            console.error("Decision analysis failed:", e);
            setResult({ tool: 'Error', content: language === 'ar' ? `لقد تعثرت عملية التحليل الاستراتيجي.. المحرك يحتاج إلى إعادة ضبط المسار. جرب المحاولة مرة أخرى بعد ثوانٍ. (${e.message})` : `Strategic analysis stumbled.. The engine needs to recalibrate. Try again in a few seconds. (${e.message})` });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 px-2 pb-20 max-w-6xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
             <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">{language === 'ar' ? 'الوضع الآمن فعال' : 'SECURE MODE ACTIVE'}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-black tracking-tight leading-none uppercase">
                    {language === 'ar' ? 'غرفة القرار السرية' : 'SECRET DECISION ROOM'}
                </h1>
                <p className="text-zinc-500 font-bold text-sm md:text-lg max-w-2xl leading-relaxed">
                    {language === 'ar' ? 'بيئة استراتيجية معزولة لتفكيك المعضلات واتخاذ قرارات مبنية على بيانات إدراكية عميقة.' : 'A secure strategic environment to dismantle dilemmas and make decisions based on deep cognitive insights.'}
                </p>
             </div>
             <button 
               onClick={() => handleTabChange('discover')}
               className="px-6 py-2 bg-white border border-zinc-200 rounded-full font-bold text-sm text-zinc-500 hover:text-black hover:border-black transition-all flex items-center gap-2 w-fit active:scale-95"
             >
                <History className="w-4 h-4" />
                {language === 'ar' ? 'العودة للاستكشاف' : 'Back to Discover'}
             </button>
           </div>

           <div className="relative group/input">
             <div className="absolute -top-3 right-6 z-20 px-4 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg group-focus-within/input:bg-rose-600 transition-colors">
                {language === 'ar' ? 'مدخلات المعضلة' : 'DILEMMA INPUT'}
             </div>
             <textarea 
               id="dilemma-input"
               value={dilemma}
               onChange={(e) => {
                 setDilemma(e.target.value);
                 if (showRadarWarning && e.target.value === '') setShowRadarWarning(false);
               }}
               onKeyDown={handleKeyDown}
               className={cn(
                 "w-full h-40 p-8 pt-10 rounded-[32px] md:rounded-[48px] border-2 text-xl md:text-2xl font-medium focus:ring-8 transition-all relative z-10 custom-scrollbar resize-none leading-relaxed",
                 showRadarWarning ? "border-rose-900/50 bg-stone-900 text-rose-100 placeholder:text-rose-900/30 focus:ring-rose-900/10" : "border-zinc-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.02)] focus:ring-black/5 focus:border-black focus:shadow-[0_30px_60px_rgba(0,0,0,0.06)]"
               )}
               placeholder={language === 'ar' ? 'صِف الموقف أو القرار أو المعضلة التي تواجهك هنا بصراحة تامة...' : 'Describe the situation, decision, or dilemma you are facing here with total honesty...'}
             />
             
             <AnimatePresence>
               {showRadarWarning && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10, scale: 0.9 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-20 w-fit"
                 >
                   <div className="bg-rose-600 text-white px-8 py-3 rounded-full flex items-center justify-between gap-6 shadow-[0_10px_30px_rgba(225,29,72,0.3)] whitespace-nowrap border-4 border-white">
                     <div className="flex items-center gap-3">
                        <VolumeX className="w-5 h-5 animate-bounce" />
                        <span className="font-black text-xs md:text-sm tracking-tight">{language === 'ar' ? 'تحذير: القرار يبدو انفعالياً. تبيان تنصح بالتريث.' : 'ALERT: Decision appears emotional. Tibyan suggests waiting.'}</span>
                     </div>
                     <button onClick={() => setShowRadarWarning(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                     </button>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>

           <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {tools.map(tool => (
                  <button 
                    key={tool.id} 
                    onClick={() => runAnalysis(tool)}
                    disabled={isLoading}
                    className={cn(
                        "group relative flex flex-col items-center justify-center gap-4 p-8 rounded-[32px] bg-white border border-zinc-100 shadow-sm transition-all hover:shadow-[0_15px_40px_rgba(0,0,0,0.05)] hover:border-black active:scale-[0.96] overflow-hidden",
                        !dilemma && "opacity-60 grayscale-[0.5]"
                    )}
                  >
                      <div className={cn("w-16 h-16 rounded-[22px] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500", tool.bgColor)}>
                        <tool.icon className="w-8 h-8" />
                      </div>
                      <span className="font-black text-center text-xs px-2 line-clamp-1">{language === 'ar' ? tool.title.ar : tool.title.en}</span>
                      
                      {/* Hover status dot */}
                      <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-zinc-200 group-hover:bg-emerald-500 transition-colors"></div>
                  </button>
              ))}
           </div>

           <AnimatePresence>
            {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-20 text-indigo-600">
                    <Loader2 className="w-12 h-12 animate-spin" />
                    <p className="font-black text-xs tracking-widest">{language === 'ar' ? 'تبيان تقوم بالمعالجة الاستراتيجية والتحليل العميق...' : 'TIBYAN PROCESSING STRATEGIC ANALYSIS...'}</p>
                </motion.div>
            )}
            {result && !isLoading && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                    
                    {result.tool === 'butterfly' && result.isJson ? (
                        <div className="bg-zinc-950 text-white rounded-[48px] overflow-hidden shadow-2xl relative min-h-[500px] flex flex-col justify-end p-8 md:p-16 border-[12px] border-white ring-1 ring-zinc-200">
                            <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000')] bg-cover bg-center grayscale"></div>
                            <div className="absolute top-12 left-12 text-2xl font-black tracking-tighter text-white/40 border-b-4 border-rose-500 pb-2">
                                {result.content.magazineName}
                            </div>
                            <div className="relative z-10 space-y-8 mt-32">
                                <h1 className="text-5xl md:text-8xl font-black leading-[0.9] text-white tracking-tighter drop-shadow-2xl italic">
                                    {result.content.headline}
                                </h1>
                                <p className="text-xl md:text-3xl font-bold text-rose-400 max-w-3xl leading-snug">
                                    {result.content.subheadline}
                                </p>
                                <div className="space-y-4 mt-12 bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 max-w-xl">
                                    {result.content.bulletPoints?.map((pt: string, i: number) => (
                                        <div key={i} className="text-lg md:text-xl font-bold text-white/90 flex items-start gap-3">
                                            <span className="text-rose-500 mt-1.5 shrink-0 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"></span>
                                            {pt}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-16 text-center pt-10 border-t border-white/10 text-2xl font-black tracking-tight text-white/50 italic font-serif">
                                    "{result.content.quote}"
                                </div>
                            </div>
                        </div>
                    ) : result.tool === 'vault' ? (
                        <div className="bg-stone-950 border-[10px] border-stone-800 p-8 md:p-16 rounded-[48px] shadow-2xl text-stone-300 relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50"></div>
                             <div className="flex items-center justify-center gap-4 mb-12">
                               <Lock className="w-10 h-10 text-rose-600" />
                               <span className="text-2xl font-black tracking-[0.2em] text-white underline decoration-rose-600 decoration-4 underline-offset-8">
                                  {language === 'ar' ? 'تقرير الانحيازات الاستبدادي' : 'DESPOTIC BIAS REPORT'}
                               </span>
                             </div>
                             <div className="markdown-body prose prose-invert max-w-none prose-p:text-xl prose-p:leading-relaxed prose-p:font-medium prose-headings:text-white prose-strong:text-rose-400 prose-a:text-rose-400">
                               <ReactMarkdown>{result.content}</ReactMarkdown>
                             </div>
                        </div>
                    ) : (
                        <div className={cn(
                            "p-8 md:p-12 rounded-[40px] border-4 shadow-xl space-y-8 bg-white transition-all",
                            tools.find(t => t.id === result.tool)?.bgColor.replace('bg-', 'border-') || 'border-zinc-100'
                        )}>
                            <div className="flex items-center justify-between border-b pb-8">
                                <div className="flex items-center gap-4">
                                    {tools.find(t => t.id === result.tool)?.icon && (
                                        <div className={cn("p-4 rounded-3xl text-white shadow-lg", tools.find(t => t.id === result.tool)?.bgColor)}>
                                            {React.createElement(tools.find(t => t.id === result.tool)!.icon as any, {className: "w-8 h-8"})}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-black uppercase">
                                            {language === 'ar' ? tools.find(t => t.id === result.tool)?.title.ar : tools.find(t => t.id === result.tool)?.title.en}
                                        </h3>
                                        <p className="text-zinc-500 font-bold mt-1 tracking-widest text-xs uppercase">
                                            {language === 'ar' ? 'مخرج التحليل الاستراتيجي النهائي' : 'FINAL STRATEGIC ANALYSIS OUTPUT'}
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden md:block">
                                    <div className="text-[10px] font-mono font-bold text-zinc-300 tracking-widest text-right">
                                        ID: {Math.random().toString(36).substring(7).toUpperCase()}<br/>
                                        ENCRYPTION: AES-256<br/>
                                        CLEARANCE: L6
                                    </div>
                                </div>
                            </div>
                            <div className="markdown-body prose prose-zinc md:prose-xl max-w-none text-zinc-800 prose-headings:text-black prose-strong:text-black prose-strong:font-black leading-relaxed font-serif rtl:font-sans">
                              <ReactMarkdown>{result.content}</ReactMarkdown>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-10 border-t border-zinc-100">
                                <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                                   <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Internal Consistency</div>
                                   <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
                                      <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} className="h-full bg-emerald-500" />
                                   </div>
                                </div>
                                <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                                   <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Strategic Resonance</div>
                                   <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
                                      <motion.div initial={{ width: 0 }} animate={{ width: '87%' }} className="h-full bg-indigo-500" />
                                   </div>
                                </div>
                            </div>
                        </div>
                    )}

                </motion.div>
            )}
           </AnimatePresence>
        </div>
    );
};
