import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, RefreshCw, Bookmark, BookmarkCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useUser } from '../../contexts/UserContext';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';

interface ConceptsTabProps {
  input: string;
  setInput: (val: string) => void;
  output: string;
  isLoading: boolean;
  handleSimplify: () => void;
  language: 'ar' | 'en';
}

export const ConceptsTab = React.memo(({ language, initialValue, onValueUsed, handleTabChange }: { language: 'ar' | 'en', initialValue?: string, onValueUsed?: () => void, handleTabChange: any }) => {
  const { preferences, addToLibrary, removeFromLibrary } = useUser();
  const [input, setInput] = React.useState('');
  const [output, setOutput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
      if (onValueUsed) onValueUsed();
    }
  }, [initialValue]);

  const handleSimplify = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const { simplifyConcept } = await import('../../services/gemini');
      const res = await simplifyConcept(input);
      setOutput(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 px-2">
    <TabHeader 
      icon={Sparkles}
      title={{ ar: 'هندسة الأفكار', en: 'Idea Engineering' }}
      description={{ 
          ar: 'تبسيط المفاهيم المعقدة واختزالها في أفكار واضحة وممنهجة يسهل فهمها ونقلها.', 
          en: 'Simplify complex concepts and condense them into clear, structured ideas that are easy to understand and share.' 
      }}
      language={language}
      onBack={() => handleTabChange('discover', '')}
      onClose={() => handleTabChange('discover', '', true)}
    />
    <div className="bg-white rounded-[32px] p-8 border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-6">
      <div className="flex flex-wrap md:flex-nowrap items-center gap-4 mb-4">
        <h2 className="text-xl font-black tracking-tight text-black">{language === 'ar' ? 'المدخلات' : 'Input'}</h2>
      </div>
      <textarea 
        value={input} onChange={(e) => setInput(e.target.value)}
        className="w-full p-6 h-40 bg-zinc-50 rounded-[16px] border border-zinc-200/80 focus:border-black focus:ring-4 focus:ring-zinc-100 outline-none font-medium placeholder:text-zinc-400 transition-all resize-none"
        placeholder={language === 'ar' ? "أدخل المفهوم المعقد هنا..." : "Enter complex concept here..."}
      />
      <button 
        onClick={handleSimplify} 
        disabled={isLoading}
        title={language === 'ar' ? 'تبسيط المحتوى للنشر أو الفهم' : 'Simplify content for publishing or understanding'}
        className={cn(
          "w-full py-4 rounded-xl font-semibold text-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all flex items-center justify-center gap-3",
          isLoading ? "bg-zinc-200 text-zinc-500 cursor-not-allowed" : "bg-black text-white hover:bg-zinc-900 cursor-pointer"
        )}
      >
         {isLoading ? (
           <>
             <RefreshCw className="w-5 h-5 animate-spin" />
             <span>{language === 'ar' ? 'جاري التبسيط...' : 'Simplifying...'}</span>
           </>
         ) : (
           <span>{language === 'ar' ? 'بسط المفهوم الآن' : 'Simplify Now'}</span>
         )}
      </button>
      {error && <div className="text-rose-500 font-semibold">{error}</div>}
      <div className="relative min-h-[100px]">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full bg-zinc-50 rounded-[16px] flex flex-col items-center justify-center space-y-6 py-20 border border-zinc-200/80"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-zinc-200/80 rounded-full"></div>
              <RefreshCw className="w-16 h-16 text-black animate-spin absolute top-0 left-0" />
            </div>
            <div className="text-xl font-semibold text-zinc-600">
              {language === 'ar' ? 'جاري اختزال المفهوم وتبسيطه...' : 'Simplifying logic...'}
            </div>
          </motion.div>
        ) : output && (
          <div className="space-y-4">
            <div className="markdown-body p-8 bg-white rounded-[16px] overflow-hidden border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <ReactMarkdown>{output}</ReactMarkdown>
            </div>
            <button 
              onClick={() => {
                const isSaved = preferences.savedLibrary.some((s: any) => s.type === 'concept' && s.content === output);
                if (isSaved) {
                  const itemToRemove = preferences.savedLibrary.find((s: any) => s.type === 'concept' && s.content === output);
                  if (itemToRemove) removeFromLibrary(itemToRemove);
                } else {
                  addToLibrary({
                    id: `concept-${Date.now()}`,
                    type: 'concept',
                    question: input,
                    content: output,
                    timestamp: new Date().toISOString()
                  }, 'concept');
                }
              }}
              className={cn(
                "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                preferences.savedLibrary.some((s: any) => s.type === 'concept' && s.content === output)
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {preferences.savedLibrary.some((s: any) => s.type === 'concept' && s.content === output) ? (
                <><BookmarkCheck className="w-5 h-5" /> {language === 'ar' ? 'محفوظ في المكتبة' : 'Saved to Library'}</>
              ) : (
                <><Bookmark className="w-5 h-5" /> {language === 'ar' ? 'حفظ في المكتبة' : 'Save to Library'}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  </motion.div>
)});
