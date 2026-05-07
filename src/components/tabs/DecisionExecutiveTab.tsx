import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Search, Loader2, Sparkles, ShieldAlert, Users, History, MessageSquareQuote, GitBranch, Hourglass, Eye, Lock } from 'lucide-react';
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

export const DecisionExecutiveTab = ({ language, handleTabChange }: { language: 'ar' | 'en', handleTabChange: any }) => {
    const [dilemma, setDilemma] = useState('');
    const [result, setResult] = useState<{tool: string, content: string} | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const tools: AnalysisTool[] = [
        { id: 'consequences', title: { ar: 'آلة العواقب', en: 'Consequences Machine' }, icon: GitBranch, bgColor: 'bg-indigo-500', prompt: 'حلل العواقب من الدرجة الأولى والثانية والثالثة لهذا القرار: ' },
        { id: 'council', title: { ar: 'مجلس العقول المتعددة', en: 'Council of Minds' }, icon: Users, bgColor: 'bg-emerald-500', prompt: 'حلل هذا القرار كفيلسوف، اقتصادي، قانوني، استراتيجي، خصم، ومؤرخ: ' },
        { id: 'collapse', title: { ar: 'محاكاة الانهيار', en: 'Collapse Simulation' }, icon: ShieldAlert, bgColor: 'bg-rose-500', prompt: 'حاول تدمير هذا القرار فكرياً واكشف نقاط ضعفه: ' },
        { id: 'hidden', title: { ar: 'خريطة القوى الخفية', en: 'Hidden Powers Map' }, icon: Eye, bgColor: 'bg-amber-500', prompt: 'اكشف أصحاب المصلحة والنفوذ والمخاطر والتحالفات لهذا القرار: ' },
        { id: 'memory', title: { ar: 'ذاكرة فكرية', en: 'Intellectual Memory' }, icon: History, bgColor: 'bg-slate-500', prompt: 'تحليل القرار بناءً على نمط التفكير المعتاد: ' },
        { id: 'questions', title: { ar: 'الأسئلة العميقة', en: 'Deep Questions' }, icon: MessageSquareQuote, bgColor: 'bg-purple-500', prompt: 'ولد الأسئلة التي كان يجب أن تُسأل ولم تُسأل حول هذا القرار: ' },
        { id: 'debate', title: { ar: 'مناظرة داخلية', en: 'Internal Debate' }, icon: Brain, bgColor: 'bg-cyan-500', prompt: 'ابنِ أقوى حجة مع، وأقوى حجة ضد، ثم احكم بينهما لهذا القرار: ' },
        { id: 'time', title: { ar: 'اختبار الزمن', en: 'Time Test' }, icon: Hourglass, bgColor: 'bg-zinc-500', prompt: 'كيف يبدو هذا القرار بعد سنة، 5 سنوات، و20 سنة: ' },
        { id: 'bias', title: { ar: 'مرآة التحيزات', en: 'Bias Mirror' }, icon: Search, bgColor: 'bg-blue-500', prompt: 'اكشف التحيزات في هذا القرار: ' },
        { id: 'secret', title: { ar: 'محرك القرار التنفيذي', en: 'Decision Room' }, icon: Lock, bgColor: 'bg-black', prompt: 'حول هذه الأزمة لقرار واضح ومنظم تنفيذي: ' },
    ];

    const runAnalysis = async (tool: AnalysisTool) => {
        if (!dilemma) return;
        setIsLoading(true);
        setResult(null);
        try {
            const response = await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: [{ role: 'user', parts: [{ text: `${tool.prompt} ${dilemma}` }] }]
            });
            const content = response.response.text();
            setResult({ tool: language === 'ar' ? tool.title.ar : tool.title.en, content: content || 'No result' });
        } catch (e) {
            setResult({ tool: 'Error', content: 'حدث خطأ. يرجى المحاولة لاحقاً.' });
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

           <textarea 
             value={dilemma}
             onChange={(e) => setDilemma(e.target.value)}
             className="w-full h-32 p-6 rounded-3xl border border-zinc-200 focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
             placeholder={language === 'ar' ? 'ادخل معضلتك أو قرارك هنا...' : 'Enter your dilemma or decision here...'}
           />

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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl border shadow-sm space-y-4">
                    <h3 className="text-xl font-black text-indigo-900 border-b pb-4">{result.tool}</h3>
                    <div className="markdown-body prose max-w-none text-zinc-800">
                      <ReactMarkdown>{result.content}</ReactMarkdown>
                    </div>
                </motion.div>
            )}
           </AnimatePresence>
        </div>
    );
};
