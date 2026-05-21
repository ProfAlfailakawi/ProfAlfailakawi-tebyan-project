import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Search, Loader2, Sparkles, ShieldAlert, Users, History, MessageSquareQuote, GitBranch, Hourglass, Eye, Lock, VolumeX, X, ArrowRight, Scale, LayoutGrid } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';
import { IntellectualKintsugi } from '../common/IntellectualKintsugi';
import { ai, universalOracle } from '../../services/gemini';
import ReactMarkdown from 'react-markdown';

type AnalysisTool = {
    id: string;
    title: { ar: string, en: string };
    icon: any;
    prompt: string;
    bgColor: string;
    purpose?: string[];
    hint?: { ar: string, en: string };
};

export const DecisionExecutiveTab = ({ language, handleTabChange, initialValue = '', onValueUsed }: { language: 'ar' | 'en', handleTabChange: any, initialValue?: string, onValueUsed?: () => void }) => {
    const [dilemma, setDilemma] = useState(initialValue);
    const [activeDecisionPurpose, setActiveDecisionPurpose] = useState('decide');
    const [dilemmaHistory, setDilemmaHistory] = useState<string[]>([]);
    const lastSubmittedDilemma = useRef(initialValue);

    useEffect(() => {
        if (initialValue) {
            setDilemma(initialValue);
            lastSubmittedDilemma.current = initialValue;
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
        { id: 'decision', title: { ar: 'القرار التنفيذي', en: 'Executive Decision' }, icon: Lock, bgColor: 'bg-black', purpose: ['decide'], hint: { ar: 'يحسم الموقف في قرار واضح ومسؤول', en: 'Turns the situation into a clear responsible decision' }, prompt: 'حول هذه الموقف لقرار تنفيذي حاسم ومسؤول: ' },
        { id: 'consequences', title: { ar: 'موجات العواقب', en: 'Consequence Waves' }, icon: GitBranch, bgColor: 'bg-indigo-600', purpose: ['future','risk'], hint: { ar: 'يرى أثر القرار طبقة بعد طبقة', en: 'Shows effects layer by layer' }, prompt: 'حلل العواقب من الدرجة الأولى والثانية والثالثة لهذا القرار: ' },
        { id: 'doubt', title: { ar: 'ميزان اليقين', en: 'Gravity of Doubt' }, icon: Scale, bgColor: 'bg-zinc-800', purpose: ['decide','risk'], hint: { ar: 'يقيس اليقين والشك قبل الحسم', en: 'Measures certainty and doubt before deciding' }, prompt: 'قم بتحليل درجة اليقين والشك في هذا القرار. أرجع JSON فقط بالشكل التالي: { "certainty": 70, "doubt": 30, "certaintyArguments": ["حجة 1", "حجة 2"], "doubtArguments": ["حجة 1", "حجة 2"], "verdict": "الحكم النهائي" }. لا ترجع أي نص خارج JSON. القرار هو: ' },
        { id: 'capsule', title: { ar: 'كبسولة الزمن للقرارات', en: 'Time Capsule' }, icon: Hourglass, bgColor: 'bg-amber-900', purpose: ['future'], hint: { ar: 'رسالة مستقبلية تكشف أثر قرارك', en: 'A future message about your decision' }, prompt: 'قم بإعداد كبسولة زمنية لهذا القرار تفتح بعد سنة. أرجع JSON فقط بالشكل التالي: { "targetDate": "2027", "projectedOutcome": "النتيجة المتوقعة العظمى", "messageToFutureSelf": "رسالة قاسية أو محفزة لنفسك في المستقبل", "sealedConfidence": 85 }. لا ترجع نصاً خارج JSON. القرار هو: ' },
        { id: 'council', title: { ar: 'مجلس العقول', en: 'Council of Minds' }, icon: Users, bgColor: 'bg-emerald-600', purpose: ['voices'], hint: { ar: 'يسمع القرار من عقول مختلفة', en: 'Reviews the decision through different minds' }, prompt: 'حلل هذا القرار كفيلسوف، اقتصادي، قانوني، استراتيجي، وخصم: ' },
        { id: 'collapse', title: { ar: 'اختبار الاختراق فكرياً', en: 'Red Team Test' }, icon: ShieldAlert, bgColor: 'bg-rose-600', purpose: ['risk'], hint: { ar: 'يحاول إسقاط القرار قبل الواقع', en: 'Stress-tests the decision before reality does' }, prompt: 'قم بدور "الفريق الأحمر" وحاول تدمير هذا القرار فكرياً واكشف نقاط ضعفه القاتلة: ' },
        { id: 'hidden', title: { ar: 'الخيوط الخفية', en: 'Hidden Threads' }, icon: Eye, bgColor: 'bg-amber-600', purpose: ['risk','voices'], hint: { ar: 'يكشف النفوذ والمخاطر الصامتة', en: 'Reveals silent influence and risks' }, prompt: 'اكشف أصحاب المصلحة والنفوذ والمخاطر الصامتة لهذا القرار: ' },
        { id: 'memory', title: { ar: 'البصمة الفكرية', en: 'Cognitive Trace' }, icon: History, bgColor: 'bg-slate-700', purpose: ['voices'], hint: { ar: 'يربط القرار بسياق التفكير', en: 'Links the decision to thinking patterns' }, prompt: 'حلل هذا القرار بناءً على سياق التفكير الاستراتيجي العميق ومبادئه: ' },
        { id: 'questions', title: { ar: 'محرك الأسئلة', en: 'Question Engine' }, icon: MessageSquareQuote, bgColor: 'bg-purple-600', purpose: ['risk','decide'], hint: { ar: 'يولد الأسئلة التي غابت عنك', en: 'Generates questions you missed' }, prompt: 'ولد الأسئلة الليزرية الدقيقة التي كان يجب أن تُسأل ولم تُسأل حول هذا القرار: ' },
        { id: 'debate', title: { ar: 'الميزان الاستراتيجي', en: 'Strategic Scale' }, icon: Brain, bgColor: 'bg-cyan-600', purpose: ['decide','voices'], hint: { ar: 'يقارن أقوى حجة مع وضد', en: 'Compares strongest case for and against' }, prompt: 'ابنِ أقوى حجة مع، وأقوى حجة ضد، ثم احكم بينهما لهذا القرار بإنصاف: ' },
        { id: 'butterfly', title: { ar: 'رؤية 360 درجة', en: '360 Horizon' }, icon: Sparkles, bgColor: 'bg-fuchsia-700', purpose: ['future'], hint: { ar: 'يحاكي المشهد البعيد بوضوح', en: 'Simulates the long horizon clearly' }, prompt: 'تخيل أنني اتخذت هذا القرار. محاكاة العواقب بعد 5 سنوات. أرجع الرد بصيغة JSON فقط JSON ONLY يحتوي على: { "magazineName": "FORBES 2030", "headline": "العنوان الرئيسي القوي", "subheadline": "عنوان فرعي يشرح الصدمة", "bulletPoints": ["نقطة 1", "نقطة 2", "نقطة 3"], "quote": "اقتباس مقولة ملهمة عن أثر القرار" }. لا ترجع أي نص خارج الJSON. القرار هو: ' },
        { id: 'vault', title: { ar: 'مرآة التحيزات', en: 'Bias Mirror' }, icon: Lock, bgColor: 'bg-stone-900', purpose: ['risk'], hint: { ar: 'يكشف أين قد تخدع نفسك', en: 'Shows where you may fool yourself' }, prompt: 'أنا سأتخذ هذا القرار. اصنع "مرآة قاسية" تكشف أين أقع بمصيدة الانحياز التأكيدي. حلل كيف سأندم وكيف سأفرح. أسلوبك قاسي جداً وواقعي: ' },
    ];



    const decisionPurposes = [
        { id: 'decide', title: { ar: 'أبي أحسم القرار', en: 'I need to decide' }, hint: { ar: 'حكم واضح وميزان للحجج', en: 'Clear judgment and argument balance' } },
        { id: 'risk', title: { ar: 'أبي أفحص المخاطر', en: 'Check the risks' }, hint: { ar: 'تحيزات وعواقب ونقاط ضعف', en: 'Biases, consequences, and weak points' } },
        { id: 'voices', title: { ar: 'أبي أسمع العقول', en: 'Hear different minds' }, hint: { ar: 'خبراء وأسئلة وسياق', en: 'Experts, questions, and context' } },
        { id: 'future', title: { ar: 'أبي أشوف المستقبل', en: 'See the future' }, hint: { ar: 'محاكاة الأثر والزمن', en: 'Time and impact simulation' } },
        { id: 'all', title: { ar: 'الغرفة الكاملة', en: 'Full room' }, hint: { ar: 'كل أدوات القرار كما هي', en: 'All decision tools unchanged' } },
    ];

    const visibleDecisionTools = activeDecisionPurpose === 'all'
        ? tools
        : tools.filter(tool => tool.purpose?.includes(activeDecisionPurpose));

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
        
        if (dilemma !== lastSubmittedDilemma.current) {
            if (lastSubmittedDilemma.current) {
                setDilemmaHistory(prev => [...prev, lastSubmittedDilemma.current]);
            }
            lastSubmittedDilemma.current = dilemma;
        }

        setIsLoading(true);
        setResult(null);
        try {
            const prompt = `${tool.prompt} ${trimmedDilemma}`;
            const content = await universalOracle(prompt, tool.title.en, language);
            
            if (!content) throw new Error("No response from Oracle");

            if (tool.id === 'butterfly' || tool.id === 'doubt' || tool.id === 'capsule') {
                try {
                    let jsonStr = content.trim();
                    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/```json\n?/, '');
                    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```\n?/, '');
                    if (jsonStr.endsWith('```')) jsonStr = jsonStr.replace(/```$/, '');
                    setResult({ tool: tool.id, content: JSON.parse(jsonStr), isJson: true });
                    setTimeout(() => document.getElementById('decision-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
                } catch(e) {
                    if (tool.id === 'butterfly') {
                        setResult({ tool: tool.id, content: { magazineName: 'Future Link', headline: 'تم استشراف المستقبل', subheadline: 'الذكاء حلل الأثر البعيد للقرار', bulletPoints: [content.substring(0, 100) + '...'], quote: 'تبيان استكشف الأثر.' }, isJson: true });
                    } else if (tool.id === 'capsule') {
                        setResult({ tool: tool.id, content: { targetDate: 'بعد عام', projectedOutcome: 'مجهول', messageToFutureSelf: 'الكبسولة معطوبة.', sealedConfidence: 50 }, isJson: true });
                    } else {
                        setResult({ tool: tool.id, content: { certainty: 50, doubt: 50, certaintyArguments: ["البيانات غير كافية لليقين"], doubtArguments: ["الغموض الاستراتيجي يعيق التحليل"], verdict: "تعذر الحساب بدقة" }, isJson: true });
                    }
                }
            } else {
               setResult({ tool: tool.id, content: content });
            }
        } catch (e: any) {
            console.error("Decision analysis failed:", e);
            setResult({ tool: 'Error', content: language === 'ar' ? `لقد تعثرت عملية التحليل الاستراتيجي.. المحرك يحتاج إلى إعادة ضبط المسار. جرب المحاولة مرة أخرى بعد ثوانٍ. (${e.message})` : `Strategic analysis stumbled.. The engine needs to recalibrate. Try again in a few seconds. (${e.message})` });
        } finally {
            setIsLoading(false);
            setTimeout(() => document.getElementById('decision-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 180);
        }
    };

    useEffect(() => {
        if (!isLoading && result) {
            setTimeout(() => {
                document.getElementById('decision-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [isLoading, result]);

    return (
        <div className="space-y-8 px-2 pb-20 max-w-6xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
             <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#EEF4F1]0 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5F837A]">{language === 'ar' ? 'الوضع الآمن فعال' : 'SECURE MODE ACTIVE'}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-[#182231] tracking-tight leading-none uppercase">
                    {language === 'ar' ? 'غرفة القرار السرية' : 'SECRET DECISION ROOM'}
                </h1>
                <p className="text-[#64788D] font-bold text-sm md:text-lg max-w-2xl leading-relaxed">
                    {language === 'ar' ? 'بيئة استراتيجية معزولة لتفكيك المعضلات واتخاذ قرارات مبنية على بيانات إدراكية عميقة.' : 'A secure strategic environment to dismantle dilemmas and make decisions based on deep cognitive insights.'}
                </p>
             </div>
             <button 
               onClick={() => handleTabChange('discover')}
               className="px-6 py-2 bg-[#FAF9F6]/88 border border-[#8FA9C7]/25 rounded-full font-bold text-sm text-[#64788D] hover:text-[#182231] hover:border-[#8E7AAE] transition-all flex items-center gap-2 w-fit active:scale-95"
             >
                <History className="w-4 h-4" />
                {language === 'ar' ? 'العودة للاستكشاف' : 'Back to Discover'}
             </button>
           </div>

           <AnimatePresence>
             {lastSubmittedDilemma.current && dilemma !== lastSubmittedDilemma.current && (
               <motion.div 
                 initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                 animate={{ opacity: 1, height: 'auto', marginBottom: 32 }} 
                 exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                 className="overflow-hidden"
               >
                 <IntellectualKintsugi 
                    oldText={lastSubmittedDilemma.current} 
                    newText={dilemma} 
                    language={language} 
                 />
               </motion.div>
             )}
           </AnimatePresence>

           <div className="relative group/input">
             <div className="absolute -top-3 right-6 z-20 px-3 py-1 bg-[#8E7AAE] text-white text-[10px] md:text-[11px] font-black uppercase tracking-wider rounded-full shadow-lg group-focus-within/input:bg-rose-600 transition-colors">
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
                 "w-full h-32 md:h-40 p-5 md:p-8 pt-8 md:pt-10 rounded-[26px] md:rounded-[48px] border-2 text-base md:text-xl font-medium focus:ring-8 transition-all relative z-10 custom-scrollbar resize-none leading-relaxed",
                 showRadarWarning ? "border-rose-900/50 bg-stone-900 text-rose-100 placeholder:text-rose-900/30 focus:ring-rose-900/10" : "border-[#8FA9C7]/15 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.02)] focus:ring-black/5 focus:border-[#8E7AAE] focus:shadow-[0_30px_60px_rgba(0,0,0,0.06)]"
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

           

           <div className="bg-[#FAF9F6]/88 border border-[#8FA9C7]/15 rounded-[32px] p-5 md:p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-black text-[#182231]">{language === 'ar' ? 'ماذا تريد من القرار؟' : 'What do you need from this decision?'}</h2>
                  <p className="text-sm text-[#64788D] font-bold mt-1">{language === 'ar' ? 'اختر مقصدك؛ الغرفة تقرّب الأدوات المناسبة فقط، وكل الأدوات باقية.' : 'Choose your intent; the room brings the right tools closer, while every tool remains available.'}</p>
                </div>
                <button type="button" onClick={() => setActiveDecisionPurpose('all')} className="hidden px-5 py-3 rounded-full bg-[#8E7AAE] text-white text-xs font-black items-center gap-2 active:scale-95 transition-all">
                  <LayoutGrid className="w-4 h-4" />
                  {language === 'ar' ? 'الغرفة الكاملة' : 'Full room'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {decisionPurposes.map(purpose => (
                  <button key={purpose.id} type="button" onClick={() => setActiveDecisionPurpose(purpose.id)} className={cn("text-right p-4 rounded-[22px] border transition-all active:scale-[0.98]", activeDecisionPurpose === purpose.id ? "bg-[#8E7AAE] text-white border-zinc-950 shadow-lg" : "bg-[#F7F5F2] text-[#3D4A5A] border-[#8FA9C7]/15 hover:bg-white hover:border-zinc-300")}>
                    <div className="font-black text-sm mb-1">{language === 'ar' ? purpose.title.ar : purpose.title.en}</div>
                    <div className={cn("text-[11px] leading-relaxed font-bold", activeDecisionPurpose === purpose.id ? "text-white/70" : "text-[#7C8796]")}>{language === 'ar' ? purpose.hint.ar : purpose.hint.en}</div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {visibleDecisionTools.map(tool => (
                    <button 
                      key={tool.id} 
                      onClick={() => runAnalysis(tool)}
                      disabled={isLoading}
                      title={language === 'ar' ? tool.hint?.ar : tool.hint?.en}
                      className={cn(
                          "group relative flex flex-col items-center justify-center gap-4 p-6 rounded-[28px] bg-[#FAF9F6]/88 border border-[#8FA9C7]/15 shadow-sm transition-all hover:shadow-[0_15px_40px_rgba(0,0,0,0.05)] hover:border-[#8E7AAE] active:scale-[0.96] overflow-hidden",
                          !dilemma && "opacity-60 grayscale-[0.5]"
                      )}
                    >
                        <div className={cn("w-16 h-16 rounded-[22px] text-white flex items-center justify-center shadow-lg group-hover:scale-[1.03] transition-transform duration-500", tool.bgColor)}>
                          <tool.icon className="w-8 h-8" />
                        </div>
                        <span className="font-black text-center text-sm px-2">{language === 'ar' ? tool.title.ar : tool.title.en}</span>
                        <p className="text-[11px] text-[#7C8796] font-bold text-center leading-relaxed line-clamp-2">{language === 'ar' ? tool.hint?.ar : tool.hint?.en}</p>
                        <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-zinc-200 group-hover:bg-[#EEF4F1]0 transition-colors"></div>
                    </button>
                ))}
              </div>
           </div>

           <div id="decision-results">
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
                        <div className="bg-[#8E7AAE] text-white rounded-[40px] md:rounded-[56px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative min-h-[500px] md:min-h-[700px] flex flex-col justify-end p-8 md:p-16 border-[8px] md:border-[16px] border-zinc-900 ring-1 ring-white/10">
                            <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000')] bg-cover bg-center grayscale scale-105"></div>
                            
                            <div className="absolute top-8 left-8 md:top-12 md:left-12 text-[10px] md:text-sm font-black tracking-[0.3em] text-rose-500 border-b md:border-b-2 border-rose-600 pb-1 md:pb-2 uppercase drop-shadow-2xl z-20">
                                {result.content.magazineName}
                            </div>
                            
                            <div className="relative z-10 space-y-4 md:space-y-6 max-w-4xl w-full">
                                <motion.h1 
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-3xl md:text-5xl lg:text-7xl font-black leading-[1.1] md:leading-[1.0] tracking-tighter drop-shadow-2xl italic uppercase text-white break-words"
                                >
                                    {result.content.headline}
                                </motion.h1>
                                
                                <motion.p 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-base md:text-xl lg:text-2xl font-bold text-rose-400 max-w-2xl leading-normal drop-shadow-lg"
                                >
                                    {result.content.subheadline}
                                </motion.p>
                                
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="space-y-2 md:space-y-3 bg-black/40 backdrop-blur-md p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-white/10 max-w-xl mt-4"
                                >
                                    {result.content.bulletPoints?.map((pt: string, i: number) => (
                                        <div key={i} className="text-sm md:text-base lg:text-lg font-bold text-white flex items-start gap-4">
                                            <span className="text-rose-500 mt-1.5 shrink-0 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]"></span>
                                            {pt}
                                        </div>
                                    ))}
                                </motion.div>
                                
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-8 md:mt-12 text-center pt-8 border-t border-white/10 text-base md:text-lg font-medium tracking-tight text-white italic leading-relaxed px-4 opacity-90"
                                >
                                    "{result.content.quote}"
                                </motion.div>
                            </div>
                        </div>
                     ) : result.tool === 'doubt' && result.isJson ? (
                         <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-[40px] shadow-2xl relative overflow-hidden">
                             <div className="flex flex-col md:flex-row items-center gap-12 max-w-4xl mx-auto">
                                 {/* Scale Visual */}
                                 <div className="flex-1 w-full flex flex-col items-center justify-center relative">
                                    <div className="w-1 h-32 bg-zinc-700 mx-auto"></div>
                                    <motion.div 
                                        initial={{ rotate: 0 }}
                                        animate={{ rotate: (result.content.certainty - 50) * 0.4 }}
                                        transition={{ type: 'spring', damping: 10, stiffness: 50 }}
                                        className="w-full max-w-xs h-2 bg-gradient-to-r from-emerald-500 to-rose-500 rounded-full relative Origin-center"
                                    >
                                        <div className="absolute -top-16 -left-8 w-16 h-16 rounded-full border-2 border-emerald-500/50 bg-[#EEF4F1]0/10 flex items-center justify-center">
                                            <span className="text-emerald-400 font-black">{result.content.certainty}%</span>
                                        </div>
                                        <div className="absolute -top-16 -right-8 w-16 h-16 rounded-full border-2 border-rose-500/50 bg-rose-500/10 flex items-center justify-center">
                                            <span className="text-rose-400 font-black">{result.content.doubt}%</span>
                                        </div>
                                    </motion.div>
                                    <div className="mt-12 text-center">
                                        <div className="text-xs font-black uppercase tracking-widest text-[#64788D] mb-2">
                                            {language === 'ar' ? 'ميزان اليقين' : 'GRAVITY OF DOUBT'}
                                        </div>
                                        <h3 className="text-3xl font-black text-white">
                                            {result.content.verdict}
                                        </h3>
                                    </div>
                                 </div>

                                 {/* Arguments */}
                                 <div className="flex-1 w-full space-y-8">
                                     <div>
                                        <h4 className="text-emerald-400 font-black tracking-widest text-sm uppercase mb-4 mb-4 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#EEF4F1]0"></div>
                                            {language === 'ar' ? 'ركائز اليقين' : 'Pillars of Certainty'}
                                        </h4>
                                        <ul className="space-y-3">
                                            {result.content.certaintyArguments?.map((arg: string, i: number) => (
                                                <li key={i} className="text-zinc-300 text-sm font-medium leading-relaxed">
                                                    {arg}
                                                </li>
                                            ))}
                                        </ul>
                                     </div>
                                     <div className="w-full h-px bg-zinc-800"></div>
                                     <div>
                                        <h4 className="text-rose-400 font-black tracking-widest text-sm uppercase mb-4 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                            {language === 'ar' ? 'أثقال الشك' : 'Weights of Doubt'}
                                        </h4>
                                        <ul className="space-y-3">
                                            {result.content.doubtArguments?.map((arg: string, i: number) => (
                                                <li key={i} className="text-zinc-300 text-sm font-medium leading-relaxed">
                                                    {arg}
                                                </li>
                                            ))}
                                        </ul>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     ) : result.tool === 'capsule' && result.isJson ? (
                         <div className="bg-gradient-to-b from-amber-900 to-black p-8 md:p-16 rounded-[40px] shadow-2xl relative overflow-hidden text-center text-amber-50">
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
                             
                             <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
                                 <motion.div 
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 1 }}
                                    className="w-24 h-24 mb-8 text-amber-400 bg-black/50 rounded-full flex items-center justify-center border border-amber-500/30 shadow-[0_0_50px_rgba(251,191,36,0.2)]"
                                 >
                                     <Hourglass className="w-12 h-12" />
                                 </motion.div>
                                 <h2 className="text-sm font-black uppercase tracking-[0.4em] text-amber-500 mb-4">
                                     {language === 'ar' ? 'كبسولة الزمن مختومة' : 'TIME CAPSULE SEALED'}
                                 </h2>
                                 <p className="text-2xl md:text-4xl font-bold mb-12 italic leading-relaxed">
                                     "{result.content.messageToFutureSelf}"
                                 </p>
                                 
                                 <div className="grid grid-cols-2 gap-4 w-full">
                                     <div className="bg-black/40 border border-amber-900/50 p-6 rounded-3xl">
                                         <div className="text-[10px] text-amber-500 uppercase font-black tracking-widest mb-2">{language === 'ar' ? 'تاريخ الفتح' : 'UNLOCK DATE'}</div>
                                         <div className="text-xl font-bold">{result.content.targetDate}</div>
                                     </div>
                                     <div className="bg-black/40 border border-amber-900/50 p-6 rounded-3xl">
                                         <div className="text-[10px] text-amber-500 uppercase font-black tracking-widest mb-2">{language === 'ar' ? 'مستوى الثقة وقت الختم' : 'SEALED CONFIDENCE'}</div>
                                         <div className="text-xl font-bold">{result.content.sealedConfidence}%</div>
                                     </div>
                                 </div>
                                 
                                 <div className="mt-8 bg-black/40 border border-amber-900/50 p-6 rounded-3xl w-full text-left" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                     <div className="text-[10px] text-amber-500 uppercase font-black tracking-widest mb-2">{language === 'ar' ? 'النتيجة المتوقعة' : 'PROJECTED OUTCOME'}</div>
                                     <div className="text-lg font-medium leading-relaxed">{result.content.projectedOutcome}</div>
                                 </div>
                             </div>
                         </div>
                     ) : result.tool === 'vault' ? (
                        <div className="bg-stone-950 border-[6px] md:border-[12px] border-stone-900 p-8 md:p-24 rounded-[32px] md:rounded-[60px] shadow-2xl relative overflow-hidden text-zinc-100">
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.05),transparent)] pointer-events-none"></div>
                             <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-rose-600 to-transparent opacity-80"></div>
                             
                             <div className="flex flex-col items-center justify-center gap-6 mb-16 md:mb-24 relative z-10">
                               <div className="p-6 bg-rose-600/10 rounded-3xl border-2 border-rose-600/30 shadow-[0_0_30px_rgba(225,29,72,0.1)]">
                                 <Lock className="w-10 h-10 md:w-16 md:h-16 text-rose-500" />
                               </div>
                               <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-white uppercase text-center drop-shadow-2xl">
                                  {language === 'ar' ? 'تقرير الانحيازات الاستبدادي' : 'DESPOTIC BIAS REPORT'}
                               </h2>
                             </div>
                             
                             <div className="markdown-body prose prose-invert max-w-none relative z-10
                                prose-p:!text-zinc-100 prose-p:text-xl md:prose-p:text-3xl prose-p:leading-relaxed prose-p:font-bold prose-p:mb-10
                                prose-headings:!text-white prose-headings:font-black prose-headings:tracking-tighter prose-headings:mb-12 md:prose-headings:text-7xl
                                prose-strong:!text-rose-400 prose-strong:font-black prose-strong:text-2xl md:prose-strong:text-4xl
                                prose-li:!text-zinc-100 prose-li:text-xl md:prose-li:text-2xl prose-li:mb-4
                                prose-blockquote:border-rose-600 prose-blockquote:bg-rose-900/20 prose-blockquote:p-10 md:prose-blockquote:p-16 prose-blockquote:rounded-[40px] prose-blockquote:!text-zinc-50 prose-blockquote:not-italic prose-blockquote:font-bold prose-blockquote:text-2xl md:prose-blockquote:text-4xl">
                               <ReactMarkdown>{result.content}</ReactMarkdown>
                             </div>
                        </div>
                    ) : (
                        <div className={cn(
                            "p-8 md:p-12 rounded-[40px] border-4 shadow-xl space-y-8 bg-white transition-all",
                            tools.find(t => t.id === result.tool)?.bgColor?.replace('bg-', 'border-') || 'border-[#8FA9C7]/25'
                        )}>
                            <div className="flex items-center justify-between border-b pb-8">
                                <div className="flex items-center gap-4">
                                    {tools.find(t => t.id === result.tool)?.icon ? (
                                        <div className={cn("p-4 rounded-3xl text-white shadow-lg", tools.find(t => t.id === result.tool)?.bgColor)}>
                                            {React.createElement(tools.find(t => t.id === result.tool)!.icon as any, {className: "w-8 h-8"})}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-3xl bg-rose-500 text-white shadow-lg">
                                            <ShieldAlert className="w-8 h-8" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-[#182231] uppercase">
                                            {tools.find(t => t.id === result.tool)?.title[language] || (result.tool === 'Error' ? (language === 'ar' ? 'خطأ في التحليل' : 'Analysis Error') : result.tool)}
                                        </h3>
                                        <p className="text-[#64788D] font-bold mt-1 tracking-widest text-xs uppercase">
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
                            <div className="markdown-body prose prose-zinc md:prose-xl max-w-none text-[#273548] prose-headings:text-[#182231] prose-strong:text-[#182231] prose-strong:font-black leading-relaxed font-serif rtl:font-sans">
                              <ReactMarkdown>{result.content}</ReactMarkdown>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-10 border-t border-[#8FA9C7]/15">
                                <div className="p-6 bg-[#F7F5F2] rounded-3xl border border-[#8FA9C7]/15">
                                   <div className="text-[10px] font-black text-[#7C8796] uppercase tracking-widest mb-2">Internal Consistency</div>
                                   <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
                                      <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} className="h-full bg-[#EEF4F1]0" />
                                   </div>
                                </div>
                                <div className="p-6 bg-[#F7F5F2] rounded-3xl border border-[#8FA9C7]/15">
                                   <div className="text-[10px] font-black text-[#7C8796] uppercase tracking-widest mb-2">Strategic Resonance</div>
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
        </div>
    );
};
