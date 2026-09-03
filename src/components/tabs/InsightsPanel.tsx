
import React, { useState } from 'react';
import { Sparkles, Network, BrainCircuit, TrendingUp, X, Loader2 } from 'lucide-react';
import { getIdeaSerendipity, analyzeTrends, generateMindMap } from '../../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

export const InsightsPanel = ({ ideas, onClose, language, handleTabChange }: { ideas: any[], onClose: () => void, language: 'ar' | 'en', handleTabChange: any }) => {
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const runAction = async (action: 'serendipity' | 'trends' | 'mindmap', data: any) => {
        setIsLoading(true);
        setResult(null);
        try {
            if (action === 'serendipity') setResult(await getIdeaSerendipity(data.a.text, data.b.text, language));
            if (action === 'trends') setResult(await analyzeTrends(ideas.map(i => i.text), language));
            if (action === 'mindmap') setResult(await generateMindMap(data.text, language));
        } catch (e) {
            setResult(language === 'ar' ? 'حدث خطأ' : 'Error');
        }
        setIsLoading(false);
    };

    return (
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 p-6 overflow-y-auto">
            <button onClick={onClose} className="mb-4 text-zinc-500"><X /></button>
            <h2 className="text-xl font-bold mb-6">{language === 'ar' ? 'لوحة الأفكار' : 'Insights Panel'}</h2>
            
            <div className="space-y-4">
               <button onClick={() => runAction('trends', null)} className="w-full bg-zinc-900 text-white p-3 rounded-lg flex items-center gap-2 text-sm"><TrendingUp size={16}/> {language === 'ar' ? 'تحليل الاتجاهات' : 'Analyze Trends'}</button>
               <button onClick={() => handleTabChange('knowledgegraph')} className="w-full bg-zinc-100 text-black p-3 rounded-lg flex items-center gap-2 text-sm"><Network size={16}/> {language === 'ar' ? 'الخريطة الحية' : 'Live Knowledge Graph'}</button>
               <button onClick={() => handleTabChange('mindmap', ideas[0]?.text)} className="w-full bg-zinc-100 text-black p-3 rounded-lg flex items-center gap-2 text-sm"><BrainCircuit size={16}/> {language === 'ar' ? 'التكثيف المعرفي' : 'AI Mind-Mapping'}</button>
            </div>

            {isLoading && <Loader2 className="animate-spin mt-4" />}
            {result && <div className="mt-6 p-4 bg-zinc-100 rounded-lg text-sm">{result}</div>}
        </motion.div>
    );
};
