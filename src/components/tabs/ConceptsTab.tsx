import React from 'react';
import { DemoStarters } from '../../components/ui/DemoStarters';
import { motion } from 'motion/react';
import { Sparkles, Bookmark, BookmarkCheck, Box, Hammer } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useUser } from '../../contexts/UserContext';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';
import { TebyanLoader, TebyanButtonLoader } from '../ui/TebyanLoader';

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

  const [isBrutalMode, setIsBrutalMode] = React.useState(false);

  const handleSimplify = async (overrideInput?: string, brutalMode = false) => {
    const activeInput = overrideInput || input;
    if (!activeInput.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setIsBrutalMode(brutalMode);
    try {
      if (brutalMode) {
        const { universalOracle } = await import('../../services/gemini');
        const prompt = language === 'ar' 
          ? `أنت الآن "المحامي الشيطاني المتوحش". قاسي، مجرد من العواطف، ومنطقي لأبعد حد. مهمتك هي: 1. إيجاد الثغرات المنطقية. 2. تدمير الخطة وإظهار نقاط ضعفها. 3. لا تجامل أبداً. حلل هذه الفكرة وحطمها: ${activeInput}`
          : `You are now "The Brutal Devil's Advocate". Harsh, emotionless, and purely logical. Your mission: 1. Find logical loopholes. 2. Destroy this plan and show its weaknesses. 3. NEVER sugarcoat. Analyze and destroy this idea: ${activeInput}`;
        
        const content = await universalOracle(prompt, 'Brutal Advocate', language);
        setOutput(content);
      } else {
        const { simplifyConcept } = await import('../../services/gemini');
        const res = await simplifyConcept(activeInput, language);
        setOutput(res);
      }
    } catch (err: any) {
      setError("أعتذر، المحرك مزدحم حالياً بالأفكار.. جرّب مرة أخرى بعد قليل.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (initialValue && !output && !isLoading) {
      setInput(initialValue);
      // Auto-run simplify
      handleSimplify(initialValue, false);
      if (onValueUsed) onValueUsed();
    }
  }, [initialValue, output, isLoading, onValueUsed]);

  React.useEffect(() => {
    if (!isLoading && output) {
       setTimeout(() => {
           document.getElementById('concepts-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }, 100);
    }
  }, [isLoading, output]);

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
    <div className={cn("rounded-[32px] p-8 border shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-6 transition-all duration-700", isBrutalMode ? "bg-white border-[#6E5B91]/30" : "bg-white border-zinc-200/80")}>
      <div className="flex flex-wrap md:flex-nowrap items-center gap-4 mb-4">
        <h2 className={cn("text-xl font-black tracking-tight", isBrutalMode ? "text-[#6E5B91]" : "text-black")}>{language === 'ar' ? 'المدخلات' : 'Input'}</h2>
      </div>
<DemoStarters tab="concepts" language={language} onPick={setInput} className="mb-3" />
      <textarea 
        value={input} onChange={(e) => setInput(e.target.value)}
        className={cn("w-full p-6 h-40 rounded-[16px] border focus:ring-4 outline-none font-medium transition-all resize-none", isBrutalMode ? "bg-white border-[#6E5B91]/30 text-[#182231] placeholder:text-[#8A97A6] focus:border-[#6E5B91]/30 focus:ring-red-900/50" : "bg-zinc-50 border-zinc-200/80 text-black focus:border-black focus:ring-zinc-100 placeholder:text-[#64788D]")}
        placeholder={language === 'ar' ? "أدخل المفهوم المعقد هنا..." : "Enter complex concept here..."}
      />
      
      <div className="flex flex-col md:flex-row gap-4">
        <button 
          onClick={() => handleSimplify()} 
          disabled={isLoading}
          className={cn(
            "flex-1 py-4 rounded-xl font-semibold text-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all flex items-center justify-center gap-3",
            isLoading ? "bg-zinc-200 text-[#64788D] cursor-not-allowed" : "bg-[#6E5B91] text-white hover:bg-[#5F4E7F] cursor-pointer"
          )}
        >
          {isLoading ? (
            <>
              <TebyanButtonLoader className="text-current" />
              <span>{language === 'ar' ? 'جاري التبسيط...' : 'Simplifying...'}</span>
            </>
          ) : (
            <span>{language === 'ar' ? 'بسط المفهوم الآن' : 'Simplify Now'}</span>
          )}
        </button>
        <button 
          onClick={() => handleSimplify(undefined, true)} 
          disabled={isLoading}
          className={cn(
            "flex-1 py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-3",
            isLoading ? "bg-white text-[#8A97A6] border border-[#182231]/10 cursor-not-allowed" : "bg-white text-[#6E5B91] border border-[#6E5B91]/30 hover:bg-[#EFEAF6] cursor-pointer"
          )}
        >
          {isLoading && isBrutalMode ? (
             <TebyanButtonLoader className="text-current" />
          ) : null}
          <Hammer className="w-5 h-5" aria-hidden="true" /><span>{language === 'ar' ? 'حطّم فكرتي' : 'Destroy My Idea'}</span>
        </button>
      </div>
      {error && <div className="text-rose-500 font-semibold">{error}</div>}
      <div className="relative min-h-[100px]">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full bg-zinc-50 rounded-[16px] flex flex-col items-center justify-center space-y-6 py-20 border border-zinc-200/80"
          >
            <TebyanLoader
              size={48}
              label={language === 'ar' ? 'جاري التبسيط' : 'Simplifying'}
              statusText={language === 'ar' ? 'جاري اختزال المفهوم وتبسيطه…' : 'Simplifying the concept…'}
            />
          </motion.div>
        ) : output && (
          <div id="concepts-results" className="space-y-4">
            <div className={cn("prose md:prose-lg p-8 rounded-[16px] overflow-hidden border shadow-[0_2px_8px_rgba(0,0,0,0.04)]", isBrutalMode ? "bg-white border-[#6E5B91]/30 text-[#182231] prose-headings:text-rose-400 prose-strong:text-rose-200 prose-ol:text-[#64788D] prose-ul:text-[#64788D] prose-li:marker:text-rose-600 prose-a:text-[#6E5B91] leading-relaxed font-serif rtl:font-sans py-8" : "bg-white border-zinc-200/80 prose-zinc font-serif rtl:font-sans py-8 leading-relaxed text-zinc-800")}>
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
                  ? "bg-[#6E5B91] text-white"
                  : "bg-zinc-100 text-[#64788D] hover:bg-zinc-200"
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
